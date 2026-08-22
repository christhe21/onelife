import { APP_ICON, APP_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  alt = APP_NAME,
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={APP_ICON}
      alt={alt}
      width={32}
      height={32}
      className={cn("h-8 w-8 rounded-xl shadow-sm", className)}
    />
  );
}
