import { createAgentUIStreamResponse } from "ai";
import { copilotAgent } from "@/agent/copilot-agent";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = body?.messages;
  if (!Array.isArray(messages)) {
    return new Response("Expected a messages array.", { status: 400 });
  }
  return createAgentUIStreamResponse({ agent: copilotAgent, uiMessages: messages });
}
