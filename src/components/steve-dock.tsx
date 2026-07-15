"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { useState } from "react";

// st·eve, everywhere. A floating dock: the mascot waves with a greeting until you open it, then
// it's a terminal-style chat with a model-router panel that shows which model AI Gateway routed
// to and why. Same brain as the agent — grounded answers, tool calls shown.
const SUGGESTIONS = [
  "Which accounts need me this week?",
  "What's blocking Notion?",
  "Who's gone quiet?",
];

export function SteveDock({ gatewayReady }: { gatewayReady: boolean }) {
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(true);
  const [imgOk, setImgOk] = useState(true);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/copilot" }),
  });
  const busy = status === "submitted" || status === "streaming";

  function send(text: string) {
    if (!text.trim() || !gatewayReady) return;
    sendMessage({ text });
    setInput("");
  }

  const avatar = (px: number) =>
    imgOk ? (
      <Image
        src="/steve.png"
        alt="st·eve"
        width={px}
        height={px}
        priority
        onError={() => setImgOk(false)}
        className="object-contain"
      />
    ) : (
      <div style={{ width: px, height: px }} className="grid place-items-center rounded-full bg-accent text-accent-fg">
        <span aria-hidden>👋</span>
      </div>
    );

  // ---- collapsed: mascot + greeting ----
  if (!open) {
    return (
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        {greeted && (
          <div className="relative max-w-[15rem] rounded-2xl rounded-br-sm border border-border bg-surface px-3.5 py-2.5 text-[13px] leading-snug shadow-lg">
            <button
              onClick={() => setGreeted(false)}
              aria-label="Dismiss"
              className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-border bg-surface text-[10px] text-sub"
            >
              ✕
            </button>
            Hey — I&apos;m <span className="font-semibold text-accent">st·eve</span>! Ask me anything.
            What can we knock out today?
          </div>
        )}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open st·eve"
          className="grid size-16 place-items-center rounded-full border border-border bg-surface shadow-lg transition-transform hover:scale-105"
        >
          {avatar(56)}
        </button>
      </div>
    );
  }

  // ---- open: terminal chat + router panel ----
  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[32rem] w-[min(46rem,calc(100vw-2.5rem))] overflow-hidden rounded-xl border border-[#232a36] bg-[#0b0f17] font-mono text-[13px] text-[#c9d1d9] shadow-2xl">
      {/* chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-[#232a36] px-3 py-2">
          <span className="size-2.5 rounded-full bg-[#ff5f56]" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="size-2.5 rounded-full bg-[#27c93f]" />
          <span className="ml-1 text-[#8b949e]">st·eve — copilot</span>
          <button onClick={() => setOpen(false)} className="ml-auto text-[#8b949e] hover:text-[#c9d1d9]">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {messages.length === 0 && (
            <div className="text-[#8b949e]">
              <p className="mb-3">
                <span className="text-[#27c93f]">st·eve</span> ready. I pull the real account context
                before I answer — tool calls show on the right.
              </p>
              <div className="flex flex-col gap-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={!gatewayReady}
                    onClick={() => send(s)}
                    className="text-left text-[#58a6ff] hover:underline disabled:opacity-40"
                  >
                    ❯ {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id}>
                  <span className="text-[#27c93f]">❯ </span>
                  {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                </div>
              ) : (
                <div key={m.id}>
                  {m.parts.some((p) => p.type === "text") && (
                    <div className="whitespace-pre-wrap leading-relaxed text-[#c9d1d9]">
                      {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                    </div>
                  )}
                </div>
              ),
            )}
            {busy && <div className="text-[#8b949e]">st·eve is thinking▍</div>}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-[#232a36] px-3 py-2"
        >
          <span className="text-[#27c93f]">steve ❯</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!gatewayReady || busy}
            placeholder={gatewayReady ? "ask about any account…" : "AI Gateway not connected"}
            className="min-w-0 flex-1 bg-transparent text-[#c9d1d9] outline-none placeholder:text-[#4d5666]"
          />
        </form>
      </div>

      {/* model-router panel */}
      <aside className="hidden w-52 shrink-0 flex-col border-l border-[#232a36] bg-[#0d1220] px-3 py-3 text-[11px] sm:flex">
        <div className="mb-2 font-semibold text-[#8b949e]">MODEL ROUTER · AI GATEWAY</div>
        <Row label="reasoning + tools" value="claude-sonnet-5" />
        <Row label="classify / eval" value="claude-haiku-4.5" />
        <div className="my-3 border-t border-[#232a36]" />
        <div className="mb-1 font-semibold text-[#8b949e]">THIS SESSION</div>
        {messages.length === 0 ? (
          <p className="text-[#4d5666]">no calls yet</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages
              .flatMap((m) => m.parts.filter((p) => p.type.startsWith("tool-")).map((p) => p.type.slice(5)))
              .map((tool, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[#58a6ff]">
                  <span className="size-1.5 rounded-full bg-[#27c93f]" /> {tool}
                </div>
              ))}
            <div className="mt-1 text-[#4d5666]">↳ routed to sonnet-5</div>
          </div>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-[#4d5666]">{label}</div>
      <div className="text-[#58a6ff]">{value}</div>
    </div>
  );
}
