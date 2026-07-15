import { AppShell } from "@/components/app-shell";
import { Copilot } from "@/components/copilot/copilot";
import { gatewayReady } from "@/agent/models";
import { getAccount } from "@/data/repository";

export default async function CopilotPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  // "Ask st·eve" from an account passes ?account=<id> so we can offer a focused first prompt.
  const { account } = await searchParams;
  const ctx = account ? await getAccount(account) : null;
  const focus = ctx ? { name: ctx.account.name } : undefined;

  return (
    <AppShell>
      <Copilot gatewayReady={gatewayReady} focus={focus} />
    </AppShell>
  );
}
