import {
  pgTable,
  pgEnum,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uuid,
  index,
} from "drizzle-orm/pg-core";

/*
 * The st-eve data model. Static account context (accounts, contacts, activities) is
 * synthetic and seeded; the dynamic stuff st-eve produces (briefs, eval_runs) is what
 * really earns its keep in the DB. One opportunity per account, so its fields (stage,
 * priority, close target) just live on the account — no separate table to join.
 */

// The path to a technical win, in order. `stage` is the labeled truth we show in the UI;
// the agent infers its own stage from the activities, and the eval grades one against the other.
export const stageEnum = pgEnum("stage", [
  "discovery",
  "new_business_meeting",
  "deeper_dive",
  "pov",
  "technical_win",
  "sizing_scoping",
  "quote",
]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);
export const activityKindEnum = pgEnum("activity_kind", ["note", "email", "slack", "call", "meeting"]);
export const relationshipEnum = pgEnum("relationship", [
  "champion",
  "economic_buyer",
  "influencer",
  "user",
  "blocker",
]);
export const sentimentEnum = pgEnum("sentiment", ["aligned", "neutral", "skeptical"]);

// Which SE's patch you're looking at — powers the persona switcher.
export const personas = pgTable("personas", {
  id: text("id").primaryKey(), // slug, e.g. "you"
  name: text("name").notNull(),
  blurb: text("blurb").notNull(), // "2 AM patches · 18 accounts"
});

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(), // slug, e.g. "acme-robotics"
    personaId: text("persona_id")
      .notNull()
      .references(() => personas.id),
    name: text("name").notNull(),
    industry: text("industry").notNull(),
    arr: integer("arr").notNull(), // annual recurring revenue, whole USD
    stage: stageEnum("stage").notNull(), // labeled ground truth, and what the list shows
    priority: priorityEnum("priority").notNull(),
    atRisk: boolean("at_risk").notNull().default(false),
    nextStep: text("next_step"), // current top action; null = "awaiting next step"
    closeTarget: text("close_target"), // "Q3 FY26"
    amName: text("am_name"), // account manager this account rolls up to
    lastTouch: timestamp("last_touch", { withTimezone: true }).notNull(),
  },
  (t) => [index("accounts_persona_idx").on(t.personaId)],
);

export const contacts = pgTable(
  "contacts",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    name: text("name").notNull(),
    title: text("title").notNull(),
    relationship: relationshipEnum("relationship").notNull(),
    sentiment: sentimentEnum("sentiment").notNull(),
  },
  (t) => [index("contacts_account_idx").on(t.accountId)],
);

// The raw context st-eve reads and cites. Every claim in a brief has to point back to
// one of these by id — that's the whole grounding story.
export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey(), // stable slug so citations survive re-seeds
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    kind: activityKindEnum("kind").notNull(),
    summary: text("summary").notNull(), // one-liner for the timeline
    body: text("body").notNull(), // the actual content the agent reasons over
    source: text("source"), // "#acme-eval", "eng lead email", ...
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("activities_account_idx").on(t.accountId)],
);

// A single prioritized action. Kept as a shared type because both the seed's "current
// plan" and the agent's generated next steps use the exact same shape.
export type NextStep = {
  priority: "high" | "medium" | "low";
  text: string;
  owner: string;
  due?: string;
  citations: string[]; // activity ids
};

export type Citation = { label: string; activityId: string };

// What a "Generate brief" run produces and we hand to the UI / Salesforce / Slack.
export const briefs = pgTable("briefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // plain reference, not a DB foreign key — accounts live in the seed / the CRM, not this DB,
  // so a FK here would just reject every insert against an empty accounts table.
  accountId: text("account_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sfdcSummary: text("sfdc_summary").notNull(),
  slackUpdate: text("slack_update").notNull(),
  inferredStage: stageEnum("inferred_stage").notNull(),
  inferredConfidence: real("inferred_confidence").notNull(), // 0..1
  nextSteps: jsonb("next_steps").$type<NextStep[]>().notNull(),
  citations: jsonb("citations").$type<Citation[]>().notNull(),
  grounded: boolean("grounded").notNull(), // did every claim resolve to a real activity?
  meta: jsonb("meta").$type<{ model: string; latencyMs: number; tokens: number }>(),
});

// One run of the eval harness over the labeled set — the "production thinking" scorecard.
export const evalRuns = pgTable("eval_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  accountCount: integer("account_count").notNull(),
  stageAccuracy: real("stage_accuracy").notNull(), // 0..1
  groundingRate: real("grounding_rate").notNull(),
  completeness: real("completeness").notNull(),
  status: text("status").notNull(), // "pass" | "warn"
  model: text("model").notNull(),
  cases: jsonb("cases")
    .$type<
      {
        accountId: string;
        predictedStage: string;
        actualStage: string;
        grounded: boolean;
        complete: boolean;
      }[]
    >()
    .notNull(),
});

// A lightweight to-do per account — the SE's own checklist, separate from the agent's
// generated next steps (those live on the brief). This is user-owned, mutable state.
export const todos = pgTable(
  "todos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(), // plain ref, same reasoning as briefs
    text: text("text").notNull(),
    done: boolean("done").notNull().default(false),
    priority: priorityEnum("priority").notNull().default("medium"),
    due: text("due"), // freeform — "Fri", "before EOQ"
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("todos_account_idx").on(t.accountId)],
);

export type Persona = typeof personas.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Brief = typeof briefs.$inferSelect;
export type EvalRun = typeof evalRuns.$inferSelect;
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export type AccountSeed = typeof accounts.$inferInsert;
export type ContactSeed = typeof contacts.$inferInsert;
export type ActivitySeed = typeof activities.$inferInsert;
