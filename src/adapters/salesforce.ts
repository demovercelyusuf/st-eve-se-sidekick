import type { SalesforceAdapter } from "./types";

/*
 * Mock Salesforce. In production this is the one spot that changes: Vercel Connect hands
 * us a scoped OAuth token and we PATCH the Opportunity's description/next-steps fields.
 * For the demo it just echoes a believable opportunity link so the "Copy to Salesforce"
 * flow is honest about being a stub — no fake success, no real customer data.
 */
export const salesforce: SalesforceAdapter = {
  async pushSummary({ accountId, accountName }) {
    return {
      ok: true,
      opportunityUrl: `https://vercel-demo.my.salesforce.com/lightning/r/Opportunity/${accountId}/view`,
      note: `Summary staged for ${accountName}'s opportunity (mock — wire Vercel Connect to write for real).`,
    };
  },
};
