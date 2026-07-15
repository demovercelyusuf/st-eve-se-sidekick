// Everything routes through AI Gateway (plain provider/model strings — the gateway is the default
// provider), so each job gets the model that fits it and swapping any one is a one-line change.
// Sonnet 5 writes the weekly brief, where care matters more than speed. Haiku 4.5 runs the copilot
// chat, where snappy replies matter more, and it does the cheap Patch Health classification too.
// Gemini 3 Flash is the natural swap for the chat, but it needs paid gateway credits; on the free
// tier Haiku 4.5 is the fast option, and moving to Gemini later is a one-line change here.
export const GENERATION_MODEL = "anthropic/claude-sonnet-5"; // brief writing
export const COPILOT_MODEL = "anthropic/claude-haiku-4.5"; // the chat — fast (Gemini Flash = paid swap)
export const CLASSIFY_MODEL = "anthropic/claude-haiku-4.5"; // Patch Health momentum

// We reach the gateway with a key locally, or via Vercel's OIDC token in the cloud. The catch:
// at runtime that token isn't in process.env — the SDK pulls it from the request context (it
// arrives as a header), so checking process.env.VERCEL_OIDC_TOKEN gives a false negative on a
// real deployment. So treat "running on Vercel" as ready and let the SDK resolve the token;
// only when none of these hold are we truly keyless and fall back to a deterministic brief.
export const gatewayReady = Boolean(
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL,
);
