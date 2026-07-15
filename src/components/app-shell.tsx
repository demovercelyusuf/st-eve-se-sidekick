import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_THEME, isThemeId, THEME_COOKIE, type ThemeId } from "@/lib/themes";
import { getPatch, getPersonas } from "@/data/repository";
import { hasDb } from "@/db/client";
import { ThemeSwitcher } from "./theme-switcher";
import { SidebarNav } from "./sidebar-nav";
import { ProfileMenu } from "./profile-menu";
import { PageTransition } from "./ui/page-transition";

/**
 * Desktop chrome — the top bar (brand, theme switcher, persona) and the workspace
 * sidebar; pages render into children. It stays a server component so it can read the
 * theme cookie and hand the switcher its starting value without a client round-trip.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const theme: ThemeId = isThemeId(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  // The header shows who you are and how many AMs you're spread across — derived from the patch.
  const [personas, patch] = await Promise.all([getPersonas(), getPatch("you")]);
  const me = personas.find((p) => p.id === "you");
  const ams = [...new Set(patch.accounts.map((a) => a.amName).filter((x): x is string => Boolean(x)))];

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
        <Link href="/app" className="text-lg font-bold text-accent">
          st·eve
        </Link>
        <div className="flex items-center gap-4">
          <div data-tour="themes">
            <ThemeSwitcher initial={theme} />
          </div>
          <ProfileMenu
            name={me?.name ?? "You"}
            accountCount={patch.accounts.length}
            ams={ams}
            canEdit={hasDb}
          />
        </div>
      </header>

      <div className="flex flex-1">
        <aside data-tour="nav" className="w-[232px] shrink-0 border-r border-border bg-surface p-4">
          <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-sub">WORKSPACE</p>
          <SidebarNav />
        </aside>
        <main className="min-w-0 flex-1 p-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
