// The seam. st-eve talks to an adapter interface, so swapping a mock for the real thing never
// touches the agent or the UI — you change one implementation and flip an env var. Slack is
// wired for real (an Incoming Webhook); the Salesforce write-back is the planned Vercel Connect
// seam (today the UI copies the summary to the clipboard instead).

export interface SlackAdapter {
  /** Post a Slack-friendly update to the account team channel. */
  postUpdate(input: {
    accountName: string;
    text: string;
  }): Promise<{ ok: boolean; note: string }>;
}
