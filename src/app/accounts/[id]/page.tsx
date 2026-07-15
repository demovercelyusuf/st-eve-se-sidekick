import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Pill } from "@/components/ui/pill";
import { StageTracker } from "@/components/account/stage-tracker";
import { AccountPanels, type ActivityRow, type TodoRow } from "@/components/account/account-panels";
import { EditableAm } from "@/components/account/editable-am";
import { getAccount, getLatestBrief, getTodos } from "@/data/repository";
import { hasDb } from "@/db/client";
import type { Priority, Stage } from "@/lib/domain";
import { formatArr, priorityBadge, relativeTime, stageBadge } from "@/lib/ui";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import { AccountBrief } from "@/components/account/account-brief";
import { gatewayReady } from "@/agent/models";

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
  const data = await getAccount(id);
  if (!data) notFound();

  const { account, contacts, activities } = data;
  const [latestBrief, todos] = await Promise.all([getLatestBrief(id), getTodos(id)]);

  // Pre-format on the server so the client tab doesn't pull in the seed anchor.
  const activityRows: ActivityRow[] = activities.map((a) => ({
    id: a.id,
    kind: a.kind,
    summary: a.summary,
    body: a.body,
    timeLabel: relativeTime(a.occurredAt, SEED_ANCHOR),
  }));
  const todoRows: TodoRow[] = todos.map((t) => ({ id: t.id, text: t.text, done: t.done, priority: t.priority, due: t.due }));

  const stage = stageBadge(account.stage as Stage);
  const priority = priorityBadge(account.priority as Priority);
  const champion = contacts.find((c) => c.relationship === "champion");
  const economicBuyer = contacts.find((c) => c.relationship === "economic_buyer");

  return (
    <AppShell>
      <div className="flex gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Link href="/app" className="text-sm font-medium text-accent">
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
            <Link
              href={`/copilot?account=${account.id}`}
              className="shrink-0 rounded-[var(--radius)] border border-border bg-surface px-3.5 py-2 text-sm font-semibold"
            >
              Ask st·eve
            </Link>
          </div>

          <AccountBrief accountId={account.id} gatewayReady={gatewayReady} initialBrief={latestBrief} />

          <section className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold">Opportunity stage</h2>
            <StageTracker stage={account.stage as Stage} />
          </section>

          <AccountPanels accountId={account.id} canEdit={hasDb} activities={activityRows} todos={todoRows} />
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold text-sub">ACCOUNT FACTS</p>
            <div className="flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-bg p-3 text-sm">
              <Kv k="Industry" v={account.industry} />
              <Kv k="ARR" v={formatArr(account.arr)} />
              <Kv k="Priority" v={priority.label} />
              <Kv k="Close target" v={account.closeTarget ?? "—"} />
              <div className="flex items-center justify-between gap-3">
                <span className="text-sub">Account mgr</span>
                <EditableAm accountId={account.id} initial={account.amName ?? ""} canEdit={hasDb} />
              </div>
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

          {!latestBrief && (
            <div className="rounded-[var(--radius)] border border-border bg-bg p-3 text-sm text-sub">
              No brief yet — hit Generate brief and st·eve drafts one straight from the timeline.
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
