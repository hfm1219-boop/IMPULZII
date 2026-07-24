import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";
import { MissionService } from "@/lib/impulzii/services";
import { MISSION_TYPE_LABELS } from "@/lib/impulzii/types";
import { StatusBadge } from "@/components/impulzii/StatusBadge";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/missions/$id")({
  component: MissionDetail,
});

function MissionDetail() {
  const { id } = Route.useParams();
  const state = useLive(() => getState());
  const m = MissionService.byId(id);
  if (!m) return null;
  const camp = state.campaigns.find((c) => c.id === m.campaignId);
  const brand = camp && state.brands.find((b) => b.id === camp.brandId);
  const execs = state.executions.filter((e) => e.missionId === m.id);

  return (
    <div className="space-y-4">
      <Link to="/admin/missions" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Misiones
      </Link>
      <header>
        <div className="flex gap-2 mb-2">
          <Badge variant="outline">{brand?.name}</Badge>
          <Badge>{MISSION_TYPE_LABELS[m.type]}</Badge>
        </div>
        <h1 className="text-2xl font-black">{m.name}</h1>
        <p className="text-sm text-muted-foreground">{m.description}</p>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Recompensa" value={`${m.rewardPoints} pts`} />
        <Kpi label="Cupos" value={m.totalQuota ? `${execs.length}/${m.totalQuota}` : execs.length.toString()} />
        <Kpi label="Aprobadas" value={execs.filter((e) => e.status === "approved").length.toString()} />
        <Kpi label="Pendientes" value={execs.filter((e) => ["submitted", "in_review"].includes(e.status)).length.toString()} />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Ejecuciones</h3>
        <div className="space-y-2">
          {execs.map((e) => {
            const u = state.users.find((x) => x.id === e.userId);
            return (
              <Link key={e.id} to="/admin/executions/$id" params={{ id: e.id }}>
                <Card className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{u?.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.submittedAt ? new Date(e.submittedAt).toLocaleString() : "En progreso"}
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </Card>
              </Link>
            );
          })}
          {execs.length === 0 && <p className="text-sm text-muted-foreground">Aún sin ejecuciones.</p>}
        </div>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
    </Card>
  );
}
