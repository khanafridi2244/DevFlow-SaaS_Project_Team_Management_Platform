import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Combines conditional classes (clsx) and resolves Tailwind conflicts
// (twMerge) in one call — e.g. cn("px-2", isActive && "px-4") correctly
// results in just "px-4" winning, not both px-2 and px-4 applied together.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}