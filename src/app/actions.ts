"use server";

import { revalidatePath } from "next/cache";
import { generateBrief } from "@/agent/generate-brief";
import {
  createAccount,
  deleteAccount,
  getAccount,
  getLatestBrief,
  updateAccount,
  type AccountPatch,
  type NewAccount,
} from "@/data/repository";
import { salesforce } from "@/adapters/salesforce";
import { slack } from "@/adapters/slack";
import { runEvals } from "@/agent/eval";

export async function generateBriefAction(accountId: string) {
  await generateBrief(accountId);
  // re-render the detail page so the fresh brief shows up
  revalidatePath(`/accounts/${accountId}`);
}

export async function copyToSalesforceAction(accountId: string) {
  const brief = await getLatestBrief(accountId);
  const ctx = await getAccount(accountId);
  if (!brief || !ctx) return { ok: false, note: "Generate a brief first." };
  return salesforce.pushSummary({
    accountId,
    accountName: ctx.account.name,
    summary: brief.sfdcSummary,
  });
}

export async function postToSlackAction(accountId: string) {
  const brief = await getLatestBrief(accountId);
  const ctx = await getAccount(accountId);
  if (!brief || !ctx) return { ok: false, note: "Generate a brief first." };
  return slack.postUpdate({ accountName: ctx.account.name, text: brief.slackUpdate });
}

export async function runEvalsAction() {
  await runEvals();
  revalidatePath("/evals");
}

// ---- account editing ----

export async function updateAccountAction(id: string, patch: AccountPatch) {
  await updateAccount(id, patch);
  revalidatePath("/");
  revalidatePath("/board");
  revalidatePath(`/accounts/${id}`);
}

export async function addAccountAction(input: NewAccount) {
  const id = await createAccount(input);
  revalidatePath("/");
  revalidatePath("/board");
  return id;
}

export async function deleteAccountAction(id: string) {
  await deleteAccount(id);
  revalidatePath("/");
  revalidatePath("/board");
}
