import { createFileRoute } from "@tanstack/react-router";
import { Award, CheckCircle2, Clock3, Package, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLive } from "@/lib/impulzii/auth-context";
import { RewardService } from "@/lib/impulzii/services";
import { getState } from "@/lib/impulzii/store";
import { CreateRewardDialog } from "@/components/impulzii/AdminCreateDialogs";

export const Route = createFileRoute("/admin/rewards")({
  component: RewardsAdmin,
});

function RewardsAdmin() {
  const data = useLive(() => ({
    rewards: RewardService.all(),
    redemptions: RewardService.redemptions(),
    users: getState().users,
  }));
  const delivered = data.redemptions.filter((item) => item.status === "delivered").length;
  const pending = data.redemptions.filter((item) => item.status === "requested").length;
  const cancelled = data.redemptions.filter((item) => item.status === "cancelled").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Recompensas</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo, inventario y trazabilidad de redenciones.
          </p>
        </div>
        <CreateRewardDialog />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={Clock3} label="Tokens vigentes" value={pending} />
        <Metric icon={CheckCircle2} label="Entregados" value={delivered} />
        <Metric icon={XCircle} label="Cancelados o vencidos" value={cancelled} />
      </div>
      <section className="space-y-3">
        <h2 className="font-bold">Catálogo</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.rewards.map((reward) => (
            <Card key={reward.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{reward.name}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{reward.merchantName}</p>
                <p className="mt-2 text-sm">{reward.pointsRequired} créditos</p>
              </div>
              <div className="text-right">
                <Badge variant={reward.active ? "default" : "secondary"}>
                  {reward.active ? "Activo" : "Inactivo"}
                </Badge>
                <p className="mt-2 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <Package className="h-3.5 w-3.5" /> {reward.stock} disponibles
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="font-bold">Historial de redenciones</h2>
        <Card className="divide-y overflow-hidden">
          {data.redemptions.length ? (
            data.redemptions.map((redemption) => {
              const reward = data.rewards.find((item) => item.id === redemption.rewardId);
              const user = data.users.find((item) => item.id === redemption.userId);
              return (
                <div
                  key={redemption.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div>
                    <p className="font-semibold">{reward?.name ?? "Recompensa"}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.fullName} · {redemption.token}
                    </p>
                  </div>
                  <Badge variant={redemption.status === "delivered" ? "default" : "outline"}>
                    {redemption.status === "requested"
                      ? "Vigente"
                      : redemption.status === "delivered"
                        ? "Entregado"
                        : "Cancelado"}
                  </Badge>
                </div>
              );
            })
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">Aún no hay redenciones.</p>
          )}
        </Card>
      </section>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
