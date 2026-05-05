export const THEME_STORAGE_KEY = "codelens.theme";

export type ThemeId =
  | "emerald"
  | "amethyst"
  | "ember"
  | "meadow"
  | "lagoon"
  | "tangerine"
  | "beacon"
  | "frost"
  | "glacier"
  | "blush"
  | "matrix"
  | "pulse"
  | "shadow"
  | "monokai"
  | "cobalt"
  | "milkshake"
  | "nightowl"
  | "rose"
  | "noir";

export type ThemeMode = "dark" | "light";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  hint: string;
  swatch: string;
  ring: string;
  mode: ThemeMode;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "emerald",
    label: "Emerald",
    hint: "Verdant green on slate",
    swatch: "#34d399",
    ring: "#6ee7b7",
    mode: "dark",
  },
  {
    id: "amethyst",
    label: "Amethyst",
    hint: "Violet glow",
    swatch: "#c4b5fd",
    ring: "#ddd6fe",
    mode: "dark",
  },
  {
    id: "ember",
    label: "Ember",
    hint: "Glowing amber",
    swatch: "#fbbf24",
    ring: "#fcd34d",
    mode: "dark",
  },
  {
    id: "lagoon",
    label: "Lagoon",
    hint: "Crisp teal on midnight",
    swatch: "#06b6d4",
    ring: "#22d3ee",
    mode: "dark",
  },
  {
    id: "tangerine",
    label: "Tangerine",
    hint: "Warm spice",
    swatch: "#ff9933",
    ring: "#ffb366",
    mode: "dark",
  },
  {
    id: "glacier",
    label: "Glacier",
    hint: "Frozen midnight",
    swatch: "#7dd3fc",
    ring: "#bae6fd",
    mode: "dark",
  },
  {
    id: "matrix",
    label: "Matrix",
    hint: "Code green on void",
    swatch: "#00ff41",
    ring: "#4dff7f",
    mode: "dark",
  },
  {
    id: "pulse",
    label: "Pulse",
    hint: "Cyan on black",
    swatch: "#00e5ff",
    ring: "#67e8f9",
    mode: "dark",
  },
  {
    id: "shadow",
    label: "Shadow",
    hint: "Graphite mono",
    swatch: "#a3a3a3",
    ring: "#d4d4d4",
    mode: "dark",
  },
  {
    id: "monokai",
    label: "Monokai",
    hint: "Sublime classic",
    swatch: "#a6e22e",
    ring: "#f92672",
    mode: "dark",
  },
  {
    id: "cobalt",
    label: "Cobalt",
    hint: "Editor blue",
    swatch: "#007acc",
    ring: "#569cd6",
    mode: "dark",
  },
  {
    id: "milkshake",
    label: "Milkshake",
    hint: "Navy + petal pink",
    swatch: "#fbcfe8",
    ring: "#f9a8d4",
    mode: "dark",
  },
  {
    id: "nightowl",
    label: "Night Owl",
    hint: "Late-night blue",
    swatch: "#82aaff",
    ring: "#c792ea",
    mode: "dark",
  },
  {
    id: "rose",
    label: "Rose",
    hint: "Crimson bloom",
    swatch: "#f43f5e",
    ring: "#fb7185",
    mode: "dark",
  },
  {
    id: "noir",
    label: "Noir",
    hint: "Black & white",
    swatch: "#ffffff",
    ring: "#d4d4d4",
    mode: "dark",
  },
  {
    id: "meadow",
    label: "Meadow",
    hint: "Cream + emerald",
    swatch: "#059669",
    ring: "#10b981",
    mode: "light",
  },
  {
    id: "beacon",
    label: "Beacon",
    hint: "Color-blind friendly",
    swatch: "#0072b2",
    ring: "#e69f00",
    mode: "light",
  },
  {
    id: "frost",
    label: "Frost",
    hint: "Ice blue daylight",
    swatch: "#38bdf8",
    ring: "#7dd3fc",
    mode: "light",
  },
  {
    id: "blush",
    label: "Blush",
    hint: "Baby pink dawn",
    swatch: "#f9a8d4",
    ring: "#fbcfe8",
    mode: "light",
  },
];

export const DEFAULT_THEME: ThemeId = "emerald";

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
