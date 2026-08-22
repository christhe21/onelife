import { cn } from "@/lib/utils";

/** Same-size helmet mark for every overall rank tier. */
export const RANK_ICON_SRC: Record<string, string> = {
  Beginner: "/ranks/beginner.svg",
  Intermediate: "/ranks/intermediate.svg",
  Advanced: "/ranks/advanced.svg",
  Professional: "/ranks/professional.svg",
  Master: "/ranks/master.svg",
  Grandmaster: "/ranks/grandmaster.svg",
  Epic: "/ranks/epic.svg",
  Legendary: "/ranks/legendary.svg",
  One: "/ranks/one.svg",
};

export function RankIcon({
  rank,
  className,
  title,
}: {
  rank: string;
  className?: string;
  title?: string;
}) {
  const src = RANK_ICON_SRC[rank] ?? RANK_ICON_SRC.Beginner;
  return (
    <img
      src={src}
      alt=""
      title={title ?? rank}
      draggable={false}
      className={cn(
        "pointer-events-none select-none object-contain object-center",
        "dark:invert",
        className,
      )}
    />
  );
}
