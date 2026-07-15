"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { formatArr, priorityBadge, stageBadge, TONE_CLASS } from "@/lib/ui";
import { PRIORITY_LABEL, STAGE_LABEL, STAGE_ORDER, type Priority, type Stage } from "@/lib/domain";
import { addAccountAction, deleteAccountAction, updateAccountAction } from "@/app/actions";

// The row shape the server hands down — lastTouch is pre-formatted so we don't drag the seed
// anchor into the client bundle.
export type PatchRowData = {
  id: string;
  name: string;
  industry: string;
  arr: number;
  stage: Stage;
  priority: Priority;
  atRisk: boolean;
  amName: string | null;
  nextStep: string | null;
  touchLabel: string;
};

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const COL = "flex items-center gap-4 px-4 py-3";
const FILTER = "rounded-[var(--radius)] border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-accent";

export function PatchTable({ initial, canEdit }: { initial: PatchRowData[]; canEdit: boolean }) {
  // Local, optimistic copy of the patch. Server actions persist in the background; a reload
  // reconciles from Neon. Keeps edits feeling instant instead of waiting on a round trip.
  const [rows, setRows] = useState(initial);
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Filters — all client-side over the loaded patch, so they're instant.
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [am, setAm] = useState<string>("all");
  const [atRiskOnly, setAtRiskOnly] = useState(false);
  const filtersOn = q !== "" || stage !== "all" || priority !== "all" || am !== "all" || atRiskOnly;

  // The AMs actually present in the patch, for the filter dropdown.
  const amOptions = [...new Set(rows.map((r) => r.amName).filter((x): x is string => Boolean(x)))].sort();

  const filtered = rows.filter((r) => {
    if (q && !`${r.name} ${r.nextStep ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (stage !== "all" && r.stage !== stage) return false;
    if (priority !== "all" && r.priority !== priority) return false;
    if (am !== "all" && r.amName !== am) return false;
    if (atRiskOnly && !r.atRisk) return false;
    return true;
  });

  function patch(id: string, change: { priority?: Priority; nextStep?: string | null }) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...change } : r)));
    startTransition(() => updateAccountAction(id, change));
  }

  function remove(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
    setConfirming(null);
    startTransition(() => deleteAccountAction(id));
  }

  function clearFilters() {
    setQ("");
    setStage("all");
    setPriority("all");
    setAm("all");
    setAtRiskOnly(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search accounts + next steps…"
          className={`${FILTER} w-64`}
        />
        <select value={stage} onChange={(e) => setStage(e.target.value as Stage | "all")} className={FILTER}>
          <option value="all">All stages</option>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "all")} className={FILTER}>
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <select value={am} onChange={(e) => setAm(e.target.value)} className={FILTER}>
          <option value="all">All AMs</option>
          {amOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setAtRiskOnly((v) => !v)}
          className={`rounded-[var(--radius)] border px-3 py-1.5 text-sm font-medium ${
            atRiskOnly ? "border-danger bg-danger-soft text-danger" : "border-border text-sub hover:text-ink"
          }`}
        >
          At risk
        </button>
        {filtersOn && (
          <button type="button" onClick={clearFilters} className="px-2 py-1.5 text-sm text-sub hover:text-ink">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-sub">
          {filtered.length} of {rows.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
        <div className={`${COL} bg-bg py-2.5 text-[11px] font-semibold text-sub`}>
          <span className="w-56 shrink-0">ACCOUNT</span>
          <span className="w-40 shrink-0">STAGE</span>
          <span className="w-24 shrink-0">PRIORITY</span>
          <span className="flex-1">NEXT STEP</span>
          {canEdit && <span className="w-8 shrink-0" />}
        </div>

        {filtered.map((r) => {
          const stageInfo = stageBadge(r.stage);
          return (
            <div key={r.id} className={`${COL} border-t border-border hover:bg-accent-soft/30`}>
              <Link href={`/accounts/${r.id}`} className="w-56 shrink-0">
                <div className="truncate text-sm font-semibold hover:underline">{r.name}</div>
                <div className="truncate text-xs text-sub">
                  {r.industry} · {formatArr(r.arr)}
                </div>
              </Link>

              <div className="w-40 shrink-0">
                <Pill tone={stageInfo.tone}>{stageInfo.label}</Pill>
              </div>

              <div className="w-24 shrink-0">
                {canEdit ? (
                  <select
                    value={r.priority}
                    onChange={(e) => patch(r.id, { priority: e.target.value as Priority })}
                    aria-label={`Priority for ${r.name}`}
                    className={`cursor-pointer appearance-none rounded-full px-2.5 py-1 text-xs font-medium outline-none ${TONE_CLASS[priorityBadge(r.priority).tone]}`}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Pill tone={priorityBadge(r.priority).tone}>{PRIORITY_LABEL[r.priority]}</Pill>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {editing === r.id ? (
                  <input
                    autoFocus
                    defaultValue={r.nextStep ?? ""}
                    onBlur={(e) => {
                      patch(r.id, { nextStep: e.target.value.trim() || null });
                      setEditing(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className="w-full rounded-[var(--radius)] border border-accent bg-bg px-2 py-1 text-sm outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setEditing(r.id)}
                    className="block w-full truncate text-left text-sm hover:text-accent disabled:cursor-default disabled:hover:text-ink"
                    title={canEdit ? "Click to edit" : undefined}
                  >
                    {r.nextStep ?? <span className="text-sub">No next step yet — click to add</span>}
                  </button>
                )}
                <div className="text-xs text-sub">{r.touchLabel}</div>
              </div>

              {canEdit && (
                <div className="flex w-8 shrink-0 justify-end">
                  {confirming === r.id ? (
                    <span className="flex items-center gap-1 text-xs">
                      <button type="button" onClick={() => remove(r.id)} className="font-semibold text-danger">
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirming(null)} className="text-sub">
                        ✕
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(r.id)}
                      aria-label={`Remove ${r.name}`}
                      className="text-sub hover:text-danger"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="border-t border-border px-4 py-10 text-center text-sm text-sub">
            {rows.length === 0 ? "No accounts in this patch yet." : "No accounts match these filters."}
          </div>
        )}

        {canEdit && (
          <div className="border-t border-border">
            {adding ? (
              <AddAccountForm
                onCancel={() => setAdding(false)}
                onAdded={(row) => {
                  setRows((rs) => [row, ...rs]);
                  setAdding(false);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="w-full px-4 py-3 text-left text-sm font-medium text-accent hover:bg-accent-soft/40"
              >
                + Add account
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AddAccountForm({ onCancel, onAdded }: { onCancel: () => void; onAdded: (row: PatchRowData) => void }) {
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    if (!name) return;
    setBusy(true);
    const input = {
      name,
      industry: String(f.get("industry") ?? "").trim() || "Software",
      arr: Number(f.get("arr")) || 0,
      stage: (f.get("stage") as Stage) ?? "discovery",
      priority: (f.get("priority") as Priority) ?? "medium",
      amName: String(f.get("amName") ?? "").trim() || null,
      nextStep: String(f.get("nextStep") ?? "").trim() || null,
    };
    const id = await addAccountAction(input);
    setBusy(false);
    if (id) onAdded({ id, atRisk: false, touchLabel: "just now", ...input });
    else onCancel(); // no DB (seed mode) — nothing persisted
  }

  const field = "rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-accent";

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 bg-accent-soft/30 px-4 py-3">
      <div className="flex flex-wrap gap-2">
        <input name="name" placeholder="Account name" required className={`${field} flex-1`} />
        <input name="industry" placeholder="Industry" className={`${field} w-40`} />
        <input name="arr" type="number" placeholder="ARR (USD)" className={`${field} w-32`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <select name="stage" defaultValue="discovery" className={field}>
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="priority" defaultValue="medium" className={field}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <input name="amName" placeholder="Account manager" className={`${field} w-44`} />
        <input name="nextStep" placeholder="Next step" className={`${field} flex-1`} />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-[var(--radius)] bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add account"}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-sub hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
