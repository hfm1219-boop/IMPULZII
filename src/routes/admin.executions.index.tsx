import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";
import { MissionService } from "@/lib/impulzii/services";
import { StatusBadge } from "@/components/impulzii/StatusBadge";
import { EmptyState } from "@/components/impulzii/EmptyState";
import type { ExecutionStatus } from "@/lib/impulzii/types";

export const Route = createFileRoute("/admin/executions/")({
  head: () => ({ meta: [{ title: "Auditoría · Kicker Admin" }] }),
  component: List,
});

function List() {
  const [tab, setTab] = useState<ExecutionStatus | "pending">("pending");
  const state = useLive(() => getState());
  const filter = (e: (typeof state.executions)[number]) =>
    tab === "pending" ? ["submitted", "in_review"].includes(e.status) : e.status === tab;
  const filtered = state.executions
    .filter(filter)
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Cola de auditoría</h1>
        <p className="text-sm text-muted-foreground">Revisa y valida las ejecuciones enviadas.</p>
      </header>
      <Tabs value={tab} onValueChange={(v) => setTab(v as ExecutionStatus | "pending")}>
        <TabsList>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
          <TabsTrigger value="approved">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
          <TabsTrigger value="needs_fix">Correcciones</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState title="Sin ejecuciones" />
      ) : (
        <div className="grid gap-2">
          {filtered.map((e) => {
            const m = MissionService.byId(e.missionId);
            const u = state.users.find((x) => x.id === e.userId);
            const v = state.venues.find((x) => x.id === e.venueId);
            return (
              <Link key={e.id} to="/admin/executions/$id" params={{ id: e.id }}>
                <Card className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{m?.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {u?.fullName} · {v?.commercialName} ·{" "}
                      {e.submittedAt ? new Date(e.submittedAt).toLocaleString() : "—"}
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
