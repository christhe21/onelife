import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  priority?: boolean;
}

export function ScreenshotFrame({ src, alt, caption, className, priority }: Props) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
  }, [src]);

  return (
    <figure className={cn("group", className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-foreground/5 transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transform-none">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        </div>
        <div className="relative aspect-[16/9] overflow-hidden bg-muted/60">
          {!loaded && (
            <div className="image-placeholder absolute inset-0" role="status" aria-label="Loading preview">
              <span className="sr-only">Loading preview</span>
              <div className="image-placeholder-bar image-placeholder-bar-one" />
              <div className="image-placeholder-bar image-placeholder-bar-two" />
              <div className="image-placeholder-panel" />
            </div>
          )}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className={cn(
              "absolute inset-0 block h-full w-full object-cover transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}
