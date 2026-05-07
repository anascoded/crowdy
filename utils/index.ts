import { CrowdLevel } from "@/types";

/**
 * Extracts and returns the first name from a given full name string.
 * If no full name is provided, a default value of 'User' is returned.
 *
 * @param {string} [fullName] - The full name string from which the first name is extracted.
 * @returns {string} The first name extracted from the full name or 'User' if no name is provided.
 */
export const getFirstName = (fullName?: string): string => {
  if (!fullName) return 'User';
  return fullName.split(' ')[0];
};

/**
 * Format a relative time string from an ISO date.
 * E.g. "just now", "3m ago", "1h ago"
 */
export function formatRelativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(iso).toLocaleDateString();
}

/**
 * Format a date as MM/DD or MM/DD/YYYY if in a different year.
 */
export function formatDate(iso: string, includeYear = false): string {
  const date = new Date(iso);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  if (includeYear) {
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  return `${month}/${day}`;
}

/**
 * Format a number as a percentage with optional decimal places.
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get a human-readable label for a crowd level.
 */
export function getCrowdLevelLabel(level: CrowdLevel): string {
  const labels: Record<CrowdLevel, string> = {
    low: "Not busy",
    moderate: "Moderately busy",
    busy: "Busy",
    very_busy: "Very busy",
  };
  return labels[level];
}

/**
 * Get an emoji for a crowd level.
 */
export function getCrowdLevelEmoji(level: CrowdLevel): string {
  const emojis: Record<CrowdLevel, string> = {
    low: "🟢",
    moderate: "🟡",
    busy: "🟠",
    very_busy: "🔴",
  };
  return emojis[level];
}

/**
 * Estimate a crowd level from a percentage (0-100).
 */
export function estimateCrowdLevel(percentage: number): CrowdLevel {
  if (percentage < 25) return "low";
  if (percentage < 50) return "moderate";
  if (percentage < 75) return "busy";
  return "very_busy";
}

/**
 * Debounce a function — returns a debounced version that delays calls.
 * Useful for search inputs, resize handlers, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function — returns a throttled version that limits call frequency.
 * Useful for scroll handlers, resize handlers, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      fn(...args);
      lastCall = now;
    }
  };
}

/**
 * Check if a string is a valid email.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Safely parse JSON with a fallback.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clone an object (works for serializable data).
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get the distance between two coordinates in km (haversine formula).
 */
export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
