import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { DEFAULT_THEME, isThemeId, THEME_COOKIE, type ThemeId } from "@/lib/themes";
import { ThemeSwitcher } from "@/components/theme-switcher";

// The public front door. One screen: the promise, proof of what st·eve produces, and a single
// way in. It renders in whatever theme the cookie holds, and the swatches in the nav re-skin it
// live — the same four themes that carry through the app. No AppShell here; the landing owns its
// own chrome so it reads as a product page, not a workspace.

export default async function Landing() {
  const cookieTheme = (await cookies()).get(THEME_COOKIE)?.value;
  const theme: ThemeId = isThemeId(cookieTheme) ? cookieTheme : DEFAULT_THEME;

  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      {/* nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold tracking-tight">
          ST<span className="text-accent">•</span>EVE
        </span>
        <nav className="flex items-center gap-5">
          <ThemeSwitcher initial={theme} />
          <Link
            href="/app"
            className="rounded-[var(--radius)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90"
          >
            Launch ST•EVE →
          </Link>
        </nav>
      </header>

      {/* hero */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-20">
          <div className="flex flex-col gap-6">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
              The vercelian SE copilot
            </span>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              Spend more time on solutions,
              <br className="hidden sm:block" /> less on status updates.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-sub">
              st·eve rebuilds each account&apos;s context, drafts the Salesforce summary and Slack
              update, and calls the next move — so your hours go to customers, not status reports.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/app"
                className="rounded-[var(--radius)] bg-accent px-5 py-3 text-base font-semibold text-accent-fg transition-opacity hover:opacity-90"
              >
                Launch ST•EVE →
              </Link>
              <span className="text-sm text-sub">Grounded in your activity timeline — every claim cited.</span>
            </div>
          </div>

          {/* proof: a weekly brief the way st·eve writes it, with the mascot presenting it */}
          <div className="relative">
            <Image
              src="/steve.png"
              alt="st·eve, the copilot mascot"
              width={132}
              height={132}
              priority
              className="absolute -top-14 -right-2 z-10 hidden object-contain drop-shadow-xl sm:block"
            />
            <BriefCard />
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="scroll-mt-8 border-t border-border py-14">
          <h2 className="mb-8 text-sm font-semibold uppercase tracking-[0.16em] text-sub">
            One agent, three jobs off your plate
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <Step
              n="01"
              title="Reconstruct the context"
              body="st·eve reads every note, email, and Slack thread on the account and rebuilds where the deal actually stands — not where the CRM says it does."
            />
            <Step
              n="02"
              title="Draft the busywork"
              body="A Salesforce-ready weekly summary and a Slack update for the account channel, written from the timeline, with every claim cited back to a real activity."
            />
            <Step
              n="03"
              title="Call the next move"
              body="Prioritized next steps with owners and due dates, so you walk into every call knowing exactly what has to happen next."
            />
          </div>
        </section>
      </main>

      {/* footer + roadmap */}
      <footer id="roadmap" className="scroll-mt-8 border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-base font-bold tracking-tight">
              ST<span className="text-accent">•</span>EVE
            </span>
            <p className="text-sm text-sub">The vercelian SE copilot · spend more time on solutions.</p>
            <p className="text-xs text-sub/70">
              A demo running on synthetic data — every account and contact is fictional.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-sub">On the roadmap</span>
            <div className="flex flex-wrap gap-2">
              <RoadmapChip label="Sign in with Vercel" when="Next" />
              <RoadmapChip label="Notion two-way sync" when="Q4" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// A static replica of a real st·eve brief — same shape and tokens as the in-app BriefView, so the
// landing shows the actual output, not a marketing abstraction of it.
function BriefCard() {
  return (
    <div className="rounded-[calc(var(--radius)+6px)] border border-border bg-surface p-6 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-sub">Weekly brief</span>
        <span className="ml-auto rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
          POV
        </span>
      </div>
      <div className="mt-1 text-lg font-semibold">Stripe · Enterprise</div>

      <div className="my-4 h-px bg-border" />

      <div className="text-[11px] font-semibold uppercase tracking-wide text-sub">Salesforce-ready summary</div>
      <p className="mt-2 text-sm leading-relaxed">
        POV is live on Fluid Compute — Priya&apos;s team validated a 40% cold-start drop on the
        checkout path <Cite>3</Cite>. Security review is the one blocker before Technical Win{" "}
        <Cite>5</Cite>.
      </p>

      <div className="mt-4 rounded-[var(--radius)] border border-border bg-bg p-3">
        <div className="text-xs font-medium text-sub">#stripe-vercel</div>
        <p className="mt-1 text-sm leading-relaxed">
          <span className="font-semibold">Stripe</span> — POV live ✅ &nbsp;Blocker: security review.
          Next: SOC 2 packet to Priya (Thu).
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-fg">
          Next
        </span>
        <span className="text-sm font-semibold">Send SOC 2 packet — you · Thu</span>
      </div>
    </div>
  );
}

function Cite({ children }: { children: React.ReactNode }) {
  return (
    <sup className="rounded bg-accent-soft px-1 text-[10px] font-semibold text-accent">[{children}]</sup>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-surface p-5">
      <span className="font-mono text-xs text-accent">{n}</span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-sub">{body}</p>
    </div>
  );
}

function RoadmapChip({ label, when }: { label: string; when: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border border-dashed px-3 py-1.5 text-xs text-sub">
      {label}
      <span className="rounded-full bg-border/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
        {when}
      </span>
    </span>
  );
}
