"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { hasAnswerText, thinkingLine } from "@/lib/copilot-status";
import { track } from "@/lib/analytics";

// st·eve, everywhere. A floating dock: the mascot waves with a greeting until you open it, then
// it's a terminal-style chat with a model-router panel showing which model AI Gateway routed to
// and why. Terminal structure (mono, prompt, traffic lights) but themed — colors follow the
// active theme so it never clashes with the skin you're on.
const SUGGESTIONS = ["Which accounts need me this week?", "What's blocking Notion?", "Who's gone quiet?"];

export function SteveDock({ gatewayReady }: { gatewayReady: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [greeted, setGreeted] = useState(true);
  const [imgOk, setImgOk] = useState(true);
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(false); // yellow — collapse to the title bar
  const [maximized, setMaximized] = useState(false); // green — fill the screen
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/copilot" }),
  });
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  // A conversational "what I'm doing" line while st·eve works, until its actual reply starts.
  const lastMsg = messages[messages.length - 1];
  const answering = lastMsg?.role === "assistant" && hasAnswerText(lastMsg.parts);
  const workingLine = busy && !answering ? thinkingLine(lastMsg?.role === "assistant" ? lastMsg.parts : []) : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // The landing owns its own hero mascot, and /copilot is the full-size chat — don't float over either.
  if (pathname === "/" || pathname === "/copilot") return null;

  function send(text: string) {
    if (!text.trim() || !gatewayReady) return;
    sendMessage({ text });
    track("steve_question_asked", { surface: "dock", route: pathname });
    setInput("");
  }

  // Red closes back to the mascot; yellow/green are the window controls.
  const closeDock = () => {
    setOpen(false);
    setMinimized(false);
    setMaximized(false);
  };

  const avatar = (px: number) =>
    imgOk ? (
      <Image src="/steve.png" alt="st·eve" width={px} height={px} priority onError={() => setImgOk(false)} className="object-contain" />
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
          <div className="relative max-w-[15rem] rounded-2xl rounded-br-sm border border-border bg-surface px-3.5 py-2.5 text-[13px] leading-snug text-ink shadow-lg">
            <button
              onClick={() => setGreeted(false)}
              aria-label="Dismiss"
              className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border border-border bg-surface text-[10px] text-sub"
            >
              ✕
            </button>
            Hey — I&apos;m <span className="font-semibold text-accent">st·eve</span>! Ask me anything. What can we knock out
            today?
          </div>
        )}
        <button
          data-tour="dock"
          onClick={() => setOpen(true)}
          aria-label="Open st·eve"
          className="grid size-16 place-items-center rounded-full border border-border bg-surface shadow-lg transition-transform hover:scale-105"
        >
          {avatar(56)}
        </button>
      </div>
    );
  }

  // ---- open: terminal chat + router panel (themed) ----
  // On phones the open dock is a bottom sheet (full-width, anchored to the bottom, height in dvh so
  // it sits above the keyboard); on sm+ it's the floating bottom-right panel.
  const shell = maximized
    ? "inset-3 sm:inset-6"
    : minimized
      ? "bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 sm:left-auto sm:right-5 sm:w-[min(46rem,calc(100vw-2.5rem))]"
      : "bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 h-[70dvh] sm:bottom-5 sm:left-auto sm:right-5 sm:h-[32rem] sm:w-[min(46rem,calc(100vw-2.5rem))]";

  return (
    <div
      className={`fixed z-40 flex flex-col overflow-hidden rounded-xl border border-border bg-surface font-mono text-[13px] text-ink shadow-2xl ${shell}`}
    >
      {/* title bar — the traffic lights are real window controls */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <Light color="#ff5f56" glyph="✕" title="Close" onClick={closeDock} />
        <Light
          color="#ffbd2e"
          glyph="–"
          title={minimized ? "Expand" : "Minimize"}
          onClick={() => {
            setMaximized(false);
            setMinimized((m) => !m);
          }}
        />
        <Light
          color="#27c93f"
          glyph="+"
          title={maximized ? "Restore" : "Full screen"}
          onClick={() => {
            setMinimized(false);
            setMaximized((m) => !m);
          }}
        />
        <span className="ml-1 text-sub">st·eve — copilot</span>
        <button onClick={closeDock} aria-label="Close" className="ml-auto text-sub hover:text-ink">
          ✕
        </button>
      </div>

      {/* body — hidden when minimized to the title bar */}
      <div className={`flex min-h-0 flex-1 ${minimized ? "hidden" : ""}`}>
        {/* chat column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
            <div className="text-sub">
              <p className="mb-3">
                <span className="text-success">st·eve</span> ready. I pull the real account context before I answer —
                tool calls show on the right.
              </p>
              <div className="flex flex-col gap-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={!gatewayReady}
                    onClick={() => send(s)}
                    className="text-left text-accent hover:underline disabled:opacity-40"
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
                  <span className="text-success">❯ </span>
                  {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                </div>
              ) : (
                <div key={m.id}>
                  {m.parts.some((p) => p.type === "text") && (
                    <div className="whitespace-pre-wrap leading-relaxed text-ink">
                      {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                    </div>
                  )}
                </div>
              ),
            )}
            {workingLine && <div className="text-accent">{workingLine}▍</div>}
            {error && <div className="text-danger">error: {error.message} — try again</div>}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border px-3 py-2"
        >
          <span className="text-success">steve ❯</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!gatewayReady || busy}
            placeholder={gatewayReady ? "ask about any account…" : "AI Gateway not connected"}
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-sub"
          />
        </form>
      </div>

      {/* model-router panel */}
      <aside className="hidden w-52 shrink-0 flex-col border-l border-border bg-bg px-3 py-3 text-[11px] sm:flex">
        <div className="mb-2 font-semibold text-sub">MODEL ROUTER · AI GATEWAY</div>
        <Row label="chat + tools (fast)" value="claude-haiku-4.5" />
        <Row label="brief writing" value="claude-sonnet-5" />
        <Row label="classify (patch health)" value="claude-haiku-4.5" />
        <div className="my-3 border-t border-border" />
        <div className="mb-1 font-semibold text-sub">THIS SESSION</div>
        {messages.length === 0 ? (
          <p className="text-sub/60">no calls yet</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {messages
              .flatMap((m) => m.parts.filter((p) => p.type.startsWith("tool-")).map((p) => p.type.slice(5)))
              .map((tool, i) => (
                <div key={i} className="flex items-center gap-1.5 text-accent">
                  <span className="size-1.5 rounded-full bg-success" /> {tool}
                </div>
              ))}
            <div className="mt-1 text-sub/60">↳ routed to haiku-4.5</div>
          </div>
        )}
        </aside>
      </div>
    </div>
  );
}

function Light({
  color,
  glyph,
  title,
  onClick,
}: {
  color: string;
  glyph: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="group grid size-3 place-items-center rounded-full"
      style={{ background: color }}
    >
      <span className="text-[8px] font-bold leading-none text-black/60 opacity-0 transition-opacity group-hover:opacity-100">
        {glyph}
      </span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-1.5">
      <div className="text-sub/70">{label}</div>
      <div className="text-accent">{value}</div>
    </div>
  );
}
