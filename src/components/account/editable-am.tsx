"use client";

import { useState } from "react";
import { updateAccountAction } from "@/app/actions";

// The one editable field in the account facts: which AM this account rolls up to. Click to
// reassign; persists through the same account update action.
export function EditableAm({ accountId, initial, canEdit }: { accountId: string; initial: string; canEdit: boolean }) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);

  if (!canEdit) return <span className="text-right font-semibold">{value || "—"}</span>;

  if (editing) {
    return (
      <input
        autoFocus
        defaultValue={value}
        onBlur={(e) => {
          const v = e.target.value.trim();
          setValue(v);
          setEditing(false);
          updateAccountAction(accountId, { amName: v || null });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-36 rounded-[var(--radius)] border border-accent bg-bg px-1.5 py-0.5 text-right text-sm font-semibold outline-none"
      />
    );
  }

  return (
    <button type="button" onClick={() => setEditing(true)} className="text-right font-semibold hover:text-accent" title="Reassign AM">
      {value || "—"}
    </button>
  );
}
