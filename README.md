# st-eve

**A grounded copilot for solutions engineers.** I carry a shifting patch of accounts — often spanning more than one account manager, sometimes more than one patch. st-eve turns the raw context of that patch — meeting notes, emails, Slack threads — into decisions I can act on, so my hours go to customers, not status updates.

The name's a pun on *Steve*, the copilot. The *eve* half nods to Vercel's agent framework — [why I didn't build on it](#decisions--trade-offs-the-interesting-part) is below.

**Live:** <https://st-eve-se-sidekick.vercel.app>

## The problem

The hard part of the job isn't any one account — it's *all of them, at once*. Every day is context-switching: reconstruct where a deal stands before a call, write a weekly summary to paste into Salesforce, post a Slack update to the account channel, decide the next step and how urgent it is, and keep a mental model of what stage each opportunity is really in. Multiply that across the patch and most of the week goes to reporting *about* the work instead of doing it — and things quietly slip: an account goes dark, a champion leaves, a next step never gets set.

st-eve does the reconstructing and the drafting. I stay on the accounts; it handles the busywork and makes sure nothing falls through the cracks.

## What it does

Everything is one grounded agent behind two surfaces.

- **Weekly brief** — one pass over an account's activity timeline produces a **Salesforce-ready summary**, a **Slack update**, prioritized **next steps**, and an **inferred stage with a confidence** — every claim cited to a real activity, streamed as it writes. Ungrounded claims are dropped and the brief is flagged *needs review*; it never invents facts. **Copy to Salesforce** puts the summary on the clipboard; **Post to Slack** renders a real Slack message — channel, the SE's name, and the time it posts — and delivers it through the webhook.
- **st-eve Copilot** — the same agent as a chat, on a floating dock across the app and full-screen at `/copilot`. Ask anything about the patch; it pulls the real context with read-only tools *before* it answers, and **shows which tools it called and which model handled it**. No account is a black box.
- **Command Center** (`/app`) — the whole patch on one screen, sorted by priority, with live KPIs (at-risk, awaiting a next step, technical wins). Edit priority, next step, stage, account managers, and the buying committee inline; add or drop accounts; filter by stage / priority / AM.
- **Board** — the same patch as a drag-and-drop Kanban by opportunity stage; move a card to restage a deal and it persists everywhere.
- **Patch Health** — st-eve's self-check: does every opportunity have a stage, a next step, a champion, a close target, and a recent touch? It names the gaps, then reads each account's recent activity with a fast model and flags the ones quietly stalling. This is the eval — legible, in plain English, not a confusion matrix.

A public **landing page** at `/` frames the value and drops you into the app; the whole thing re-skins live across four themes.

## How it works

Full diagram in [Figma](https://www.figma.com/design/oNqoh4wj7AszkEHIzmF5hY?node-id=57-2). In short:

```
Landing /   ·   Command Center /app   ·   Board   ·   Copilot (dock + /copilot)
        │  server components (stream the patch) + server actions (every edit)
        ▼
   ONE GROUNDED AGENT  (AI SDK v7)                 ──►  AI Gateway  (OIDC, no keys)
     brief: streamObject → summary · Slack · steps · stage    Sonnet 5 — reason + write
     copilot: ToolLoopAgent → list_patch, get_account_context Haiku 4.5 — classify (momentum)
     grounding + citation validation → grounded | needs review
        │
        ├─►  Neon Postgres + Drizzle   (accounts, contacts, activities, to-dos, briefs)
        ├─►  Slack adapter  (REAL Incoming Webhook)   ·   Salesforce → Connect seam (roadmap)
        └─►  Patch Health eval  (coverage checks + Haiku momentum)
```

- **Next.js 16 (App Router)** on Fluid Compute. Read surfaces are server components that stream; briefs, edits, and the health check run through **server actions** and **route handlers** (`/api/brief`, `/api/copilot`).
- **AI SDK v7** for the agent. The brief **streams** as a structured object (`streamObject`); the copilot is a `ToolLoopAgent` with read-only tools. Same brain, two surfaces.
- **AI Gateway, tiered Claude, for real:** **Sonnet 5** reasons and writes; **Haiku 4.5** does the cheap classification in Patch Health. One string per model, provider failover for free.
- **Neon Postgres + Drizzle** persist the live patch, contacts, to-dos, and generated briefs. The demo data is a **versioned synthetic seed** of real Vercel customers with believable sales motions — deterministic, and it doubles as Patch Health's pinned ground truth. The app **self-provisions and seeds Neon on first request**, so there's nothing to run by hand.
- **Adapters** keep integrations behind one seam. **Slack is real** via an Incoming Webhook; the Salesforce write-back is the documented Vercel Connect seam (today the UI copies the summary to the clipboard).

## Decisions & trade-offs (the interesting part)

- **Kill the context-switch, don't add features.** Every surface exists to collapse "where does this stand / what's next / who do I tell" into one place. The depth is the grounding and the health check — not feature count.
- **Grounding is a product behavior, not a prompt.** Every citation is validated against a real activity id; anything that doesn't resolve is dropped and the brief is marked *needs review*. That's an anti-hallucination guarantee I can stand behind in front of a customer.
- **Patch Health over a confusion matrix.** An eval only matters if the person relying on it understands it. Coverage checks + a momentum read answer "is anything slipping?" in plain English — and the momentum read is a genuine cheap-model classification, so the tiered-model architecture isn't just a diagram.
- **Built on the AI SDK directly, not on `eve` — on purpose.** `eve` is Vercel's filesystem-first durable-agent framework, and it's what makes the name work, but it's still beta. For a live demo I want reliability, so st-eve runs on the **stable AI SDK that eve is built on**. `eve` is the clear productionization path — durable sessions and Agent Runs observability. Knowing when *not* to reach for the shiny feature is the point.
- **Synthetic data + swappable adapters.** Real Vercel customers, invented sales motions, no real customer data in a repo reviewers read. Slack is already real; the rest are the documented Connect seam.
- **Secrets never touch the repo.** No standing API key: the gateway authenticates with **OIDC** on Vercel (the token resolves at runtime), Neon's `DATABASE_URL` is a Sensitive env var, and the Slack webhook is Sensitive too. The DB credential can't even be pulled to a laptop — which is the point.

## Running it

```bash
pnpm install
pnpm dev      # http://localhost:3000 — runs on a deterministic fallback, no secrets needed
pnpm eval     # Patch Health from the CLI (non-zero exit if any coverage check has a gap)
```

**Zero config by default** — with no gateway credential, brief generation and the momentum read fall back gracefully; with no `DATABASE_URL`, the app reads the in-repo seed. On Vercel it's the real thing: Sonnet 5 + Haiku 4.5 via OIDC, and Neon self-seeds on first request. See `.env.local.example`.

## Design

- **Architecture diagram** — <https://www.figma.com/design/oNqoh4wj7AszkEHIzmF5hY?node-id=57-2>
- **Figma file** (wireframes, the four-theme matrix, the landing) — <https://www.figma.com/design/oNqoh4wj7AszkEHIzmF5hY>
- **Deployed** — <https://st-eve-se-sidekick.vercel.app>
