# Contributing to st-eve

Short version: branch off `main`, let the preview deploy and the eval vouch for your change, open a PR. `main` is production — it's protected and every merge ships.

## Getting set up

```bash
pnpm install
pnpm dev      # http://localhost:3000 — runs on the fallback, no secrets needed
```

The app is designed to run with **zero config**: with no AI Gateway credential, brief generation and evals use a deterministic fallback, and with no `DATABASE_URL`, generated briefs live in memory. So you can clone and run without touching secrets. When you do need the real thing, `vercel link && vercel env pull` drops a short-lived OIDC token and the DB URL into `.env.local` — never hand-write keys.

## The workflow

This repo is trunk-based, and it leans on Vercel's Git integration:

1. **Branch off `main`** — `feat/…`, `fix/…`, `docs/…`, `chore/…`. One concern per branch.
2. **Push it.** Every branch and PR gets its own **Vercel Preview Deployment** automatically — a real URL running your change. Open it; that's your first check.
3. **Run the eval** before you ask for a merge:
   ```bash
   pnpm eval    # stage accuracy · citation grounding · field completeness
   ```
   It exits non-zero on a warn, so treat a red eval like a red build.
4. **Open a PR against `main`.** Keep it focused — the preview URL and the eval scorecard are what a reviewer looks at first.
5. **Merge.** `main` is protected (PR required, linear history), and merging deploys to production.

## Commits

Small, scoped, and written for the person reading the history later. Imperative mood, and say the *why* when it isn't obvious from the diff — that's the whole reason the message exists. Match what's already there; skim `git log` and you'll see the register.

## Code style

- TypeScript, strict. Let the types carry the contract.
- **Comments explain why, never what.** If a comment restates the code, delete it; if a reviewer would stop and ask "why this way?", that's where a comment earns its place.
- One agent brain, thin surfaces over it. New behavior usually belongs in a tool the agent can call, not a one-off in the UI.
- Every claim st-eve makes has to cite a real activity. If you touch generation, keep the grounding check honest — the eval will catch you if you don't.

## Secrets

Never commit one. Env vars live in Vercel (encrypted), the Slack webhook is a Sensitive var, and secret-scanning push protection is on — GitHub will block a push that contains a key before it ever lands. If you're reaching for `.env.local`, remember it's gitignored on purpose.
