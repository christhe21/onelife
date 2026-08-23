import { Reveal } from "./Reveal";

interface Props {
  eyebrow?: string;
  title: string;
  desc?: string;
  align?: "left" | "center";
}

export function SectionHeading({ eyebrow, title, desc, align = "left" }: Props) {
  return (
    <Reveal>
      <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {desc && <p className="mt-3 text-sm text-muted-foreground sm:text-base">{desc}</p>}
      </div>
    </Reveal>
  );
}
