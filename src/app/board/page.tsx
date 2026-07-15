import { AppShell } from "@/components/app-shell";
import { KanbanBoard, type BoardCard } from "@/components/board/kanban-board";
import { getPatch } from "@/data/repository";
import { hasDb } from "@/db/client";
import type { Priority, Stage } from "@/lib/domain";

const DEFAULT_PERSONA = "you";

export default async function BoardPage() {
  const { accounts } = await getPatch(DEFAULT_PERSONA);
  const cards: BoardCard[] = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    industry: a.industry,
    arr: a.arr,
    stage: a.stage as Stage,
    priority: a.priority as Priority,
    atRisk: a.atRisk,
  }));

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <header>
          <h1 className="text-xl font-bold">Board</h1>
          <p className="text-sm text-sub">
            Your patch by opportunity stage — drag an account across to restage it.
          </p>
        </header>
        <KanbanBoard initial={cards} canEdit={hasDb} />
      </div>
    </AppShell>
  );
}
