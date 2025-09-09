// Utility functions for CSS class name manipulation and merging
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility function to combine and merge CSS class names intelligently
// Combines clsx for conditional classes with twMerge for Tailwind conflict resolution
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)) // First apply clsx logic, then merge conflicting Tailwind classes
}