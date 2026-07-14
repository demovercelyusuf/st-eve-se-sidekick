// The one place that knows about the four themes. The token values themselves live in
// globals.css under [data-theme="…"]; this file just carries what the picker needs to
// draw itself — a label, a blurb, a swatch.

export const THEME_COOKIE = "st-eve-theme";

export type ThemeId = "mono" | "dark" | "warm" | "expressive";

export type Theme = {
  id: ThemeId;
  label: string;
  blurb: string;
  /** the dot you see in the switcher — each theme's signature color */
  swatch: string;
};

export const THEMES: Theme[] = [
  { id: "mono", label: "Vercel mono", blurb: "black & white · Geist", swatch: "#0a0a0a" },
  { id: "dark", label: "Dark ops", blurb: "near-black · electric violet", swatch: "#b7a6ff" },
  { id: "warm", label: "Warm & human", blurb: "cream · terracotta · Poppins", swatch: "#c05c36" },
  { id: "expressive", label: "Expressive", blurb: "electric violet · Space Grotesk", swatch: "#5b2cff" },
];

// mono loads first — leading with the Vercel-native look is the right first impression here.
export const DEFAULT_THEME: ThemeId = "mono";

export function isThemeId(value: string | undefined): value is ThemeId {
  return !!value && THEMES.some((t) => t.id === value);
}
