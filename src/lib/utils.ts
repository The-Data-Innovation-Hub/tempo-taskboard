import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { measureFunctionExecution } from "./performance";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Performance utility functions
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
): (...args: Parameters<T>) => ReturnType<T> {
  return measureFunctionExecution(fn, name);
}

// Debounce function to improve performance for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle function to limit execution frequency
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
