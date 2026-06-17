// Celebration helpers: confetti + chime when the user completes things.
// Only fires while the Frieren theme is active (and SFX setting is on).

import confetti from "canvas-confetti";

type Kind = "task" | "milestone" | "goal";

const STORAGE_KEY = "life-manager:v1";

// Royalty-free chimes from Mixkit (stable CDN URLs).
const SFX_URLS: Record<Kind, string> = {
  task: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
  milestone: "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3",
  goal: "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3",
};

const audioCache = new Map<string, HTMLAudioElement>();

function isFrierenWithSfx(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const s = parsed?.settings ?? {};
    if (s.themeColor !== "frieren") return false;
    return s.frierenSfx !== false; // default on
  } catch {
    return false;
  }
}

function playChime(kind: Kind) {
  if (typeof window === "undefined") return;
  const url = SFX_URLS[kind];
  let base = audioCache.get(url);
  if (!base) {
    base = new Audio(url);
    base.preload = "auto";
    audioCache.set(url, base);
  }
  try {
    const clip = base.cloneNode(true) as HTMLAudioElement;
    clip.volume = 0.4;
    void clip.play().catch(() => {
      /* autoplay blocked or load failed — stay silent */
    });
  } catch {
    /* ignore */
  }
}

const FRIEREN_PALETTE = ["#caa766", "#f1eee4", "#4da8a3", "#d6c690", "#8fb8b3"];

function burst(kind: Kind) {
  const opts: confetti.Options = {
    colors: FRIEREN_PALETTE,
    ticks: 200,
    scalar: 0.9,
    disableForReducedMotion: true,
  };
  if (kind === "task") {
    confetti({
      ...opts,
      particleCount: 40,
      spread: 60,
      startVelocity: 30,
      origin: { y: 0.7 },
    });
    return;
  }
  if (kind === "milestone") {
    confetti({ ...opts, particleCount: 60, spread: 80, origin: { x: 0.3, y: 0.7 } });
    confetti({ ...opts, particleCount: 60, spread: 80, origin: { x: 0.7, y: 0.7 } });
    return;
  }
  // goal — big finale
  const fire = (x: number, delay: number) =>
    window.setTimeout(
      () =>
        confetti({
          ...opts,
          particleCount: 90,
          spread: 100,
          startVelocity: 45,
          origin: { x, y: 0.65 },
        }),
      delay,
    );
  fire(0.2, 0);
  fire(0.8, 120);
  fire(0.5, 240);
}

export function celebrate(kind: Kind) {
  if (typeof window === "undefined") return;
  if (!isFrierenWithSfx()) return;
  burst(kind);
  playChime(kind);
}
