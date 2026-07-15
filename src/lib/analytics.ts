import posthog from "posthog-js";

// One thin wrapper so every event name lives in one place and calls are safe when analytics is
// off (no key configured — e.g. local dev). PostHog only ever runs client-side.
export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.capture(event, props);
  }
}
