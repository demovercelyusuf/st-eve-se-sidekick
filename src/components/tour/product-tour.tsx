"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { track } from "@/lib/analytics";

// A self-guided coach-mark tour: spotlights a part of the app, explains it, and lets you click
// through or skip. It auto-starts once for a first-time visitor (so the app demos itself when
// nobody's driving) and can be replayed from the "Take a tour" button. State is a single
// localStorage flag; targets are found by [data-tour="..."], so the tour doesn't care which
// component rendered them.

export type TourStep = { target?: string; title: string; body: string };

const SEEN_KEY = "steve-tour-v1";
const START_EVENT = "steve:start-tour";
const CARD_W = 340;

// The Command Center tour. Each target is a [data-tour] element on /app.
export const APP_TOUR: TourStep[] = [
  {
    title: "Meet st·eve",
    body: "This is your patch — and the copilot that works it with you. Take the 60-second tour? You can skip anytime.",
  },
  {
    target: '[data-tour="kpis"]',
    title: "The state of your patch",
    body: "At a glance: what's at risk, what's still waiting on a next step, and what's already a technical win.",
  },
  {
    target: '[data-tour="patch"]',
    title: "Every account, sorted by who needs you",
    body: "Edit a priority or next step right in the table, filter by stage or AM, and click any row to open the account.",
  },
  {
    target: '[data-tour="nav"]',
    title: "Two more views",
    body: "Board is the same patch as a drag-and-drop Kanban by stage. Evals is st·eve's self-check across the whole patch.",
  },
  {
    target: '[data-tour="themes"]',
    title: "Make it yours",
    body: "Four skins — click a swatch and the whole app re-skins on the spot.",
  },
  {
    target: '[data-tour="dock"]',
    title: "Ask st·eve anything",
    body: "st·eve rides along on every page. Ask about any account — it pulls the real context and shows which tools it called before it answers.",
  },
  {
    title: "That's it — open an account",
    body: "Click any account to watch st·eve turn its timeline into a Salesforce summary, a Slack update, and the next move — grounded and cited. Enjoy.",
  },
];

// A small button that kicks off the tour from anywhere (it just fires the start event).
export function TourButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(START_EVENT))}
      className={`rounded-[var(--radius)] border border-border bg-surface px-3 py-1.5 text-sm font-medium text-sub transition-colors hover:text-ink ${className}`}
    >
      Take a tour
    </button>
  );
}

// Find the visible element for a tour selector. A target like the nav lives in two places on the
// page (the hidden desktop sidebar and the visible mobile hamburger); pick whichever is shown.
function visibleTarget(selector?: string): HTMLElement | null {
  if (!selector) return null;
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return els.find((e) => e.getBoundingClientRect().width > 0) ?? els[0] ?? null;
}

