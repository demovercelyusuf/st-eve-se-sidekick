import type { SlackAdapter } from "./types";

// This one's real. If SLACK_WEBHOOK_URL is set we actually post to the workspace via an
// Incoming Webhook — no OAuth dance, because the webhook URL *is* the credential, so it
// lives in env and never in the repo. Unset (local dev without it) → we no-op and say so
// instead of pretending it worked.
const webhookUrl = process.env.SLACK_WEBHOOK_URL;

export const slackConfigured = Boolean(webhookUrl);

// Cosmetic — the webhook already targets a channel; this just lets the UI name it.
export const slackChannel = process.env.SLACK_CHANNEL ?? "your workspace";

export const slack: SlackAdapter = {
  async postUpdate({ accountName, text }) {
    if (!webhookUrl) {
      return { ok: false, note: "SLACK_WEBHOOK_URL not set — nothing posted." };
    }
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        return { ok: false, note: `Slack webhook returned ${res.status}.` };
      }
      return { ok: true, note: `Posted ${accountName}'s update to Slack.` };
    } catch (err) {
      return { ok: false, note: `Slack post failed: ${(err as Error).message}` };
    }
  },
};
