import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, useLive } from "@/lib/impulzii/auth-context";
import { ExecutionService, MissionService } from "@/lib/impulzii/services";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/impulzii/StatusBadge";
import { EmptyState } from "@/components/impulzii/EmptyState";

export const Route = createFileRoute("/app/activity")({
  head: () => ({ meta: [{ title: "Actividad · Impulzii" }] }),
  component: Activity,
});

function Activity() {
  const { user } = useAuth();
  const execs = useLive(() => (user ? ExecutionService.byUser(user.id) : []));
  if (!user) return null;

  const groups: Record<string, typeof execs> = {};
  for (const e of execs) {
    (groups[e.status] ??= []).push(e);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Actividad</h1>
      {execs.length === 0 ? (
        <EmptyState
          title="Aún no tienes ejecuciones"
          description="Acepta una misión desde la sección Misiones."
        />
      ) : (
        Object.entries(groups).map(([status, list]) => (
          <section key={status} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {status.replace("_", " ")}
            </h2>
            {list.map((e) => {
              const m = MissionService.byId(e.missionId);
              return (
                <Link key={e.id} to="/app/missions/$id" params={{ id: e.missionId }}>
                  <Card className="p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{m?.name ?? e.missionId}</div>
                      <div className="text-xs text-muted-foreground">
                        {e.submittedAt ? new Date(e.submittedAt).toLocaleString() : "Sin enviar"}
                      </div>
                    </div>
                    <StatusBadge status={e.status} />
                  </Card>
                </Link>
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}
