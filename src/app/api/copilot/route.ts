import { createAgentUIStreamResponse } from "ai";
import { copilotAgent } from "@/agent/copilot-agent";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const messages = body?.messages;
  if (!Array.isArray(messages)) {
    return new Response("Expected a messages array.", { status: 400 });
  }
  return createAgentUIStreamResponse({
    agent: copilotAgent,
    uiMessages: messages,
    // The SDK masks stream errors as "An error occurred." by default so server internals don't
    // leak. For this demo we'd rather see what broke: log the full error, surface a short version
    // to the client. (Synthetic-data app — nothing sensitive to leak.)
    onError: (error) => {
      console.error("[copilot] stream error:", error);
      return error instanceof Error ? error.message : String(error);
    },
  });
}
