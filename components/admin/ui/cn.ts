import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** `cn` do shadcn/ui — com tailwind-merge, só no painel (o site usa lib/utils). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
