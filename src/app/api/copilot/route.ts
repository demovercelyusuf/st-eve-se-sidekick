import { createAgentUIStreamResponse } from "ai";
import { copilotAgent } from "@/agent/copilot-agent";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  return createAgentUIStreamResponse({ agent: copilotAgent, uiMessages: messages });
}
