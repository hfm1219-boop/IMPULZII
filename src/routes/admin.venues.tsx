import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";
import { VenueService } from "@/lib/impulzii/services";
import { CreateVenueDialog } from "@/components/impulzii/AdminCreateDialogs";

export const Route = createFileRoute("/admin/venues")({
  head: () => ({ meta: [{ title: "Establecimientos · Kicker Admin" }] }),
  component: Venues,
});

function Venues() {
  const state = useLive(() => getState());
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Establecimientos</h1>
          <p className="text-sm text-muted-foreground">
            Puntos de venta registrados y participantes vinculados.
          </p>
        </div>
        <CreateVenueDialog />
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {state.venues.map((v) => {
          const participants = state.users.filter((u) =>
            VenueService.membershipsForUser(u.id).some(
              (mem) => mem.venueId === v.id && mem.status === "approved",
            ),
          );
          return (
            <Card key={v.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold">{v.commercialName}</h3>
                  <p className="text-xs text-muted-foreground">{v.legalName ?? "—"}</p>
                </div>
                <Badge variant="outline">{v.type}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {v.address} · {v.city}
              </p>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">
                  {participants.length} participantes vinculados
                </p>
                <div className="flex flex-wrap gap-1">
                  {participants.map((p) => (
                    <Badge key={p.id} variant="secondary">
                      {p.fullName}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
