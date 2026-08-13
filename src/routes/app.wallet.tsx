import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuth, useLive } from "@/lib/impulzii/auth-context";
import { WalletService } from "@/lib/impulzii/services";
import { EmptyState } from "@/components/impulzii/EmptyState";
import { Award } from "lucide-react";

export const Route = createFileRoute("/app/wallet")({
  head: () => ({ meta: [{ title: "Wallet · Kicker" }] }),
  component: Wallet,
});

function Wallet() {
  const { user } = useAuth();
  const data = useLive(() => ({
    balance: user
      ? WalletService.balance(user.id)
      : { available: 0, pending: 0, total: 0, redeemed: 0 },
    tx: user ? WalletService.transactions(user.id) : [],
  }));
  if (!user) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black">Wallet</h1>
      <Card className="p-5 gradient-brand text-primary-foreground border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase opacity-80">Disponible</p>
            <p className="text-3xl font-black">{data.balance.available.toLocaleString()} pts</p>
          </div>
          <Award className="h-10 w-10 opacity-80" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="opacity-70">Pendiente</div>
            <div className="font-semibold">{data.balance.pending}</div>
          </div>
          <div>
            <div className="opacity-70">Acumulado</div>
            <div className="font-semibold">{data.balance.total}</div>
          </div>
          <div>
            <div className="opacity-70">Redimido</div>
            <div className="font-semibold">{data.balance.redeemed}</div>
          </div>
        </div>
      </Card>

      <section className="space-y-2">
        <h2 className="font-semibold">Movimientos</h2>
        {data.tx.length === 0 ? (
          <EmptyState
            title="Sin movimientos"
            description="Completa una misión para ganar tus primeros puntos."
          />
        ) : (
          data.tx.map((t) => (
            <Card key={t.id} className="p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{t.concept}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={`font-black ${t.points >= 0 ? "text-primary" : "text-destructive"}`}>
                {t.points >= 0 ? "+" : ""}
                {t.points}
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
