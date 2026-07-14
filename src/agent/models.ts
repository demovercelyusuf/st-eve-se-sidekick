// Everything routes through AI Gateway (plain provider/model strings — the gateway is the
// default provider). Sonnet 5 does the reasoning and writing; Haiku 4.5 is the cheap, fast
// one we lean on for stage classification and eval scoring. Swapping either is a one-line
// change, which is half the point of routing through the gateway.
export const GENERATION_MODEL = "anthropic/claude-sonnet-5";
export const CLASSIFY_MODEL = "anthropic/claude-haiku-4.5";

// We can only reach the gateway with a key locally, or OIDC on Vercel. When neither is
// present, st-eve falls back to a deterministic brief so the app still runs and demos.
export const gatewayReady = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
