// Stage/priority vocabulary shared by the UI, the agent, and the eval so nobody drifts.
// STAGE_ORDER is the source of truth for "how far along" — the stage tracker and any
// "is this further than X?" checks both index into it.

export const STAGE_ORDER = [
  "discovery",
  "new_business_meeting",
  "deeper_dive",
  "pov",
  "technical_win",
  "sizing_scoping",
  "quote",
] as const;

export type Stage = (typeof STAGE_ORDER)[number];
export type Priority = "high" | "medium" | "low";

export const STAGE_LABEL: Record<Stage, string> = {
  discovery: "Discovery",
  new_business_meeting: "New Business Mtg",
  deeper_dive: "Deeper Dive",
  pov: "POV",
  technical_win: "Technical Win",
  sizing_scoping: "Sizing / Scoping",
  quote: "Quote",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

export function stageIndex(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

// Anything at or past a technical win counts as a "win" for the patch KPIs.
export function isWin(stage: Stage): boolean {
  return stageIndex(stage) >= stageIndex("technical_win");
}
