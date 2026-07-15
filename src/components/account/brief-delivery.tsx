"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { postToSlackAction } from "@/app/actions";

// Where the brief becomes action. The Salesforce summary copies to the clipboard (the real
// write-back is a Q4 integration), and the Slack update renders as an actual Slack message —
// #channel, the st·eve app, and a footer stamped with the SE and the exact time you post it.
const SE_FALLBACK = "Yusuf Abdel-Rahman";

// tap/hover feel — small enough to read as "responsive", not bouncy
const press = { whileHover: { scale: 1.015 }, whileTap: { scale: 0.97 } };

function fmtLong(d: Date) {
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function BriefDelivery({
  accountId,
  accountName,
  sfdcSummary,
  slackUpdate,
  seName,
}: {
  accountId: string;
  accountName: string;
  sfdcSummary: string;
  slackUpdate: string;
  seName?: string | null;
}) {
  // "You" is the seed placeholder — treat it as unset and show the SE's name.
  const se = seName && seName.trim() && seName !== "You" ? seName : SE_FALLBACK;
  const channel = accountName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-vercel";

  const [sfNote, setSfNote] = useState<string | null>(null);
  const [postedAt, setPostedAt] = useState<Date | null>(null);
  const [posting, setPosting] = useState(false);
  const [slackNote, setSlackNote] = useState<string | null>(null);

  async function copyToSalesforce() {
    try {
      await navigator.clipboard.writeText(sfdcSummary);
      setSfNote("Copied — paste into the Opportunity. Full Salesforce integration lands Q4. 🗓️");
    } catch {
      setSfNote("Couldn't reach the clipboard — select and copy manually.");
    }
  }

  async function postToSlack() {
    const now = new Date();
    setPostedAt(now);
    setPosting(true);
    const enriched = `${slackUpdate}\n\n👤 SE: ${se}\n🕒 Posted ${fmtLong(now)}`;
    try {
      await navigator.clipboard.writeText(enriched);
    } catch {
      /* clipboard is a nicety here; the post below is the real path */
    }
    try {
      const res = await postToSlackAction(accountId, enriched);
      setSlackNote(res.ok ? `Posted to #${channel} ✅` : `Copied — ready to paste into #${channel}.`);
    } catch {
      setSlackNote(`Copied — ready to paste into #${channel}.`);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Salesforce */}
      <div>
        <div className="mb-1 text-sm font-semibold">Salesforce-ready summary</div>
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{sfdcSummary}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            {...press}
            onClick={copyToSalesforce}
            className="rounded-[var(--radius)] bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg"
          >
            Copy to Salesforce
          </motion.button>
          {sfNote && <span className="text-xs text-sub">{sfNote}</span>}
        </div>
      </div>

      {/* Slack */}
      <div>
        <div className="mb-1.5 text-sm font-semibold">Slack update</div>

        <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-bg">
          {/* channel bar */}
          <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2 text-xs">
            <span className="font-semibold text-ink">#{channel}</span>
            <span className="text-sub">· Vercel workspace</span>
            <span className="ml-auto text-sub">{postedAt ? fmtTime(postedAt) : "draft"}</span>
          </div>

          {/* the message, from the st·eve app */}
          <div className="flex gap-2.5 px-3 py-3">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-accent-soft">
              <Image src="/steve.png" alt="" width={26} height={26} className="object-contain" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-ink">st·eve</span>
                <span className="rounded bg-muted-soft px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-muted">
                  App
                </span>
                <span className="text-xs text-sub">{postedAt ? fmtTime(postedAt) : "just now"}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{slackUpdate}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-xs text-sub">
                <span>👤 SE: {se}</span>
                <span>{postedAt ? `🕒 Posted ${fmtLong(postedAt)}` : "🕒 Not posted yet"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            {...press}
            disabled={posting}
            onClick={postToSlack}
            className="rounded-[var(--radius)] border border-border bg-surface px-3.5 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {posting ? "Posting…" : postedAt ? "Post again" : "Post to Slack"}
          </motion.button>
          {slackNote && <span className="text-xs text-success">{slackNote}</span>}
        </div>
      </div>
    </div>
  );
}
