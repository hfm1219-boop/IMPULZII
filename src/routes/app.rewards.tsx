import { createFileRoute } from "@tanstack/react-router";
import { Award, Clock3, MapPin, Star, TicketCheck, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth, useLive } from "@/lib/impulzii/auth-context";
import { RewardService, WalletService } from "@/lib/impulzii/services";

export const Route = createFileRoute("/app/rewards")({
  head: () => ({ meta: [{ title: "Redimir en Cartagena · Kicker" }] }),
  component: Rewards,
});

function Rewards() {
  const { user } = useAuth();
  const data = useLive(() => ({
    balance: user ? WalletService.balance(user.id).available : 0,
    rewards: RewardService.list()
      .filter((reward) => reward.city === "Cartagena" && reward.merchantName)
      .sort((a, b) => (a.tripadvisorRank ?? 99) - (b.tripadvisorRank ?? 99)),
    redemptions: user
      ? RewardService.redemptions(user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [],
  }));

  if (!user) return null;

  const redeem = (rewardId: string, merchantName: string) => {
    try {
      RewardService.redeem(user.id, rewardId);
      toast.success(`Redención solicitada en ${merchantName}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl gradient-brand p-5 text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold opacity-80">Beneficios gastronómicos</p>
            <h1 className="mt-1 text-2xl font-black">Redime en Cartagena</h1>
            <p className="mt-2 max-w-xl text-sm opacity-85">
              Convierte los créditos ganados en misiones en experiencias y bonos de consumo.
            </p>
          </div>
          <div className="shrink-0 rounded-xl bg-black/10 px-4 py-3 text-right">
            <p className="text-[11px] uppercase opacity-75">Tu saldo</p>
            <p className="text-xl font-black">{data.balance.toLocaleString()} pts</p>
          </div>
        </div>
      </section>

      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-bold">10 restaurantes destacados</h2>
            <p className="text-xs text-muted-foreground">
              Ejemplo de red de aliados basado en el ranking destacado de Tripadvisor 2026.
            </p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:block">Cartagena de Indias</span>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {data.rewards.map((reward) => {
            const canRedeem = data.balance >= reward.pointsRequired && reward.stock > 0;
            return (
              <Card key={reward.id} className="overflow-hidden p-0">
                <div className="flex">
                  <div className="grid w-20 shrink-0 place-items-center bg-primary/10 text-primary">
                    <div className="text-center">
                      <Utensils className="mx-auto h-5 w-5" />
                      <div className="mt-1 text-xs font-black">#{reward.tripadvisorRank}</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold leading-tight">{reward.merchantName}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-current" /> {reward.tripadvisorRating}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> Cartagena
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                        {reward.pointsRequired.toLocaleString()} pts
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold">{reward.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{reward.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">{reward.category}</span>
                      <Button
                        size="sm"
                        disabled={!canRedeem}
                        onClick={() => redeem(reward.id, reward.merchantName!)}
                      >
                        <Award className="mr-1 h-4 w-4" />
                        {reward.stock <= 0
                          ? "Agotado"
                          : canRedeem
                            ? "Redimir"
                            : "Saldo insuficiente"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {data.redemptions.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-bold">Mis tokens de redención</h2>
            <p className="text-xs text-muted-foreground">
              Muéstrale el token vigente al restaurante antes de pagar la cuenta.
            </p>
          </div>
          {data.redemptions.map((redemption) => {
            const reward = RewardService.byId(redemption.rewardId);
            const expired = new Date(redemption.expiresAt).getTime() <= Date.now();
            const active = redemption.status === "requested" && !expired;
            return (
              <Card key={redemption.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{reward?.merchantName ?? reward?.name}</p>
                    <p className="text-xs text-muted-foreground">{reward?.name}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {redemption.status === "delivered"
                      ? "Utilizado"
                      : redemption.status === "cancelled"
                        ? expired
                          ? "Vencido"
                          : "Cancelado"
                        : redemption.status === "rejected"
                          ? "Rechazado"
                          : expired
                            ? "Vencido"
                            : "Vigente"}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
                  <TicketCheck className="h-5 w-5 text-primary" />
                  <code className="text-xl font-black tracking-[0.15em]">{redemption.token}</code>
                </div>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  Válido hasta {new Date(redemption.expiresAt).toLocaleString()}
                </p>
              </Card>
            );
          })}
        </section>
      )}

      <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        Propuesta demostrativa: los restaurantes y beneficios se muestran como ejemplos de una
        futura red de aliados; no implican convenios comerciales vigentes.
      </p>
    </div>
  );
}
