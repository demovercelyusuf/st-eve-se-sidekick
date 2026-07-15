"use client";

import { useState } from "react";
import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { formatArr, priorityBadge } from "@/lib/ui";
import { PRIORITY_LABEL, STAGE_LABEL, STAGE_ORDER, type Priority, type Stage } from "@/lib/domain";
import { updateAccountAction } from "@/app/actions";
import { track } from "@/lib/analytics";

export type BoardCard = {
  id: string;
  name: string;
  industry: string;
  arr: number;
  stage: Stage;
  priority: Priority;
  atRisk: boolean;
};

// The board is the same patch as the Command Center, laid out by stage. Dragging a card is just
// another way to restage — it lands on the same server action, so it persists to Neon and the
// eval keeps grading the agent's inference against the (pinned) truth, not this live board.
export function KanbanBoard({ initial, canEdit }: { initial: BoardCard[]; canEdit: boolean }) {
  const [cards, setCards] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  function drop(stage: Stage) {
    const id = dragId;
    setOver(null);
    setDragId(null);
    if (!id) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.stage === stage) return;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, stage } : c)));
    track("account_stage_changed", { from: card.stage, to: stage });
    updateAccountAction(id, { stage });
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STAGE_ORDER.map((stage) => {
        const column = cards.filter((c) => c.stage === stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              if (canEdit && dragId) {
                e.preventDefault();
                setOver(stage);
              }
            }}
            onDragLeave={() => setOver((s) => (s === stage ? null : s))}
            onDrop={() => drop(stage)}
            className={`flex w-56 shrink-0 flex-col gap-2 rounded-[var(--radius)] border p-2 transition-colors ${
              over === stage ? "border-accent bg-accent-soft/40" : "border-border bg-bg"
            }`}
          >
            <div className="flex items-center justify-between px-1 py-0.5 text-[11px] font-semibold text-sub">
              <span>{STAGE_LABEL[stage]}</span>
              <span className="tabular-nums">{column.length}</span>
            </div>

            {column.map((c) => (
              <div
                key={c.id}
                draggable={canEdit}
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOver(null);
                }}
                className={`rounded-[var(--radius)] border border-border bg-surface p-2.5 ${
                  canEdit ? "cursor-grab active:cursor-grabbing" : ""
                } ${dragId === c.id ? "opacity-40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/accounts/${c.id}`} className="text-sm font-semibold leading-tight hover:underline">
                    {c.name}
                  </Link>
                  {c.atRisk && <span className="mt-1 size-2 shrink-0 rounded-full bg-danger" title="At risk" />}
                </div>
                <div className="mt-0.5 text-xs text-sub">
                  {c.industry} · {formatArr(c.arr)}
                </div>
                <div className="mt-2">
                  <Pill tone={priorityBadge(c.priority).tone}>{PRIORITY_LABEL[c.priority]}</Pill>
                </div>
              </div>
            ))}

            {column.length === 0 && (
              <div className="rounded-[var(--radius)] border border-dashed border-border/70 px-1 py-6 text-center text-xs text-sub/50">
                nothing here
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
