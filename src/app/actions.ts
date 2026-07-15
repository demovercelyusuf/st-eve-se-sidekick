"use server";

import { revalidatePath } from "next/cache";
import { generateBrief } from "@/agent/generate-brief";
import {
  createAccount,
  createActivity,
  createContact,
  createTodo,
  deleteAccount,
  deleteContact,
  deleteTodo,
  getAccount,
  getLatestBrief,
  toggleTodo,
  updateAccount,
  updateContact,
  updatePersona,
  type AccountPatch,
  type ContactPatch,
  type NewAccount,
} from "@/data/repository";
import type { Contact } from "@/db/schema";
import type { Activity } from "@/db/schema";
import { slack } from "@/adapters/slack";
import { runPatchHealth } from "@/agent/eval";

export async function generateBriefAction(accountId: string) {
  await generateBrief(accountId);
  // re-render the detail page so the fresh brief shows up
  revalidatePath(`/accounts/${accountId}`);
}

// Post to Slack. The Salesforce side copies client-side (clipboard), so there's no server
// action for it — the mock adapter's write-back is the Q4 integration. Here the client passes
// the fully composed message (body + SE + timestamp); we fall back to the stored update if not.
export async function postToSlackAction(accountId: string, text?: string) {
  const ctx = await getAccount(accountId);
  if (!ctx) return { ok: false, note: "Generate a brief first." };
  let body = text;
  if (!body) {
    const brief = await getLatestBrief(accountId);
    if (!brief) return { ok: false, note: "Generate a brief first." };
    body = brief.slackUpdate;
  }
  return slack.postUpdate({ accountName: ctx.account.name, text: body });
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
  return row ? { id: row.id, text: row.text, done: row.done } : null;
}

export async function toggleTodoAction(accountId: string, id: string, done: boolean) {
  await toggleTodo(id, done);
  revalidatePath(`/accounts/${accountId}`);
}

export async function deleteTodoAction(accountId: string, id: string) {
  await deleteTodo(id);
  revalidatePath(`/accounts/${accountId}`);
}

// ---- contacts ----

export async function addContactAction(
  accountId: string,
  input: { name: string; title: string; relationship?: Contact["relationship"] },
) {
  const row = await createContact({ accountId, ...input });
  revalidatePath(`/accounts/${accountId}`);
  return row
    ? { id: row.id, name: row.name, title: row.title, relationship: row.relationship, sentiment: row.sentiment }
    : null;
}

export async function updateContactAction(accountId: string, id: string, patch: ContactPatch) {
  await updateContact(id, patch);
  revalidatePath(`/accounts/${accountId}`);
}

export async function deleteContactAction(accountId: string, id: string) {
  await deleteContact(id);
  revalidatePath(`/accounts/${accountId}`);
}

// ---- profile ----

export async function updateProfileAction(name: string) {
  await updatePersona("you", { name });
  revalidatePath("/", "layout"); // the identity chip lives in the shared shell
}
