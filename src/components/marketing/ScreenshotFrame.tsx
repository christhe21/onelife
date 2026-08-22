import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}

export function ScreenshotFrame({ src, alt, caption, className }: Props) {
  return (
    <figure className={cn("group", className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-foreground/5 transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transform-none">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        </div>
        <img src={src} alt={alt} loading="lazy" className="block w-full" />
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
