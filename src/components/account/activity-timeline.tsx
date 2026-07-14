import type { Activity } from "@/db/schema";
import { Pill } from "@/components/ui/pill";
import { SEED_ANCHOR } from "@/lib/seed/accounts";
import { relativeTime, type Tone } from "@/lib/ui";

const KIND_TONE: Record<Activity["kind"], Tone> = {
  note: "accent",
  email: "info",
  slack: "success",
  call: "warn",
  meeting: "muted",
};

const KIND_LABEL: Record<Activity["kind"], string> = {
  note: "Note",
  email: "Email",
  slack: "Slack",
  call: "Call",
  meeting: "Meeting",
};

// This is the evidence st-eve grounds every brief in — so we show the full body, not just
// a headline. It's the "here's what the agent actually read" moment.
export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3">
          <div className="w-20 shrink-0 pt-0.5">
            <Pill tone={KIND_TONE[a.kind]}>{KIND_LABEL[a.kind]}</Pill>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">{a.summary}</div>
            <p className="mt-1 text-[13px] leading-relaxed text-sub">{a.body}</p>
          </div>
          <div className="w-16 shrink-0 pt-0.5 text-right text-xs text-sub">
            {relativeTime(a.occurredAt, SEED_ANCHOR)}
          </div>
        </li>
      ))}
    </ol>
  );
}
