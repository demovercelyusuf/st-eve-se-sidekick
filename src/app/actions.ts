"use server";

import { revalidatePath } from "next/cache";
import { generateBrief } from "@/agent/generate-brief";
import {
  createAccount,
  createActivity,
  createTodo,
  deleteAccount,
  deleteTodo,
  getAccount,
  getLatestBrief,
  toggleTodo,
  updateAccount,
  updatePersona,
  type AccountPatch,
  type NewAccount,
} from "@/data/repository";
import { resetDemo } from "@/data/provision";
import type { Activity } from "@/db/schema";
import { salesforce } from "@/adapters/salesforce";
import { slack } from "@/adapters/slack";
import { runPatchHealth } from "@/agent/eval";

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

export async function runPatchHealthAction() {
  return runPatchHealth();
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

// ---- activities + to-dos ----

export async function addActivityAction(
  accountId: string,
  input: { kind: Activity["kind"]; summary: string; body: string },
) {
  await createActivity({ accountId, ...input });
  revalidatePath(`/accounts/${accountId}`);
}

export async function addTodoAction(accountId: string, text: string) {
  const row = await createTodo(accountId, text);
  revalidatePath(`/accounts/${accountId}`);
  return row ? { id: row.id, text: row.text, done: row.done, priority: row.priority, due: row.due } : null;
}

export async function toggleTodoAction(accountId: string, id: string, done: boolean) {
  await toggleTodo(id, done);
  revalidatePath(`/accounts/${accountId}`);
}

export async function deleteTodoAction(accountId: string, id: string) {
  await deleteTodo(id);
  revalidatePath(`/accounts/${accountId}`);
}

// ---- profile ----

export async function updateProfileAction(name: string) {
  await updatePersona("you", { name });
  revalidatePath("/", "layout"); // the identity chip lives in the shared shell
}

// Wipe every edit and reload the pristine seed — the "put the demo back" button.
export async function resetDemoAction() {
  await resetDemo();
  revalidatePath("/", "layout");
}
