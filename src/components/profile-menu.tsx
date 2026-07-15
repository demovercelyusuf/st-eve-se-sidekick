"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { resetDemoAction, updateProfileAction } from "@/app/actions";

// The identity chip in the top bar, now a real menu: rename yourself, see which AMs you're
// aligned to across the patch, and reset the demo data back to the seed.
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
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, startReset] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function saveName() {
    const n = display.trim() || "You";
    setDisplay(n);
    if (n !== name) updateProfileAction(n);
  }

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

          {canEdit && (
            <div className="mt-4 border-t border-border pt-3">
              {confirmReset ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-sub">Wipe edits, reload seed?</span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      disabled={resetting}
                      onClick={() => startReset(async () => { await resetDemoAction(); setConfirmReset(false); setOpen(false); })}
                      className="font-semibold text-danger"
                    >
                      {resetting ? "Resetting…" : "Reset"}
                    </button>
                    <button type="button" onClick={() => setConfirmReset(false)} className="text-sub">
                      Cancel
                    </button>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="text-sm font-medium text-sub hover:text-danger"
                >
                  Reset demo data
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
