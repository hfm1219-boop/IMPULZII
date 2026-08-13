import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";
import { StatusBadge } from "@/components/impulzii/StatusBadge";
import { MissionService } from "@/lib/impulzii/services";
import { Users, Target, ClipboardCheck, Store } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Panel · Impulzii Admin" }] }),
  component: AdminDash,
});

function AdminDash() {
  const state = useLive(() => getState());
  const pending = state.executions.filter((e) => ["submitted", "in_review"].includes(e.status));
  const approvedThisWeek = state.executions.filter(
    (e) =>
      e.status === "approved" &&
      e.submittedAt &&
      Date.now() - new Date(e.submittedAt).getTime() < 7 * 86400000,
  );
  const activeMissions = state.missions.filter((m) => m.status === "active");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black">Panel de control</h1>
        <p className="text-sm text-muted-foreground">Resumen operativo de Impulzii.</p>
      </header>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Kpi
          icon={Users}
          label="Participantes"
          value={state.users.filter((u) => u.roles.includes("participant")).length}
        />
        <Kpi icon={Store} label="Establecimientos" value={state.venues.length} />
        <Kpi icon={Target} label="Misiones activas" value={activeMissions.length} />
        <Kpi icon={ClipboardCheck} label="Por auditar" value={pending.length} accent />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Cola de auditoría</h2>
          <Link to="/admin/executions" className="text-sm text-primary font-medium">
            Ver todo
          </Link>
        </div>
        <div className="grid gap-2">
          {pending.slice(0, 5).map((e) => {
            const m = MissionService.byId(e.missionId);
            const u = state.users.find((x) => x.id === e.userId);
            return (
              <Link key={e.id} to="/admin/executions/$id" params={{ id: e.id }}>
                <Card className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{m?.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u?.fullName} ·{" "}
                      {e.submittedAt ? new Date(e.submittedAt).toLocaleString() : ""}
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </Card>
              </Link>
            );
          })}
          {pending.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Sin ejecuciones pendientes 🎉
            </Card>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Aprobadas esta semana</h2>
        <Card className="p-4">
          <p className="text-3xl font-black">{approvedThisWeek.length}</p>
          <p className="text-xs text-muted-foreground">
            Ejecuciones validadas en los últimos 7 días
          </p>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className={`p-4 ${accent ? "gradient-brand text-primary-foreground border-0" : ""}`}>
      <Icon className={`h-5 w-5 ${accent ? "opacity-90" : "text-muted-foreground"}`} />
      <p className="text-2xl font-black mt-2">{value}</p>
      <p className={`text-xs ${accent ? "opacity-80" : "text-muted-foreground"}`}>{label}</p>
    </Card>
  );
}
