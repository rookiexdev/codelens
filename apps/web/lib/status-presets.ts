/**
 * Slack/GitHub-style status quick-picks. The `expiresInMs` is suggestive —
 * the user can override via the expiration dropdown before saving.
 */
export interface StatusPreset {
  emoji: string;
  text: string;
  busy?: boolean;
  /** Suggested expiration (in ms from "now"). null = never. */
  expiresInMs: number | null;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const STATUS_PRESETS: StatusPreset[] = [
  { emoji: "🌴", text: "On vacation", expiresInMs: 7 * DAY },
  { emoji: "🤒", text: "Out sick", expiresInMs: DAY },
  { emoji: "🏠", text: "Working from home", expiresInMs: DAY },
  { emoji: "🎯", text: "Focusing", busy: true, expiresInMs: 4 * HOUR },
  { emoji: "💼", text: "In a meeting", busy: true, expiresInMs: HOUR },
  { emoji: "☕", text: "Coffee break", expiresInMs: 30 * 60 * 1000 },
  { emoji: "🚀", text: "Shipping it", busy: true, expiresInMs: 4 * HOUR },
  { emoji: "📚", text: "Heads-down learning", expiresInMs: 4 * HOUR },
];

/**
 * Expiration dropdown options. Order is the order they render in the UI.
 * "today" resolves to the next midnight in the user's local time zone.
 */
export type StatusExpiration =
  | "30m"
  | "1h"
  | "4h"
  | "today"
  | "this-week"
  | "never";

export const STATUS_EXPIRATION_OPTIONS: ReadonlyArray<{
  id: StatusExpiration;
  label: string;
}> = [
  { id: "30m", label: "30 minutes" },
  { id: "1h", label: "1 hour" },
  { id: "4h", label: "4 hours" },
  { id: "today", label: "Today" },
  { id: "this-week", label: "This week" },
  { id: "never", label: "Never" },
];

export function resolveExpiration(option: StatusExpiration): Date | null {
  const now = new Date();
  switch (option) {
    case "30m":
      return new Date(now.getTime() + 30 * 60 * 1000);
    case "1h":
      return new Date(now.getTime() + HOUR);
    case "4h":
      return new Date(now.getTime() + 4 * HOUR);
    case "today": {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    case "this-week": {
      const end = new Date(now);
      const dow = end.getDay(); // 0 = Sunday … 6 = Saturday
      const daysUntilSunday = (7 - dow) % 7 || 7;
      end.setDate(end.getDate() + daysUntilSunday);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    case "never":
      return null;
  }
}

/**
 * Reverse map: given an absolute expiration, snap to the closest preset
 * option for prefilling the dropdown when editing.
 */
export function classifyExpiration(
  expiresAt: Date | null,
): StatusExpiration {
  if (!expiresAt) return "never";
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 30 * 60 * 1000) return "30m";
  if (ms <= HOUR) return "1h";
  if (ms <= 4 * HOUR) return "4h";
  if (ms <= DAY) return "today";
  if (ms <= 7 * DAY) return "this-week";
  return "never";
}

/**
 * A small curated palette of work / dev emojis for the popover. Keep
 * concise; users can paste any emoji into the text input directly.
 */
export const COMMON_EMOJIS: ReadonlyArray<string> = [
  "💻",
  "🚀",
  "🎯",
  "🔥",
  "✨",
  "💡",
  "🛠️",
  "🐛",
  "📚",
  "📝",
  "🧪",
  "🧠",
  "👀",
  "🤝",
  "🙌",
  "🤖",
  "☕",
  "🍵",
  "🍕",
  "🥪",
  "🛌",
  "🌴",
  "🏖️",
  "🏠",
  "🏢",
  "✈️",
  "🚌",
  "🚲",
  "🎧",
  "🎵",
  "💼",
  "📞",
  "📅",
  "⏰",
  "🤒",
  "🤕",
  "😴",
  "🤔",
  "😅",
  "🥳",
];
