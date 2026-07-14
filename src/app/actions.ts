"use server";

import { revalidatePath } from "next/cache";
import { generateBrief } from "@/agent/generate-brief";
import { getAccount, getLatestBrief } from "@/data/repository";
import { salesforce } from "@/adapters/salesforce";
import { slack } from "@/adapters/slack";

export async function generateBriefAction(accountId: string) {
  await generateBrief(accountId);
  // re-render the detail page so the fresh brief shows up
  revalidatePath(`/accounts/${accountId}`);
}

export async function copyToSalesforceAction(accountId: string) {
  const brief = await getLatestBrief(accountId);
  const ctx = getAccount(accountId);
  if (!brief || !ctx) return { ok: false, note: "Generate a brief first." };
  return salesforce.pushSummary({
    accountId,
    accountName: ctx.account.name,
    summary: brief.sfdcSummary,
  });
}

export async function postToSlackAction(accountId: string) {
  const brief = await getLatestBrief(accountId);
  const ctx = getAccount(accountId);
  if (!brief || !ctx) return { ok: false, note: "Generate a brief first." };
  return slack.postUpdate({ accountName: ctx.account.name, text: brief.slackUpdate });
}
