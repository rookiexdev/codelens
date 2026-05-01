export const THEME_STORAGE_KEY = "codelens.theme";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  hint: string;
  swatch: string;
  ring: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "forest",
    label: "Forest",
    hint: "Emerald on slate",
    swatch: "#34d399",
    ring: "#6ee7b7",
  },
  {
    id: "aurora",
    label: "Aurora",
    hint: "Violet glow",
    swatch: "#c4b5fd",
    ring: "#ddd6fe",
  },
  {
    id: "sunset",
    label: "Sunset",
    hint: "Warm amber",
    swatch: "#fbbf24",
    ring: "#fcd34d",
  },
  {
    id: "daylight",
    label: "Daylight",
    hint: "Cream + emerald",
    swatch: "#059669",
    ring: "#10b981",
  },
];

export type ThemeId = "forest" | "aurora" | "sunset" | "daylight";

export const DEFAULT_THEME: ThemeId = "forest";

export const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return !!value && (THEME_IDS as string[]).includes(value);
}

export function readStoredTheme(): ThemeId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function applyTheme(theme: ThemeId): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function persistTheme(theme: ThemeId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

/**
 * Inline script content executed before paint to prevent FOUC.
 * Reads localStorage and stamps `data-theme` on <html> synchronously.
 */
export const themeBootScript = `(function(){try{var k="${THEME_STORAGE_KEY}";var v=localStorage.getItem(k);var ok=${JSON.stringify(THEME_IDS)}.indexOf(v)>=0;document.documentElement.setAttribute("data-theme",ok?v:"${DEFAULT_THEME}");}catch(e){document.documentElement.setAttribute("data-theme","${DEFAULT_THEME}");}})();`;
