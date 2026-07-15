# st-eve

**An AI sidekick for solutions engineers.** I carry a shifting patch of 10–30 accounts across a few account managers. st-eve turns the raw context of that patch — meeting notes, emails, Slack threads — into decisions I can act on, so I spend my time on the accounts instead of the reporting.

The name is a pun: *Steve*, the copilot, built around *eve* (Vercel's agent framework). More on that below.

## The problem

The hard part of the job isn't any one account — it's *all of them, at once*. Every day is context-switching: reconstruct where a deal stands before a call, write a weekly summary to paste into Salesforce, post a Slack update to the account channel, decide the next step and how urgent it is, and keep a mental model of what stage each opportunity is really in. Multiply that by 18 accounts and two-thirds of the week is spent reporting *about* the work instead of doing it — and things quietly slip: an account goes dark, a champion leaves, a next step never gets set.

st-eve does the reconstructing and the drafting. I stay on the accounts; it handles the busywork and makes sure nothing falls through the cracks.

## What it does

- **Command Center** — my whole patch on one screen, sorted by priority, with live KPIs (at-risk, awaiting a next step, technical wins). Edit a priority or a next step inline, add or drop an account, filter by stage / priority / AM. This is the "reconstruct everything in five seconds" view.
- **Board** — the same patch as a drag-and-drop Kanban by opportunity stage. Move a card to restage a deal; it persists everywhere.
- **st-eve, everywhere** — a floating copilot on every page. Ask anything about the patch in a terminal-style chat; it pulls the real context with read-only tools before it answers and **shows you which tools it called and which model handled it**. No account is a black box.
- **Generate brief** — one grounded pass over an account's activity produces a **Salesforce-ready summary**, a **Slack update**, prioritized **next steps**, and an **inferred stage with a confidence** — every claim cited to a real activity. Then **Copy to Salesforce** (mock) or **Post to Slack** (real). Ungrounded claims are dropped and the brief is flagged *needs review* — it never invents facts.
- **Activities & to-dos** — per account: the full activity timeline st-eve reads, plus your own checklist.
- **Patch Health** — st-eve's self-check: does every opportunity have a stage, a next step, a champion, a close target, and a recent touch? It names the gaps. Then it reads each account's recent activity with a fast model and flags the ones quietly stalling. This is the eval — legible, not a confusion matrix.

## How it works

```
Command Center · Board · Account · st-eve dock (chat)
        │  server components + server actions
        ▼
   st-eve agent (AI SDK v7)  ──►  AI Gateway
     tools: list_patch, get_account_context        Sonnet 5  — reasoning + writing
     grounded briefs · cited · needs-review         Haiku 4.5 — classify (patch momentum)
        │
   data adapters:  Salesforce (mock) · Slack (real webhook)
        ▼
   Neon Postgres + Drizzle  (accounts, briefs, to-dos)
```

- **Next.js 16 (App Router)** on Fluid Compute. Read surfaces are server components; briefs, edits, and the health check run through **server actions**.
- **AI SDK v7** for the agent. Briefs are a single grounded structured pass (`generateText` + `Output.object`); the copilot is a `ToolLoopAgent` with read-only tools.
- **AI Gateway, tiered Claude, for real:** **Sonnet 5** does the reasoning and writing; **Haiku 4.5** does the cheap classification in Patch Health. One string swap per model, provider failover for free — the cost/latency story, actually wired.
- **Neon Postgres + Drizzle** persist the live patch, generated briefs, and to-dos. The demo data is a **versioned synthetic seed** of real Vercel customers with believable sales motions — deterministic, and it doubles as Patch Health's pinned ground truth. The app **self-provisions and seeds Neon on first request**, so there's nothing to run by hand.
- **Adapters** keep integrations behind one seam. **Slack is real** via an Incoming Webhook; Salesforce, Google Calendar, and Notion are on the roadmap through Vercel Connect.

## Decisions & trade-offs (the interesting part)

- **Kill the context-switch, don't add features.** Every surface exists to collapse "where does this stand / what's next / who do I tell" into one place. The depth is the grounding and the health check, not feature count.
- **Grounding is a product behavior, not a prompt.** Every citation is validated against a real activity id; anything that doesn't resolve is dropped and the brief is marked *needs review*. That's the anti-hallucination guarantee I can stand behind in front of a customer.
- **Patch Health over a confusion matrix.** An eval only matters if the person relying on it understands it. Coverage checks + a momentum read answer "is anything slipping?" in plain English — and the momentum read is a genuine cheap-model classification, so the tiered-model architecture isn't just a diagram.
- **Built on the AI SDK directly, not on `eve` — on purpose.** `eve` is Vercel's filesystem-first durable-agent framework and it's what makes the name work, but it's still beta. For a live demo I want reliability, so st-eve runs on the **stable AI SDK that eve is built on**. `eve` is the clear productionization path — durable sessions and Agent Runs observability in the Vercel dashboard. Knowing when *not* to reach for the shiny feature is the point.
- **Synthetic data + swappable adapters.** Real Vercel customers, invented sales motions, no real customer data in a repo reviewers read. Slack is already real; the rest are the documented Connect seam.
- **Secrets never touch the repo.** No standing API key: the gateway authenticates with **OIDC** on Vercel (the token is resolved at runtime), Neon's `DATABASE_URL` is a Sensitive env var, and the Slack webhook is Sensitive too. The DB credential can't even be pulled to a laptop — which is the point.

## Running it

```bash
pnpm install
pnpm dev      # http://localhost:3000 — runs on a deterministic fallback, no secrets needed
pnpm eval     # Patch Health from the CLI (non-zero exit if any coverage check has a gap)
```

**Zero config by default** — with no gateway credential, brief generation and the momentum read fall back gracefully; with no `DATABASE_URL`, the app reads the in-repo seed. On Vercel it's the real thing: Sonnet 5 + Haiku 4.5 via OIDC, and Neon self-seeds on first request. See `.env.local.example`.

## Design

- **Figma** — wireframes (desktop + mobile), the four-theme matrix, and the system architecture: <https://www.figma.com/design/oNqoh4wj7AszkEHIzmF5hY>
- **Deployed** — <https://st-eve-se-sidekick.vercel.app>
