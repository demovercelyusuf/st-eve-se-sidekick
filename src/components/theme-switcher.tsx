"use client";

import { useState } from "react";
import { THEME_COOKIE, THEMES, type ThemeId } from "@/lib/themes";
import { track } from "@/lib/analytics";

/**
 * The circle swatches. Clicking one flips data-theme on <html> for an instant re-skin
 * and drops the choice in a cookie so the server serves the same theme next load.
 * No context, no provider — the CSS variables carry all of it.
 */
export function ThemeSwitcher({ initial }: { initial: ThemeId }) {
  const [active, setActive] = useState<ThemeId>(initial);

  function pick(id: ThemeId) {
    setActive(id);
    document.documentElement.dataset.theme = id; // imperative re-skin — see eslint config note
    // keep it for a year; the server reads this on the next load
    document.cookie = `${THEME_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
    track("theme_changed", { theme: id });
  }

  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Theme">
      {THEMES.map((theme) => {
        const isActive = active === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={theme.label}
            title={`${theme.label} — ${theme.blurb}`}
            onClick={() => pick(theme.id)}
            className="grid place-items-center rounded-full transition-transform hover:scale-110"
            style={{
              width: 22,
              height: 22,
              // ring the active swatch in its own accent, with a surface-colored gap so it reads as a halo
              boxShadow: isActive
                ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${theme.swatch}`
                : undefined,
            }}
          >
            <span
              className="rounded-full border border-border"
              style={{ width: 15, height: 15, background: theme.swatch }}
            />
          </button>
        );
      })}
    </div>
  );
}
