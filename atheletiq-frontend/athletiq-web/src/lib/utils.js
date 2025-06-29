// src/lib/utils.js

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes and conditionals cleanly.
 * Usage: className={cn("p-2", someFlag && "bg-green-500")}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
