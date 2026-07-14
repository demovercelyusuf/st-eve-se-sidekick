import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/ui/pill";
import { StageTracker } from "@/components/account/stage-tracker";
import { ActivityTimeline } from "@/components/account/activity-timeline";
import { getAccount, getLatestBrief } from "@/data/repository";
import type { Priority, Stage } from "@/lib/domain";
import { formatArr, priorityBadge, stageBadge } from "@/lib/ui";

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sub">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = getAccount(id);
  if (!data) notFound();

  const { account, contacts, activities } = data;
  const latestBrief = await getLatestBrief(id);
  const stage = stageBadge(account.stage as Stage);
  const priority = priorityBadge(account.priority as Priority);
  const champion = contacts.find((c) => c.relationship === "champion");
  const economicBuyer = contacts.find((c) => c.relationship === "economic_buyer");

  return (
    <AppShell>
      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Link href="/" className="text-sm font-medium text-accent">
            ‹ Your patch
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{account.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Pill tone={stage.tone}>{stage.label}</Pill>
                <Pill tone={priority.tone}>{priority.label} priority</Pill>
                <span className="text-sm text-sub">
                  {account.industry} · {formatArr(account.arr)} ARR · Owner: You
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button className="rounded-[var(--radius)] border border-border bg-surface px-3.5 py-2 text-sm font-semibold">
                Ask st·eve
              </button>
              <button className="rounded-[var(--radius)] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg">
                Generate brief
              </button>
            </div>
          </div>

          <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold">Opportunity stage</h2>
            <StageTracker stage={account.stage as Stage} />
          </section>

          <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Activity timeline</h2>
              <span className="text-xs text-sub">the context st·eve reads · {activities.length} items</span>
            </div>
            <ActivityTimeline activities={activities} />
          </section>
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">ACCOUNT FACTS</p>
            <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-bg p-3 text-sm">
              <Kv k="Industry" v={account.industry} />
              <Kv k="ARR" v={formatArr(account.arr)} />
              <Kv k="Priority" v={priority.label} />
              <Kv k="Close target" v={account.closeTarget ?? "—"} />
              <Kv k="Account mgr" v={account.amName ?? "—"} />
              {champion && <Kv k="Champion" v={champion.name} />}
              {economicBuyer && <Kv k="Economic buyer" v={economicBuyer.name} />}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">KEY CONTACTS</p>
            <div className="flex flex-col gap-3">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{c.name}</div>
                    <div className="truncate text-xs text-sub">{c.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">LATEST BRIEF</p>
            <div className="rounded-[var(--radius)] border border-border bg-bg p-3 text-sm text-sub">
              {latestBrief
                ? latestBrief.sfdcSummary.slice(0, 160) + "…"
                : "No brief yet — hit Generate brief and st·eve will draft one from the timeline."}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
