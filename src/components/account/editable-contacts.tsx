"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { addContactAction, deleteContactAction, updateContactAction } from "@/app/actions";

type Relationship = "champion" | "economic_buyer" | "influencer" | "user" | "blocker";
export type ContactRow = { id: string; name: string; title: string; relationship: Relationship };

const REL_LABEL: Record<Relationship, string> = {
  champion: "Champion",
  economic_buyer: "Economic buyer",
  influencer: "Influencer",
  user: "User",
  blocker: "Blocker",
};
const RELATIONSHIPS = Object.keys(REL_LABEL) as Relationship[];

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// The buying committee, editable in place. Click a name or title to rename, change the relationship
// from the dropdown, add or remove people — every edit persists through the contact actions and
// re-flows the Champion / Economic-buyer facts in the sidebar.
export function EditableContacts({
  accountId,
  contacts,
  canEdit,
}: {
  accountId: string;
  contacts: ContactRow[];
  canEdit: boolean;
}) {
  const [rows, setRows] = useState(contacts);
  const [adding, setAdding] = useState(false);
  const [, start] = useTransition();

  function patch(id: string, p: Partial<ContactRow>) {
    setRows((xs) => xs.map((c) => (c.id === id ? { ...c, ...p } : c)));
    start(() => updateContactAction(accountId, id, p));
  }
  function remove(id: string) {
    setRows((xs) => xs.filter((c) => c.id !== id));
    start(() => deleteContactAction(accountId, id));
  }
  async function add(name: string, title: string, relationship: Relationship) {
    setAdding(false);
    const row = await addContactAction(accountId, { name, title, relationship });
    if (row) setRows((xs) => [...xs, row as ContactRow]);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-sub">KEY CONTACTS</p>
        {canEdit && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs font-medium text-accent hover:underline"
          >
            + Add
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {rows.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: -12 }}
              transition={{ duration: 0.18 }}
              className="group flex items-center gap-3"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {initials(c.name)}
              </div>
              <div className="min-w-0 flex-1">
                <InlineText
                  value={c.name}
                  canEdit={canEdit}
                  onSave={(v) => patch(c.id, { name: v })}
                  className="text-sm font-semibold"
                />
                <InlineText
                  value={c.title}
                  canEdit={canEdit}
                  placeholder="Add a title"
                  onSave={(v) => patch(c.id, { title: v })}
                  className="text-xs text-sub"
                />
              </div>
              {canEdit ? (
                <select
                  value={c.relationship}
                  onChange={(e) => patch(c.id, { relationship: e.target.value as Relationship })}
                  aria-label={`${c.name} relationship`}
                  className="shrink-0 rounded-[var(--radius)] border border-transparent bg-transparent py-0.5 text-[11px] text-sub outline-none hover:border-border focus:border-accent"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {REL_LABEL[r]}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="shrink-0 text-[11px] text-sub">{REL_LABEL[c.relationship]}</span>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  aria-label={`Remove ${c.name}`}
                  className="shrink-0 text-sub opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {adding && <AddContact onAdd={add} onCancel={() => setAdding(false)} />}

        {rows.length === 0 && !adding && (
          <p className="text-xs text-sub">No contacts yet{canEdit ? " — add the first one." : "."}</p>
        )}
      </div>
    </div>
  );
}

function InlineText({
  value,
  onSave,
  canEdit,
  className,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  canEdit: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  if (!canEdit) return <div className={`truncate ${className}`}>{value || placeholder}</div>;
  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        onBlur={(e) => {
          setEditing(false);
          const v = e.target.value.trim();
          if (v && v !== value) onSave(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className={`w-full rounded border border-accent bg-bg px-1 outline-none ${className}`}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Click to edit"
      className={`block max-w-full truncate text-left hover:text-accent ${className} ${value ? "" : "italic text-sub/70"}`}
    >
      {value || placeholder}
    </button>
  );
}

function AddContact({
  onAdd,
  onCancel,
}: {
  onAdd: (name: string, title: string, relationship: Relationship) => void;
  onCancel: () => void;
}) {
  const field = "w-full rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-accent";
  return (
    <motion.form
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("name") ?? "").trim();
        const title = String(f.get("title") ?? "").trim();
        if (!name) return;
        onAdd(name, title, (f.get("relationship") as Relationship) ?? "influencer");
      }}
      className="flex flex-col gap-2 rounded-[var(--radius)] bg-accent-soft/30 p-3"
    >
      <input name="name" placeholder="Name" required className={field} />
      <input name="title" placeholder="Title" className={field} />
      <select name="relationship" defaultValue="influencer" className={field}>
        {RELATIONSHIPS.map((r) => (
          <option key={r} value={r}>
            {REL_LABEL[r]}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className="rounded-[var(--radius)] bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg"
        >
          Add contact
        </motion.button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-sub hover:text-ink">
          Cancel
        </button>
      </div>
    </motion.form>
  );
}
