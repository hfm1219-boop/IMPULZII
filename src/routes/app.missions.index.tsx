import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, useLive } from "@/lib/impulzii/auth-context";
import { MissionService, ExecutionService } from "@/lib/impulzii/services";
import { MissionCard } from "@/components/impulzii/MissionCard";
import { StatusBadge } from "@/components/impulzii/StatusBadge";
import { EmptyState } from "@/components/impulzii/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/app/missions/")({
  head: () => ({ meta: [{ title: "Misiones · Impulzii" }] }),
  component: Missions,
});

function Missions() {
  const { user } = useAuth();
  const [tab, setTab] = useState("available");
  const data = useLive(() => ({
    available: user ? MissionService.getAvailableMissions(user.id) : [],
    execs: user ? ExecutionService.byUser(user.id) : [],
  }));
  if (!user) return null;

  const groups = {
    accepted: data.execs.filter((e) => ["accepted", "in_progress", "needs_fix"].includes(e.status)),
    review: data.execs.filter((e) => ["submitted", "in_review"].includes(e.status)),
    approved: data.execs.filter((e) => e.status === "approved"),
    rejected: data.execs.filter((e) => e.status === "rejected"),
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Misiones</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="available">Disp.</TabsTrigger>
          <TabsTrigger value="accepted">Aceptadas</TabsTrigger>
          <TabsTrigger value="review">Revisión</TabsTrigger>
          <TabsTrigger value="approved">Aprob.</TabsTrigger>
          <TabsTrigger value="rejected">Rech.</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-4 space-y-3">
          {data.available.length === 0 ? (
            <EmptyState title="No hay misiones disponibles" description="Revisa que estés vinculado a un establecimiento habilitado." />
          ) : (
            data.available.map((m) => <MissionCard key={m.id} mission={m} />)
          )}
        </TabsContent>
        {(["accepted", "review", "approved", "rejected"] as const).map((k) => (
          <TabsContent key={k} value={k} className="mt-4 space-y-3">
            {groups[k].length === 0 ? (
              <EmptyState title="Sin ejecuciones" />
            ) : (
              groups[k].map((e) => {
                const m = MissionService.byId(e.missionId);
                if (!m) return null;
                return (
                  <Link key={e.id} to="/app/missions/$id" params={{ id: m.id }}>
                    <Card className="p-4 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.rewardPoints} pts</div>
                      </div>
                      <StatusBadge status={e.status} />
                    </Card>
                  </Link>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
