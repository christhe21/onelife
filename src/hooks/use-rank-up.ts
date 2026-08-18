import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppData } from "@/lib/app-data";
import { getRankIndex, getOverallRank } from "@/lib/rank";
import { celebrateRankUp } from "@/lib/celebrate";

const KEY = "onelife:last-rank-index";

/**
 * Watches the derived overall rank and celebrates when it increases.
 * Seeds from the current rank on first run so existing users are not
 * congratulated for progress they already made.
 */
export function useRankUp() {
  const { totalPoints } = useAppData();
  const seeded = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const index = getRankIndex(totalPoints ?? 0);

    let stored: number | null = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (Number.isFinite(n)) stored = n;
      }
    } catch {
      /* storage unavailable */
    }

    if (stored == null) {
      seeded.current = true;
      try {
        window.localStorage.setItem(KEY, String(index));
      } catch {
        /* ignore */
      }
      return;
    }

    if (index > stored) {
      try {
        window.localStorage.setItem(KEY, String(index));
      } catch {
        /* ignore */
      }
      const rank = getOverallRank(totalPoints ?? 0);
      toast.success(`Rank up — you are now a ${rank}`, {
        description: `${(totalPoints ?? 0).toLocaleString("en-US")} lifetime points`,
      });
      celebrateRankUp();
    } else if (index < stored) {
      // data reset / import — resync silently
      try {
        window.localStorage.setItem(KEY, String(index));
      } catch {
        /* ignore */
      }
    }
  }, [totalPoints]);
}
