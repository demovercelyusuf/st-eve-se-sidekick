CREATE TYPE "public"."activity_kind" AS ENUM('note', 'email', 'slack', 'call', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."relationship" AS ENUM('champion', 'economic_buyer', 'influencer', 'user', 'blocker');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('aligned', 'neutral', 'skeptical');--> statement-breakpoint
CREATE TYPE "public"."stage" AS ENUM('discovery', 'new_business_meeting', 'deeper_dive', 'pov', 'technical_win', 'sizing_scoping', 'quote');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"persona_id" text NOT NULL,
	"name" text NOT NULL,
	"industry" text NOT NULL,
	"arr" integer NOT NULL,
	"stage" "stage" NOT NULL,
	"priority" "priority" NOT NULL,
	"at_risk" boolean DEFAULT false NOT NULL,
	"next_step" text,
	"close_target" text,
	"am_name" text,
	"last_touch" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"kind" "activity_kind" NOT NULL,
	"summary" text NOT NULL,
	"body" text NOT NULL,
	"source" text,
	"occurred_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sfdc_summary" text NOT NULL,
	"slack_update" text NOT NULL,
	"inferred_stage" "stage" NOT NULL,
	"inferred_confidence" real NOT NULL,
	"next_steps" jsonb NOT NULL,
	"citations" jsonb NOT NULL,
	"grounded" boolean NOT NULL,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"relationship" "relationship" NOT NULL,
	"sentiment" "sentiment" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"account_count" integer NOT NULL,
	"stage_accuracy" real NOT NULL,
	"grounding_rate" real NOT NULL,
	"completeness" real NOT NULL,
	"status" text NOT NULL,
	"model" text NOT NULL,
	"cases" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personas" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"blurb" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_persona_id_personas_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."personas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_persona_idx" ON "accounts" USING btree ("persona_id");--> statement-breakpoint
CREATE INDEX "activities_account_idx" ON "activities" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "contacts_account_idx" ON "contacts" USING btree ("account_id");