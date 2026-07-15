"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// Product analytics. With no key configured (local dev) this is a no-op — nothing loads, nothing
// sends. On Vercel the key is set and PostHog initializes once, then we capture a $pageview on
// each App Router navigation (the SPA doesn't do full page loads, so PostHog can't see them).
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (typeof window !== "undefined" && KEY && !posthog.__loaded) {
  posthog.init(KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false, // captured manually below on route change
    capture_pageleave: true,
  });
}

export function Analytics({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (KEY) posthog.capture("$pageview");
  }, [pathname]);

  if (!KEY) return <>{children}</>;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
