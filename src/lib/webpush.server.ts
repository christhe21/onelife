// Minimal Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) implementation built
// on WebCrypto so it runs on the Cloudflare Workers runtime. The `web-push`
// npm package is Node-only and cannot be used here.

const enc = new TextEncoder();

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = pad + "=".repeat((4 - (pad.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(b: Uint8Array): string {
  let s = "";
  for (const byte of b) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    "raw",
    key as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data as unknown as BufferSource));
}

/** Builds a P-256 JWK from a raw uncompressed public key plus optional `d`. */
function jwkFromRaw(pub: Uint8Array, d?: string): JsonWebKey {
  return {
    kty: "EC",
    crv: "P-256",
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    ...(d ? { d } : {}),
  };
}

export interface VapidKeys {
  publicKey: string; // base64url raw
  privateKey: string; // base64url `d`
  subject: string; // mailto: or https:
}

/** Signs the VAPID JWT for a push service origin. */
async function vapidHeader(audience: string, keys: VapidKeys): Promise<string> {
  const pub = b64urlToBytes(keys.publicKey);
  const key = await crypto.subtle.importKey(
    "jwk",
    jwkFromRaw(pub, keys.privateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = bytesToB64url(
    enc.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: keys.subject,
      }),
    ),
  );
  const unsigned = `${header}.${payload}`;
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(unsigned)),
  );
  return `vapid t=${unsigned}.${bytesToB64url(sig)}, k=${keys.publicKey}`;
}

/** Encrypts the payload for a subscription using aes128gcm. */
async function encryptPayload(
  payload: string,
  p256dh: string,
  authSecret: string,
): Promise<Uint8Array> {
  const uaPublic = b64urlToBytes(p256dh);
  const auth = b64urlToBytes(authSecret);

  const localKeys = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", localKeys.publicKey));
  const uaKey = await crypto.subtle.importKey(
    "jwk",
    jwkFromRaw(uaPublic),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, localKeys.privateKey, 256),
  );

  const prkKey = await hmac(auth, shared);
  const keyInfo = concat(enc.encode("WebPush: info\0"), uaPublic, asPublic, Uint8Array.of(1));
  const ikm = await hmac(prkKey, keyInfo);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cekBytes = (
    await hmac(prk, concat(enc.encode("Content-Encoding: aes128gcm\0"), Uint8Array.of(1)))
  ).slice(0, 16);
  const nonce = (
    await hmac(prk, concat(enc.encode("Content-Encoding: nonce\0"), Uint8Array.of(1)))
  ).slice(0, 12);

  const cek = await crypto.subtle.importKey(
    "raw",
    cekBytes as unknown as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const plaintext = concat(enc.encode(payload), Uint8Array.of(2));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as unknown as BufferSource },
      cek,
      plaintext as unknown as BufferSource,
    ),
  );

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, Uint8Array.of(asPublic.length), asPublic, ciphertext);
}

export interface WebPushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushResult {
  ok: boolean;
  status: number;
  /** True when the subscription is gone and the row should be deleted. */
  expired: boolean;
}

/** Sends one encrypted web push message. */
export async function sendWebPush(
  target: WebPushTarget,
  payload: unknown,
  keys: VapidKeys,
  ttlSeconds = 3600,
): Promise<WebPushResult> {
  const audience = new URL(target.endpoint).origin;
  const [authorization, body] = await Promise.all([
    vapidHeader(audience, keys),
    encryptPayload(JSON.stringify(payload), target.p256dh, target.auth),
  ]);

  const res = await fetch(target.endpoint, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(ttlSeconds),
      Urgency: "high",
    },
    body: body as BodyInit,
  });

  return {
    ok: res.ok,
    status: res.status,
    expired: res.status === 404 || res.status === 410,
  };
}

/** Reads VAPID configuration from the environment. Returns null when unset. */
export function readVapidKeys(): VapidKeys | null {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  if (!publicKey || !privateKey) return null;
  return {
    publicKey,
    privateKey,
    subject: process.env["VAPID_SUBJECT"] || "mailto:reminders@onelife.app",
  };
}
