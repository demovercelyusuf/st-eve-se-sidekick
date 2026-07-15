import { describe, it, expect } from "vitest";
import { isWin, stageIndex } from "@/lib/domain";
import { formatArr, relativeTime, stageBadge, priorityBadge } from "@/lib/ui";

describe("domain", () => {
  it("counts a technical win (and past it) as a win, not before", () => {
    expect(isWin("technical_win")).toBe(true);
    expect(isWin("quote")).toBe(true);
    expect(isWin("pov")).toBe(false);
    expect(isWin("discovery")).toBe(false);
  });

  it("orders stages from discovery", () => {
    expect(stageIndex("discovery")).toBe(0);
    expect(stageIndex("quote")).toBeGreaterThan(stageIndex("pov"));
  });
});

describe("ui formatting", () => {
  it("formats ARR in millions or thousands", () => {
    expect(formatArr(1_200_000)).toBe("$1.2M");
    expect(formatArr(760_000)).toBe("$760k");
    expect(formatArr(150_000)).toBe("$150k");
  });

  it("renders relative time against a passed-in anchor", () => {
    const now = new Date("2026-07-15T00:00:00Z");
    expect(relativeTime(now, now)).toBe("today");
    expect(relativeTime(new Date("2026-07-09T00:00:00Z"), now)).toBe("6d ago");
    expect(relativeTime(new Date("2026-07-01T00:00:00Z"), now)).toBe("2w ago");
    expect(relativeTime(new Date("2026-05-16T00:00:00Z"), now)).toBe("2mo ago");
  });

  it("maps stages and priorities to their labels", () => {
    expect(stageBadge("pov").label).toBe("POV");
    expect(stageBadge("technical_win").label).toBe("Technical Win");
    expect(priorityBadge("high").label).toBe("High");
  });
});
