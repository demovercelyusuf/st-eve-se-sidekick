import { AppShell } from "@/components/app-shell";
import { PatchHealthPanel } from "@/components/evals/patch-health-panel";

function Item({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-[13px] leading-relaxed text-sub">{body}</div>
    </div>
  );
}

// "Patch Health" is the eval, reframed to be legible: coverage (does every opp have the basics)
// + a Haiku momentum read + the standing grounding guarantee. Runs against the pinned seed.
export default function EvalsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header>
            <h1 className="text-xl font-bold">Patch health</h1>
            <p className="text-sm text-sub">
              st·eve checks your whole patch for gaps and flags the accounts quietly stalling — so nothing slips.
            </p>
          </header>
          <PatchHealthPanel />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-72">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">WHAT ST·EVE CHECKS</p>
            <div className="flex flex-col gap-3">
              <Item
                title="Coverage"
                body="Every opportunity has a stage, a next step, a champion, a close target, and a touch in the last 21 days."
              />
              <Item
                title="Momentum"
                body="st·eve reads each account's recent activity with a fast model and flags the ones stalling or at risk."
              />
              <Item
                title="Grounded briefs"
                body="Every brief st·eve writes cites a real activity — it never invents facts."
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">MODEL ROUTING · AI GATEWAY</p>
            <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-bg p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sub">Momentum · classify</span>
                <span className="font-semibold">Claude Haiku 4.5</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sub">Briefs + chat · reason</span>
                <span className="font-semibold">Claude Sonnet 5</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
