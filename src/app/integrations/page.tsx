import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/ui/pill";
import { slackConfigured } from "@/adapters/slack";
import type { Tone } from "@/lib/ui";

type Integration = {
  id: string;
  name: string;
  badge: string;
  desc: string;
  status: string;
  tone: Tone;
  connected: boolean;
};

const integrations: Integration[] = [
  {
    id: "salesforce",
    name: "Salesforce",
    badge: "SF",
    desc: "Opportunities, activities, and stages sync in; weekly summaries write back to the opportunity.",
    status: "Mock",
    tone: "muted",
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    badge: "#",
    desc: "Posts st-eve's Slack-friendly updates to the account team channel.",
    status: slackConfigured ? "Connected" : "Not configured",
    tone: slackConfigured ? "success" : "muted",
    connected: slackConfigured,
  },
  {
    id: "calendar",
    name: "Google Calendar",
    badge: "GC",
    desc: "Pull upcoming meetings into account context and next steps.",
    status: "Available",
    tone: "muted",
    connected: false,
  },
];

export default function IntegrationsPage() {
  return (
    <AppShell>
      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <header>
            <p className="text-sm text-sub">Settings</p>
            <h1 className="text-xl font-bold">Integrations</h1>
            <p className="text-sm text-sub">Connect your data sources — powered by Vercel Connect.</p>
          </header>

          <div className="rounded-[var(--radius)] bg-accent-soft p-4">
            <div className="text-sm font-semibold text-accent">How st-eve connects</div>
            <p className="mt-1 text-[13px] leading-relaxed text-accent">
              In this demo the adapters return seeded data. In production, Vercel Connect manages the
              OAuth tokens for live Salesforce &amp; Slack — the same tool code talks to the real APIs
              with one env flip, and tokens never touch the repo.
            </p>
          </div>

          {integrations.map((it) => (
            <div
              key={it.id}
              className="flex items-center gap-4 rounded-[var(--radius)] border border-border bg-surface p-4"
            >
              <div
                className={`grid size-11 shrink-0 place-items-center rounded-[var(--radius)] text-sm font-bold ${
                  it.connected ? "bg-accent-soft text-accent" : "bg-muted-soft text-muted"
                }`}
              >
                {it.badge}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{it.name}</span>
                  <Pill tone={it.tone}>{it.status}</Pill>
                </div>
                <p className="mt-0.5 text-[13px] text-sub">{it.desc}</p>
              </div>
              <button
                className={`shrink-0 rounded-[var(--radius)] px-3.5 py-2 text-sm font-semibold ${
                  it.connected
                    ? "border border-border bg-surface"
                    : "bg-accent text-accent-fg"
                }`}
              >
                {it.connected ? "Manage" : "Connect"}
              </button>
            </div>
          ))}
        </div>

        <aside className="flex w-72 shrink-0 flex-col gap-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">DATA st-eve READS</p>
            <div className="flex flex-col gap-1.5 text-sm">
              {["Opportunities & stages", "Activities — notes, emails", "Slack threads", "Meetings (when connected)"].map(
                (x) => (
                  <div key={x} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {x}
                  </div>
                ),
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">SECURITY</p>
            <div className="rounded-[var(--radius)] border border-border bg-bg p-3 text-[13px] leading-relaxed text-sub">
              OAuth tokens are managed by Vercel Connect, and the Slack webhook lives in an env var —
              never in the repo, env files that get committed, or the commit history.
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
