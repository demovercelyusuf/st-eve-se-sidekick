// The seam. st-eve only ever talks to these interfaces, so swapping a mock for the real
// thing (Vercel Connect for Salesforce, a live webhook for Slack) never touches the agent
// or the UI — you change one implementation and flip an env var.

export interface SalesforceAdapter {
  /** Write the weekly summary back onto the account's opportunity. */
  pushSummary(input: {
    accountId: string;
    accountName: string;
    summary: string;
  }): Promise<{ ok: boolean; opportunityUrl?: string; note: string }>;
}

export interface SlackAdapter {
  /** Post a Slack-friendly update to the account team channel. */
  postUpdate(input: {
    accountName: string;
    text: string;
    channel?: string;
  }): Promise<{ ok: boolean; note: string }>;
}
