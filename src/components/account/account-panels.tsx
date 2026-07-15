"use client";

import { useState, useTransition } from "react";
import { Pill } from "@/components/ui/pill";
import type { Tone } from "@/lib/ui";
import { addActivityAction, addTodoAction, deleteTodoAction, toggleTodoAction } from "@/app/actions";

type Kind = "note" | "email" | "slack" | "call" | "meeting";
export type ActivityRow = { id: string; kind: Kind; summary: string; body: string; timeLabel: string };
export type TodoRow = { id: string; text: string; done: boolean; priority: "high" | "medium" | "low"; due: string | null };

const KIND_TONE: Record<Kind, Tone> = { note: "accent", email: "info", slack: "success", call: "warn", meeting: "muted" };
const KIND_LABEL: Record<Kind, string> = { note: "Note", email: "Email", slack: "Slack", call: "Call", meeting: "Meeting" };
const KINDS: Kind[] = ["note", "email", "slack", "call", "meeting"];

export function AccountPanels({
  accountId,
  canEdit,
  activities,
  todos,
}: {
  accountId: string;
  canEdit: boolean;
  activities: ActivityRow[];
  todos: TodoRow[];
}) {
  const [tab, setTab] = useState<"activity" | "todos">("activity");
  const [acts, setActs] = useState(activities);
  const [items, setItems] = useState(todos);
  const [, start] = useTransition();
  const open = items.filter((t) => !t.done).length;

  return (
    <section className="rounded-[var(--radius)] border border-border bg-surface">
      <div className="flex items-center gap-1 border-b border-border px-2">
        <Tab active={tab === "activity"} onClick={() => setTab("activity")} label="Activity" count={acts.length} />
        <Tab active={tab === "todos"} onClick={() => setTab("todos")} label="To-dos" count={open} />
        {tab === "activity" && (
          <span className="ml-auto pr-3 text-xs text-sub">the context st·eve reads</span>
        )}
      </div>

      <div className="p-4">
        {tab === "activity" ? (
          <ActivityPanel
            accountId={accountId}
            canEdit={canEdit}
            acts={acts}
            onAdd={(a) => setActs((xs) => [a, ...xs])}
          />
        ) : (
          <TodoPanel
            accountId={accountId}
            canEdit={canEdit}
            items={items}
            setItems={setItems}
            start={start}
          />
        )}
      </div>
    </section>
  );
}

function Tab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
        active ? "border-accent text-accent" : "border-transparent text-sub hover:text-ink"
      }`}
    >
      {label} <span className="text-xs font-normal text-sub">{count}</span>
    </button>
  );
}

function ActivityPanel({
  accountId,
  canEdit,
  acts,
  onAdd,
}: {
  accountId: string;
  canEdit: boolean;
  acts: ActivityRow[];
  onAdd: (a: ActivityRow) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const kind = (f.get("kind") as Kind) ?? "note";
    const summary = String(f.get("summary") ?? "").trim();
    const body = String(f.get("body") ?? "").trim();
    if (!summary) return;
    onAdd({ id: `tmp-${summary}-${acts.length}`, kind, summary, body, timeLabel: "just now" });
    setAdding(false);
    start(() => addActivityAction(accountId, { kind, summary, body }));
  }

  const field = "rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-accent";

  return (
    <div className="flex flex-col gap-4">
      {canEdit &&
        (adding ? (
          <form onSubmit={submit} className="flex flex-col gap-2 rounded-[var(--radius)] bg-accent-soft/30 p-3">
            <div className="flex gap-2">
              <select name="kind" defaultValue="note" className={field}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              <input name="summary" placeholder="What happened?" required className={`${field} flex-1`} />
            </div>
            <textarea name="body" placeholder="Detail (what was said, what's next)…" rows={2} className={field} />
            <div className="flex gap-2">
              <button type="submit" className="rounded-[var(--radius)] bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg">
                Log activity
              </button>
              <button type="button" onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm text-sub hover:text-ink">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="self-start text-sm font-medium text-accent hover:underline"
          >
            + Log activity
          </button>
        ))}

      <ol className="flex flex-col gap-4">
        {acts.map((a) => (
          <li key={a.id} className="flex gap-3">
            <div className="w-20 shrink-0 pt-0.5">
              <Pill tone={KIND_TONE[a.kind]}>{KIND_LABEL[a.kind]}</Pill>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{a.summary}</div>
              {a.body && <p className="mt-1 text-[13px] leading-relaxed text-sub">{a.body}</p>}
            </div>
            <div className="w-16 shrink-0 pt-0.5 text-right text-xs text-sub">{a.timeLabel}</div>
          </li>
        ))}
        {acts.length === 0 && <li className="py-6 text-center text-sm text-sub">No activity logged yet.</li>}
      </ol>
    </div>
  );
}

function TodoPanel({
  accountId,
  canEdit,
  items,
  setItems,
  start,
}: {
  accountId: string;
  canEdit: boolean;
  items: TodoRow[];
  setItems: React.Dispatch<React.SetStateAction<TodoRow[]>>;
  start: React.TransitionStartFunction;
}) {
  const [text, setText] = useState("");

  async function add() {
    const t = text.trim();
    if (!t) return;
    setText("");
    const row = await addTodoAction(accountId, t);
    if (row) setItems((xs) => [row, ...xs]);
  }

  function toggle(id: string, done: boolean) {
    setItems((xs) => xs.map((t) => (t.id === id ? { ...t, done } : t)));
    start(() => toggleTodoAction(accountId, id, done));
  }

  function remove(id: string) {
    setItems((xs) => xs.filter((t) => t.id !== id));
    start(() => deleteTodoAction(accountId, id));
  }

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder="Add a to-do…"
            className="flex-1 rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={add}
            className="rounded-[var(--radius)] bg-accent px-3 py-2 text-sm font-medium text-accent-fg"
          >
            Add
          </button>
        </div>
      )}

      <ul className="flex flex-col">
        {items.map((t) => (
          <li key={t.id} className="flex items-center gap-3 border-b border-border py-2 last:border-0">
            <input
              type="checkbox"
              checked={t.done}
              disabled={!canEdit}
              onChange={(e) => toggle(t.id, e.target.checked)}
              className="size-4 shrink-0 accent-[var(--accent)]"
            />
            <span className={`flex-1 text-sm ${t.done ? "text-sub line-through" : ""}`}>{t.text}</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Delete to-do"
                className="text-sub hover:text-danger"
              >
                ✕
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="py-6 text-center text-sm text-sub">
            {canEdit ? "No to-dos yet — add the first one above." : "No to-dos."}
          </li>
        )}
      </ul>
    </div>
  );
}
