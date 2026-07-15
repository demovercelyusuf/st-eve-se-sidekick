import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/ui/pill";
import { slackChannel, slackConfigured } from "@/adapters/slack";
import type { Tone } from "@/lib/ui";

type Integration = {
  id: string;
  name: string;
  badge: string;
  desc: string;
  live: boolean; // working today vs. on the roadmap
  status: string;
  tone: Tone;
  note?: string;
};

// Slack is the one real integration; the rest are honest about being roadmap.
const integrations: Integration[] = [
  {
    id: "slack",
    name: "Slack",
    badge: "#",
    desc: "st-eve posts your account updates straight to the channel via an Incoming Webhook.",
    live: true,
    status: slackConfigured ? "Connected" : "Setup needed",
    tone: slackConfigured ? "success" : "warn",
    note: slackConfigured ? `Posting to ${slackChannel}` : "Add SLACK_WEBHOOK_URL to connect your workspace",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    badge: "SF",
    desc: "Sync opportunities, activities, and stages; write weekly summaries back to the opportunity.",
    live: false,
    status: "Coming soon",
    tone: "muted",
    note: "Roadmap · Q4",
  },
  {
    id: "calendar",
    name: "Google Calendar",
    badge: "GC",
    desc: "Pull upcoming meetings into account context and next steps.",
    live: false,
    status: "Coming soon",
    tone: "muted",
    note: "Roadmap · Q4",
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
            <p className="text-sm text-sub">Connect your data sources.</p>
          </header>

          <div className="rounded-[var(--radius)] bg-accent-soft p-4">
            <div className="text-sm font-semibold text-accent">How st-eve connects</div>
            <p className="mt-1 text-[13px] leading-relaxed text-accent">
              Slack is live via an Incoming Webhook — st-eve posts your updates straight to the
              channel, and the URL lives in an env var, never in the repo. Salesforce and Calendar
              are on the Q4 roadmap; they&apos;ll connect through Vercel Connect, so the platform
              manages the OAuth tokens and the same tool code talks to the real APIs.
            </p>
          </div>

          {integrations.map((it) => (
            <div
              key={it.id}
              className={`flex items-center gap-4 rounded-[var(--radius)] border border-border bg-surface p-4 ${
                it.live ? "" : "opacity-55"
              }`}
            >
              <div
                className={`grid size-11 shrink-0 place-items-center rounded-[var(--radius)] text-sm font-bold ${
                  it.status === "Connected" ? "bg-success-soft text-success" : "bg-muted-soft text-muted"
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
                {it.note && <p className="mt-1 text-xs text-sub">{it.note}</p>}
              </div>
            </div>
          ))}
        </div>

        <aside className="flex w-72 shrink-0 flex-col gap-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">DATA st-eve READS</p>
            <div className="flex flex-col gap-1.5 text-sm">
              {["Opportunities & stages", "Activities — notes, emails", "Slack threads", "Meetings — roadmap"].map(
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
              The Slack webhook lives in a Sensitive env var, and the roadmap integrations will use
              Vercel Connect — never in the repo, committed env files, or the commit history.
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
