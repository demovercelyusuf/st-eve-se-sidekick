import { PRIORITY_LABEL, STAGE_LABEL, type Priority, type Stage } from "@/lib/domain";

// Semantic tones map to token pairs, so pills stay legible in every theme (a warm-theme
// "success" and a dark-theme "success" both read right — the tokens do the work).
export type Tone = "accent" | "info" | "success" | "warn" | "danger" | "muted";

// Written as literal strings on purpose — Tailwind only keeps classes it can see in source.
export const TONE_CLASS: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  muted: "bg-muted-soft text-muted",
};

// Roughly: cold early on, brand at the deep-dive, warm through the POV, green once we're winning.
const STAGE_TONE: Record<Stage, Tone> = {
  discovery: "muted",
  new_business_meeting: "info",
  deeper_dive: "accent",
  pov: "warn",
  technical_win: "success",
  sizing_scoping: "success",
  quote: "accent",
};

const PRIORITY_TONE: Record<Priority, Tone> = { high: "danger", medium: "warn", low: "muted" };

export function stageBadge(stage: Stage) {
  return { label: STAGE_LABEL[stage], tone: STAGE_TONE[stage] };
}

export function priorityBadge(priority: Priority) {
  return { label: PRIORITY_LABEL[priority], tone: PRIORITY_TONE[priority] };
}

export function formatArr(usd: number): string {
  return usd >= 1_000_000 ? `$${(usd / 1_000_000).toFixed(1)}M` : `$${Math.round(usd / 1000)}k`;
}

// "now" is passed in (the seed anchor) so the demo's sense of time matches the seeded
// dates rather than the wall clock.
export function relativeTime(date: Date, now: Date): string {
  const days = Math.round((now.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}
