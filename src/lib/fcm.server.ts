// Firebase Cloud Messaging (HTTP v1) sender for the Android shell.
// Access tokens are minted from a service-account JSON stored in the
// FCM_SERVICE_ACCOUNT secret, signed with WebCrypto so it runs on the edge.

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function readServiceAccount(): ServiceAccount | null {
  const raw = process.env["FCM_SERVICE_ACCOUNT"];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** True when FCM credentials are configured. */
export function isFcmConfigured(): boolean {
  return readServiceAccount() !== null;
}

async function getAccessToken(sa: ServiceAccount): Promise<string | null> {
  const enc = new TextEncoder();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(
    enc.encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    ),
  );
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(sa.private_key) as unknown as BufferSource,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      enc.encode(`${header}.${claim}`) as unknown as BufferSource,
    ),
  );
  const assertion = `${header}.${claim}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

export interface FcmResult {
  ok: boolean;
  status: number;
  /** True when the device token is no longer valid. */
  expired: boolean;
}

/** Sends a notification to one FCM device token. */
export async function sendFcm(
  token: string,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<FcmResult> {
  const sa = readServiceAccount();
  if (!sa) return { ok: false, status: 0, expired: false };
  const accessToken = await getAccessToken(sa);
  if (!accessToken) return { ok: false, status: 0, expired: false };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: payload.title, body: payload.body },
          data: {
            url: payload.url ?? "/",
            tag: payload.tag ?? "",
          },
          android: { priority: "HIGH" },
        },
      }),
    },
  );

  return {
    ok: res.ok,
    status: res.status,
    expired: res.status === 404 || res.status === 403,
  };
}
