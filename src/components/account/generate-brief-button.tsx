"use client";

import { useTransition } from "react";
import { generateBriefAction } from "@/app/actions";

export function GenerateBriefButton({ accountId, hasBrief }: { accountId: string; hasBrief: boolean }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => generateBriefAction(accountId))}
      className="rounded-[var(--radius)] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg transition-opacity disabled:opacity-60"
    >
      {pending ? "Generating…" : hasBrief ? "Regenerate brief" : "Generate brief"}
    </button>
  );
}
