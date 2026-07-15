import { cookies } from "next/headers";
import { DEFAULT_THEME, isThemeId, THEME_COOKIE, type ThemeId } from "@/lib/themes";
import { ThemeSwitcher } from "./theme-switcher";
import { SidebarNav } from "./sidebar-nav";

/**
 * Desktop chrome — the top bar (brand, theme switcher, persona) and the workspace
 * sidebar; pages render into children. It stays a server component so it can read the
 * theme cookie and hand the switcher its starting value without a client round-trip.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const theme: ThemeId = isThemeId(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
        <span className="text-lg font-bold text-accent">st·eve</span>
        <div className="flex items-center gap-4">
          <ThemeSwitcher initial={theme} />
          <div className="flex items-center gap-2 rounded-full bg-muted-soft px-3 py-1.5 text-[13px]">
            <span className="font-medium">SE: You</span>
            <span className="text-sub">2 AM patches · 18 accounts</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-[232px] shrink-0 border-r border-border bg-surface p-4">
          <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-sub">WORKSPACE</p>
          <SidebarNav />
        </aside>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
