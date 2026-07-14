"use client";

import { useTransition } from "react";
import { runEvalsAction } from "@/app/actions";

export function RunEvalsButton({ hasRuns }: { hasRuns: boolean }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => runEvalsAction())}
      className="rounded-[var(--radius)] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
    >
      {pending ? "Running…" : hasRuns ? "Re-run evals" : "Run evals"}
    </button>
  );
}
