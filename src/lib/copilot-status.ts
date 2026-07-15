// A conversational "here's what I'm doing" line for while the copilot is working. It's built from
// the tool calls st·eve is actually making, so it narrates the real activity instead of spinning a
// generic spinner (and without a second model call adding latency). The technical tool list still
// shows in the router panel; this is the human-readable version.

type MessagePart = { type: string; text?: string; input?: unknown };

function pretty(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function thinkingLine(parts: readonly MessagePart[]): string {
  const tools = parts.filter((p) => p.type.startsWith("tool-"));
  if (tools.length === 0) return "on it, let me look…";

  const accounts = tools
    .filter((p) => p.type === "tool-get_account_context")
    .map((p) => (p.input as { account?: string } | undefined)?.account)
    .filter((x): x is string => Boolean(x))
    .map(pretty);

  if (accounts.length === 1) return `checking in on ${accounts[0]}…`;
  if (accounts.length > 1) {
    const shown = accounts.slice(0, 2).join(", ");
    return `checking in on ${shown}${accounts.length > 2 ? ", and a couple more" : ""}…`;
  }
  if (tools.some((p) => p.type === "tool-list_patch")) return "scanning your whole patch…";
  return "digging into the details…";
}

// Once the assistant starts writing its actual reply, we show that instead of the status line.
export function hasAnswerText(parts: readonly MessagePart[]): boolean {
  return parts.some((p) => p.type === "text" && Boolean(p.text));
}
