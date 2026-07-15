# st-eve

**An AI sidekick for solutions engineers.** Point it at a patch of 10–30 accounts and it turns the raw context — meeting notes, emails, Slack threads — into decisions you can act on: a Salesforce-ready weekly summary, a Slack update for the account channel, prioritized next steps, and where each opportunity actually sits on the path to a technical win. Every claim is grounded in a real activity, and there's an eval that keeps it honest.

The name is a pun: *Steve*, the copilot, built around *eve* (Vercel's agent framework). More on that below.

## The problem I'm solving

As a solutions engineer aligned to more than one account manager, my patch is never fixed — anywhere from 10 to 30 accounts — and the busywork scales with it: reconstructing context before every call, writing a weekly summary per account to paste into Salesforce, posting a Slack-friendly update to the account channel, deciding the next step and its priority, and keeping track of what stage each deal is really in. st-eve does the reconstructing and drafting so I spend my time on the accounts, not the reporting.

## What it does

- **Command Center** — the whole patch, sorted by priority, with live KPIs (at-risk, awaiting next step, technical wins).
- **Account Detail** — the opportunity **stage tracker**, the full **activity timeline** (this is the context st-eve reads), account facts, and contacts.
- **Generate brief** — one grounded pass over the timeline produces a Salesforce-ready summary, a Slack update, prioritized next steps, and an **inferred stage with a confidence** — every claim cited to a real activity. Ungrounded claims get dropped and the brief is flagged *needs review*. Then **Copy to Salesforce** (mock) or **Post to Slack** (real).
- **st-eve Copilot** — the same brain as a chat. Ask anything about the patch; it calls read-only tools to ground the answer and **shows you which tools it called**.
- **Evals** — the regression gate: stage-classification accuracy vs. labeled ground truth, **citation grounding (the hallucination check)**, and field completeness, behind a pass/warn threshold. Run it from the page or `pnpm eval`.
- **Four themes** — mono / dark / warm / expressive, switchable at runtime from the top bar with no reload.

## Architecture

```
Command Center + Copilot  →  st-eve agent  →  tools  →  data adapters  →  Neon Postgres
   (Next.js, server            (AI SDK v7)     (grounded,   (Salesforce mock,
    components + actions)                        cited)      Slack real webhook)
                                    │
                          AI Gateway (Sonnet 5 · Haiku 4.5)
                          Eval harness scores the tools' output
```

- **Next.js 16 (App Router)** on Fluid Compute. The read surfaces are server components; brief generation and evals run through **server actions**.
- **AI SDK v7** for the agent. Brief generation is a single grounded structured pass (`generateText` + `Output.object`); the Copilot is a `ToolLoopAgent` with read-only tools.
- **AI Gateway**, tiered Claude: **Sonnet 5** for reasoning/writing, **Haiku 4.5** available for cheap classification — one string swap, provider failover for free.
- **Neon Postgres + Drizzle** persist what st-eve generates (briefs, eval runs). Static account context is a **versioned synthetic seed** so the demo is deterministic and doubles as the eval's ground truth.
- **Adapters** keep integrations behind one seam. Salesforce is mocked (Vercel Connect is where the real write lands); **Slack is real** via an Incoming Webhook.

Full system diagram + wireframes + the four-theme matrix live in Figma (see [Design](#design)).

## Decisions & trade-offs (the interesting part)

- **Small and deep.** One agent brain, two thin surfaces. The depth is the grounding and the eval, not feature count.
- **Grounding is a product behavior, not a prompt.** Every citation is validated against a real activity id; anything that doesn't resolve is dropped and the brief is marked *needs review*. The eval turns that into a **hallucination regression check** across all 24 accounts. This is the production-thinking spine.
- **Built on the AI SDK directly, not on `eve` — on purpose.** `eve` is Vercel's filesystem-first durable-agent framework, and it's what makes the naming work, but it's still beta. For a live demo I want reliability, so st-eve runs on the **stable AI SDK that eve is itself built on** (which satisfies the "use the AI SDK" requirement cleanly). `eve` is the clear **productionization path** — durable, resumable sessions and Agent Runs observability that shows up right in the Vercel dashboard. Knowing when *not* to reach for a shiny feature is the point.
- **Synthetic data + swappable adapters.** No real customer data in a repo reviewers will read, and a deterministic demo. Vercel Connect is the documented seam for the real thing; Slack already is real.
- **Themes are just tokens.** Four themes = four CSS-variable sets under `data-theme`; the switcher flips one attribute and the whole app re-skins. That's why there's a switcher instead of a single pick.
- **Graceful fallback.** No AI Gateway key? Brief generation and evals fall back to a deterministic path so the app still runs and demos — the same instinct as the *needs review* flag.

## Running it

```bash
pnpm install
pnpm dev                             # http://localhost:3000 — runs on the fallback, no secrets needed
pnpm eval                            # the regression gate (exits non-zero on a warn)
```

**Zero config by default** — with no gateway credential, generation and evals use the deterministic fallback; with no `DATABASE_URL`, generated briefs and eval-runs live in memory.

**Secrets stay in Vercel, encrypted — never in the repo, and there's no standing API key.** The gateway authenticates with **OIDC** (automatic on Vercel; `vercel link && vercel env pull` gives a short-lived, rotating token locally — not a permanent key on disk). Neon's `DATABASE_URL` is auto-injected by the Marketplace integration, and the Slack webhook is a Sensitive env var. See `.env.local.example`.

## Design

- **Figma** — wireframes (desktop + mobile), the four-theme matrix, and the system architecture: <https://www.figma.com/design/oNqoh4wj7AszkEHIzmF5hY>
- **Deployed** — _(link once promoted to production)_