export function ProductTour({ steps = APP_TOUR }: { steps?: TourStep[] }) {
  // `active` only ever flips true from a client effect / user event, so the portal never renders
  // during SSR — no separate "mounted" guard needed.
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const start = useCallback(() => {
    setI(0);
    setActive(true);
  }, []);

  // manual trigger (the "Take a tour" button)
  useEffect(() => {
    window.addEventListener(START_EVENT, start);
    return () => window.removeEventListener(START_EVENT, start);
  }, [start]);

  // auto-start once for a first-time visitor
  useEffect(() => {
    if (typeof window === "undefined" || localStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => {
      setI(0);
      setActive(true);
    }, 700); // let the page settle first
    return () => clearTimeout(t);
  }, []);

  const step = steps[i];

  // Read the target's box only — no scrolling here, so the user can scroll freely during a step.
  const measure = useCallback(() => {
    const el = visibleTarget(step?.target);
    if (!el) return setRect((r) => (r === null ? r : null));
    const r = el.getBoundingClientRect();
    // getBoundingClientRect returns a fresh object each call — only update when the box moved.
    setRect((prev) =>
      prev && prev.top === r.top && prev.left === r.left && prev.width === r.width && prev.height === r.height
        ? prev
        : r,
    );
  }, [step]);

  // On step change: bring the target into view once — doing it on every scroll fought the user and
  // locked scrolling. Then re-measure a couple of times as the smooth scroll settles.
  useEffect(() => {
    if (!active) return;
    const el = visibleTarget(step?.target);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const t1 = setTimeout(measure, 300);
    const t2 = setTimeout(measure, 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, i, step, measure]);

  // Keep the spotlight glued to the target as the user scrolls or resizes — no auto-scroll.
  useEffect(() => {
    if (!active) return;
    const on = () => measure();
    window.addEventListener("scroll", on, true);
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("resize", on);
    };
  }, [active, measure]);

  const close = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — fine, it just won't remember */
    }
  }, []);
  const next = useCallback(() => {
    if (i >= steps.length - 1) {
      track("tour_completed", { steps: steps.length });
      close();
    } else setI(i + 1);
  }, [i, steps.length, close]);
  const back = useCallback(() => setI((n) => Math.max(0, n - 1)), []);

  // keyboard: Esc skips, arrows move
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, next, back, close]);

  if (!active) return null;

  const pad = 8;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const cardW = Math.min(CARD_W, vw - 28); // never wider than the screen
  const CARD_H = 240; // estimate, just for keeping the card on-screen
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

  // card placement — always fully on-screen. Below the target if it fits, else above, else pinned
  // near the bottom (for targets taller than the viewport). Centered when there's no target.
  let card: React.CSSProperties;
  if (!rect) {
    card = { left: (vw - cardW) / 2, top: Math.max(20, (vh - CARD_H) / 2) };
  } else {
    const left = clamp(rect.left + rect.width / 2 - cardW / 2, 14, vw - cardW - 14);
    let top: number;
    if (rect.bottom + 14 + CARD_H < vh) top = rect.bottom + 14;
    else if (rect.top - 14 - CARD_H > 0) top = rect.top - 14 - CARD_H;
    else top = vh - CARD_H - 20;
    card = { left, top: clamp(top, 14, vh - CARD_H - 14) };
  }

  const isLast = i === steps.length - 1;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Product tour">
      {/* Spotlight (a box-shadow cut-out). Purely visual and click-through, so the user can scroll
          and even click the highlighted element (e.g. a theme swatch) without leaving the tour. The
          full-screen dimmer only appears on the intro/outro steps, where there's nothing to click —
          click it to skip. */}
      {rect ? (
        <div
          style={{
            position: "fixed",
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            borderRadius: 14,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            transition: "all 0.25s ease",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div onClick={close} className="pointer-events-auto absolute inset-0 bg-black/55" />
      )}

      <div
        style={{ position: "fixed", width: cardW, ...card, transition: "left 0.2s ease, top 0.2s ease" }}
        className="pointer-events-auto z-[71] rounded-[calc(var(--radius)+4px)] border border-border bg-surface p-5 text-ink shadow-2xl"
      >
          <button
            type="button"
            onClick={close}
            aria-label="Skip tour"
            className="absolute right-3 top-3 text-sub hover:text-ink"
          >
            ✕
          </button>

          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
            st·eve tour · {i + 1} / {steps.length}
          </div>
          <h3 className="text-base font-bold">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-sub">{step.body}</p>

          <div className="mt-4 flex items-center gap-2">
            <div className="flex gap-1.5">
              {steps.map((_, n) => (
                <span
                  key={n}
                  className={`size-1.5 rounded-full ${n === i ? "bg-accent" : "bg-border"}`}
                />
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {i > 0 && (
                <button type="button" onClick={back} className="px-2 py-1.5 text-sm text-sub hover:text-ink">
                  Back
                </button>
              )}
              {!isLast && (
                <button type="button" onClick={close} className="px-2 py-1.5 text-sm text-sub hover:text-ink">
                  Skip
                </button>
              )}
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={next}
                className="rounded-[var(--radius)] bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-fg"
              >
                {isLast ? "Done" : i === 0 ? "Start" : "Next"}
              </motion.button>
            </div>
          </div>
      </div>
    </div>,
    document.body,
  );
}
