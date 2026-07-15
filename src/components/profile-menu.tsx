"use client";

import { useEffect, useRef, useState } from "react";
import { updateProfileAction } from "@/app/actions";

// The identity chip in the top bar, now a real menu: rename yourself and see which AMs you're
// aligned to across the patch.
export function ProfileMenu({
  name,
  accountCount,
  ams,
  canEdit,
}: {
  name: string;
  accountCount: number;
  ams: string[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState(name);
  const ref = useRef<HTMLDivElement>(null);

  // Mirror display into a ref so the click-outside handler saves the *current* value — the
  // mousedown that closes the menu fires before the input's blur, so we can't rely on onBlur.
  const displayRef = useRef(display);
  displayRef.current = display;

  function saveName() {
    const n = displayRef.current.trim() || "You";
    setDisplay(n);
    if (n !== name) updateProfileAction(n);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        saveName();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, name]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-muted-soft px-3 py-1.5 text-[13px] hover:bg-muted-soft/70"
      >
        <span className="font-medium">SE: {display}</span>
        <span className="text-sub">
          {ams.length} AM patches · {accountCount} accounts
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-[var(--radius)] border border-border bg-surface p-4 shadow-lg">
          <p className="mb-1 text-[11px] font-semibold text-sub">YOUR NAME</p>
          <input
            value={display}
            disabled={!canEdit}
            onChange={(e) => setDisplay(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="w-full rounded-[var(--radius)] border border-border bg-bg px-2.5 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-60"
          />

          <p className="mb-2 mt-4 text-[11px] font-semibold text-sub">ALIGNED TO {ams.length} AMS</p>
          <div className="flex flex-wrap gap-1.5">
            {ams.map((am) => (
              <span key={am} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                {am}
              </span>
            ))}
            {ams.length === 0 && <span className="text-xs text-sub">No AMs on the patch yet.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
