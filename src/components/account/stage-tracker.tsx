import { STAGE_LABEL, STAGE_ORDER, stageIndex, type Stage } from "@/lib/domain";

// The path to a technical win, left to right. Past stages read done, the current one is
// filled in the accent, the rest sit muted — so "how far along" is legible at a glance.
export function StageTracker({ stage }: { stage: Stage }) {
  const current = stageIndex(stage);

  return (
    <div className="flex flex-wrap gap-2">
      {STAGE_ORDER.map((s, i) => {
        const done = i < current;
        const isCurrent = i === current;
        return (
          <span
            key={s}
            aria-current={isCurrent ? "step" : undefined}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
              isCurrent
                ? "bg-accent text-accent-fg"
                : done
                  ? "bg-accent-soft text-accent"
                  : "bg-muted-soft text-muted"
            }`}
          >
            {done ? `✓ ${STAGE_LABEL[s]}` : STAGE_LABEL[s]}
          </span>
        );
      })}
    </div>
  );
}
