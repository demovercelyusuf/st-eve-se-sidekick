import posthog from "posthog-js";

// Autocapture already records every click and pageview. This is for the handful of events that
// carry product meaning — a brief generated, a Slack update posted, a question asked — so the
// funnels read in the SE's language, not the DOM's. No-ops when PostHog isn't configured (the env
// key is inlined at build, so this whole call compiles out where the key is absent).
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, props);
}
