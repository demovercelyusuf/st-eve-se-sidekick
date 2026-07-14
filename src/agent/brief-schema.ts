import { z } from "zod";

// The exact shape st-eve has to produce for a brief. The model fills this in; we then
// check every citation resolves to a real activity before we trust it.
export const briefSchema = z.object({
  inferredStage: z
    .enum([
      "discovery",
      "new_business_meeting",
      "deeper_dive",
      "pov",
      "technical_win",
      "sizing_scoping",
      "quote",
    ])
    .describe("The opportunity stage you infer purely from the activities."),
  inferredConfidence: z.number().min(0).max(1).describe("How sure you are, 0 to 1."),
  sfdcSummary: z
    .string()
    .describe("A Salesforce-ready weekly summary. Cite claims inline as [1], [2] mapping to citations."),
  slackUpdate: z
    .string()
    .describe("A short, Slack-friendly update for the account team channel. Plain text with bullets."),
  nextSteps: z
    .array(
      z.object({
        priority: z.enum(["high", "medium", "low"]),
        text: z.string(),
        owner: z.string().describe("Who owns it — usually 'You' or the AM."),
        due: z.string().optional(),
        citations: z.array(z.string()).describe("activity ids that justify this step"),
      }),
    )
    .max(5)
    .describe("The most important next steps, most important first."),
  citations: z
    .array(z.object({ label: z.string(), activityId: z.string() }))
    .describe("Every source you leaned on, in [n] order. activityId must be a real activity id."),
});

export type BriefOutput = z.infer<typeof briefSchema>;
