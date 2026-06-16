import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp an ISO YYYY-MM-DD date string within [min, max]. Lexicographic compare is correct for ISO dates. */
export function clampDate(d: string, min?: string, max?: string): string {
  if (!d) return d;
  if (min && d < min) return min;
  if (max && d > max) return max;
  return d;
}

