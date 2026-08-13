import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";

export const Route = createFileRoute("/admin/campaigns")({
  head: () => ({ meta: [{ title: "Campañas · Impulzii Admin" }] }),
  component: Campaigns,
});

function Campaigns() {
  const state = useLive(() => getState());
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Campañas</h1>
        <p className="text-sm text-muted-foreground">Publicaciones y misiones asociadas.</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {state.campaigns.map((c) => {
          const brand = state.brands.find((b) => b.id === c.brandId);
          const missions = state.missions.filter((m) => m.campaignId === c.id);
          return (
            <Card key={c.id} className="p-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{brand?.name}</Badge>
                <Badge variant={c.status === "published" ? "default" : "outline"}>{c.status}</Badge>
              </div>
              <h3 className="mt-2 font-bold text-lg">{c.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-muted px-2 py-1">
                  {c.budgetPoints.toLocaleString()} pts presupuesto
                </span>
                <span className="rounded-full bg-muted px-2 py-1">{missions.length} misiones</span>
              </div>
              <div className="mt-3 space-y-1">
                {missions.map((m) => (
                  <Link
                    key={m.id}
                    to="/admin/missions/$id"
                    params={{ id: m.id }}
                    className="block text-sm text-primary hover:underline"
                  >
                    → {m.name}
                  </Link>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
