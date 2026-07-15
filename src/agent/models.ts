// Everything routes through AI Gateway (plain provider/model strings — the gateway is the
// default provider). Sonnet 5 does the reasoning and writing; Haiku 4.5 is the cheap, fast
// one we lean on for stage classification and eval scoring. Swapping either is a one-line
// change, which is half the point of routing through the gateway.
export const GENERATION_MODEL = "anthropic/claude-sonnet-5";
export const CLASSIFY_MODEL = "anthropic/claude-haiku-4.5";

// We reach the gateway with a key locally, or via Vercel's OIDC token in the cloud. The catch:
// at runtime that token isn't in process.env — the SDK pulls it from the request context (it
// arrives as a header), so checking process.env.VERCEL_OIDC_TOKEN gives a false negative on a
// real deployment. So treat "running on Vercel" as ready and let the SDK resolve the token;
// only when none of these hold are we truly keyless and fall back to a deterministic brief.
export const gatewayReady = Boolean(
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL,
);
