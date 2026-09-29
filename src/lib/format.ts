import type { ThemeColor } from '@/constants/theme';

/** "INTERMEDIATE" -> "Intermediate", "TALKING_TO_MANAGER" -> "Talking to manager". */
export function humanize(value: string): string {
  const words = value.toLowerCase().split('_');
  return [words[0].charAt(0).toUpperCase() + words[0].slice(1), ...words.slice(1)].join(' ');
}

/** Backend enums like "NEEDS_PRACTICE" become "Needs practice"; free text passes through. */
export function readinessText(label: string): string {
  return /^[A-Z_]+$/.test(label) ? humanize(label) : label;
}

export function initials(first?: string | null, last?: string | null, fallback = '?'): string {
  const letters = `${first?.trim().charAt(0) ?? ''}${last?.trim().charAt(0) ?? ''}`.toUpperCase();
  return letters || fallback.charAt(0).toUpperCase();
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "Today", "Yesterday", "3 days ago", otherwise "Sep 12". */
export function relativeDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso);
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(then)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Same thresholds everywhere a score is colored (badges, bars, charts). */
export function scoreTone(score: number): ThemeColor {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'danger';
}

/** Hex color + alpha, for tinted icon backgrounds ("#0284C7" -> "#0284C71F"). */
export function tint(hex: string, alpha = 0.12): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0')}`;
}
