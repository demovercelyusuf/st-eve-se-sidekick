// PostHog product analytics, initialized in Next's client instrumentation hook so it loads before
// hydration. Autocapture (clicks, inputs, SPA pageviews) and session recording are on by default;
// geoIP is resolved server-side by PostHog at ingestion, so every visitor lands on the map without
// any client code. Events route through /ingest — a same-origin reverse proxy (see next.config.ts) —
// so content blockers don't silently drop them.
//
// The project key is a write-only public key by design (it can send events, never read data), so it
// ships in the client bundle. We still read it from env so it's set per-environment and only the
// environments that have it configured emit — no local/preview noise unless we opt in.
import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-06-25", // pageview + pageleave + history-change autocapture, sensible modern preset
    person_profiles: "always", // give anonymous visitors a profile too, so geoIP locations populate
  });
}
