"use client";

import { useState, useTransition } from "react";
import { copyToSalesforceAction, postToSlackAction } from "@/app/actions";

type Action = (accountId: string) => Promise<{ ok: boolean; note: string }>;

export function BriefActions({ accountId }: { accountId: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; note: string } | null>(null);

  function run(action: Action) {
    start(async () => setNote(await action(accountId)));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(copyToSalesforceAction)}
        className="rounded-[var(--radius)] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg disabled:opacity-60"
      >
        Copy to Salesforce
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(postToSlackAction)}
        className="rounded-[var(--radius)] border border-border bg-surface px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
      >
        Post to Slack
      </button>
      {note && (
        <span className={`text-xs ${note.ok ? "text-success" : "text-sub"}`}>{note.note}</span>
      )}
    </div>
  );
}
