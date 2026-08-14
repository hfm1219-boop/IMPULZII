import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";
import { MISSION_TYPE_LABELS } from "@/lib/impulzii/types";
import { CreateMissionDialog } from "@/components/impulzii/AdminCreateDialogs";

export const Route = createFileRoute("/admin/missions/")({
  head: () => ({ meta: [{ title: "Misiones · Kicker Admin" }] }),
  component: MissionList,
});

function MissionList() {
  const state = useLive(() => getState());
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Misiones</h1>
        <CreateMissionDialog />
      </header>
      <div className="grid gap-2">
        {state.missions.map((m) => {
          const camp = state.campaigns.find((c) => c.id === m.campaignId);
          const brand = camp && state.brands.find((b) => b.id === camp.brandId);
          const execs = state.executions.filter((e) => e.missionId === m.id);
          return (
            <Link key={m.id} to="/admin/missions/$id" params={{ id: m.id }}>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1 mb-1">
                      <Badge variant="outline">{brand?.name}</Badge>
                      <Badge variant="secondary">{MISSION_TYPE_LABELS[m.type]}</Badge>
                      <Badge variant={m.status === "active" ? "default" : "outline"}>
                        {m.status}
                      </Badge>
                    </div>
                    <div className="font-semibold truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.rewardPoints} pts · {execs.length} ejecuciones
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
