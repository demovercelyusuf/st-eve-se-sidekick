import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Reverse-proxy PostHog through our own origin (/ingest) so ad/tracker blockers don't drop
  // analytics + session recordings. /ingest/static/* serves the recorder + toolbar scripts from
  // PostHog's asset host; everything else is the ingestion API. (US cloud hosts.)
  async rewrites() {
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  // Required for the PostHog proxy: don't let trailing-slash handling redirect the /ingest routes.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
