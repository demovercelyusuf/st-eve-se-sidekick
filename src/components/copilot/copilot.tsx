"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

type Focus = { id: string; name: string };

function suggestionsFor(focus?: Focus): string[] {
  const base = [
    "Which accounts need attention this week?",
    "Summarize Northwind Logistics for Salesforce",
    "Who's gone quiet in the last week?",
  ];
  return focus
    ? [`What's blocking ${focus.name} and the fastest path to a technical win?`, ...base]
    : base;
}

export function Copilot({ gatewayReady, focus }: { gatewayReady: boolean; focus?: Focus }) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/copilot" }),
  });
  const [input, setInput] = useState("");
  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    if (!text.trim() || !gatewayReady) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <div className="flex h-[calc(100dvh-7rem)] flex-col">
      <header className="pb-3">
        <h1 className="text-lg font-bold">st·eve Copilot</h1>
        <p className="text-sm text-sub">Ask across your patch — grounded answers, with the tool calls shown.</p>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-sm text-sm text-sub">
              Ask about any account and st·eve pulls the real context before it answers — you&apos;ll
              see exactly which tools it called.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestionsFor(focus).map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!gatewayReady}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-sub disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-accent px-3.5 py-2.5 text-sm text-accent-fg">
                  {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-accent">st·eve</div>
                {m.parts.some((p) => p.type.startsWith("tool-")) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-sub">called</span>
                    {m.parts.map((p, i) =>
                      p.type.startsWith("tool-") ? (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-md bg-muted-soft px-2 py-1 text-[11px] font-medium text-sub"
                        >
                          <span className="size-1.5 rounded-full bg-accent" />
                          {p.type.slice(5)}
                        </span>
                      ) : null,
                    )}
                  </div>
                )}
                {m.parts.some((p) => p.type === "text") && (
                  <div className="whitespace-pre-wrap rounded-[var(--radius)] border border-border bg-surface p-3.5 text-sm leading-relaxed">
                    {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                  </div>
                )}
              </div>
            ),
          )}
          {busy && <div className="text-xs text-sub">st·eve is thinking…</div>}
          {error && <div className="text-xs text-danger">Something went wrong — {error.message}</div>}
        </div>
      </div>

      {!gatewayReady && (
        <div className="mt-3 rounded-[var(--radius)] bg-warn-soft px-3 py-2 text-xs text-warn">
          Connect an AI Gateway key to chat with st·eve. Brief generation and evals still run on the
          deterministic fallback.
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-center gap-2 rounded-[var(--radius)] border border-border bg-surface p-2 pl-3.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!gatewayReady || busy}
          placeholder="Ask st·eve about any account…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-sub"
        />
        <button
          type="submit"
          disabled={!gatewayReady || busy || !input.trim()}
          className="rounded-[var(--radius)] bg-accent px-4 py-2 text-sm font-semibold text-accent-fg disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
