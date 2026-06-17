import { useEffect, useRef, useMemo } from "react";
import { useAppData } from "@/lib/app-data";
import { getMusicTracks } from "@/lib/music";

// Fallback track if no custom ones exist
const DEFAULT_TRACK_URL =
  "https://cdn.pixabay.com/download/audio/2022/03/15/audio_1718e0a8a3.mp3?filename=relaxing-145038.mp3";

/**
 * Plays a soft Frieren-themed ambient loop while the Frieren theme is active
 * and the user has the music toggle on. Autoplay starts after the first user
 * gesture (browsers block silent autoplay).
 */
export function FrierenAmbience() {
  const { settings } = useAppData();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks = useMemo(() => getMusicTracks(), []);

  const currentTrackUrl = settings.frierenMusicTrack
    || (tracks.length > 0 ? tracks[0].url : DEFAULT_TRACK_URL);

  const enabled =
    settings.themeColor === "frieren" && (settings.frierenMusic ?? true);
  const volume = Math.max(0, Math.min(1, (settings.frierenMusicVolume ?? 25) / 100));

  // Apply volume changes live
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Start / stop based on enabled
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!enabled) {
      audioRef.current?.pause();
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;

    const tryPlay = () => {
      el.play().catch(() => {
        // Autoplay blocked — wait for a user gesture
        const onGesture = () => {
          el.play().catch(() => {});
          window.removeEventListener("pointerdown", onGesture);
          window.removeEventListener("keydown", onGesture);
        };
        window.addEventListener("pointerdown", onGesture, { once: true });
        window.addEventListener("keydown", onGesture, { once: true });
      });
    };
    tryPlay();
    return () => {
      el.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, currentTrackUrl]);

  if (!enabled) return null;
  return (
    <audio
      key={currentTrackUrl} // Force remount if track changes to ensure clean load
      ref={audioRef}
      src={currentTrackUrl}
      loop
      preload="auto"
      aria-hidden="true"
      style={{ display: "none" }}
    />
  );
}
