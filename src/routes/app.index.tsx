import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth, useLive } from "@/lib/impulzii/auth-context";
import { MissionService, WalletService, ExecutionService } from "@/lib/impulzii/services";
import { MissionCard } from "@/components/impulzii/MissionCard";
import { EmptyState } from "@/components/impulzii/EmptyState";
import { Award, Target, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Inicio · Impulzii" }] }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const state = useLive(() => ({
    missions: user ? MissionService.getAvailableMissions(user.id) : [],
    balance: user
      ? WalletService.balance(user.id)
      : { available: 0, pending: 0, total: 0, redeemed: 0 },
    execs: user ? ExecutionService.byUser(user.id) : [],
  }));
  if (!user) return null;

  const weekExecs = state.execs.filter(
    (e) => e.submittedAt && Date.now() - new Date(e.submittedAt).getTime() < 7 * 86400000,
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Hola,</p>
        <h1 className="text-2xl font-black">{user.fullName.split(" ")[0]}</h1>
      </header>

      <Card className="p-5 gradient-brand text-primary-foreground border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Saldo disponible</p>
            <p className="text-3xl font-black mt-1">
              {state.balance.available.toLocaleString()} pts
            </p>
          </div>
          <Award className="h-10 w-10 opacity-80" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="opacity-70">Pendiente</div>
            <div className="font-semibold">{state.balance.pending}</div>
          </div>
          <div>
            <div className="opacity-70">Acumulado</div>
            <div className="font-semibold">{state.balance.total}</div>
          </div>
          <div>
            <div className="opacity-70">Redimido</div>
            <div className="font-semibold">{state.balance.redeemed}</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <Target className="h-5 w-5 text-primary" />
          <p className="text-2xl font-black mt-2">{state.missions.length}</p>
          <p className="text-xs text-muted-foreground">Misiones disponibles</p>
        </Card>
        <Card className="p-4">
          <TrendingUp className="h-5 w-5 text-accent-foreground" />
          <p className="text-2xl font-black mt-2">{weekExecs.length}</p>
          <p className="text-xs text-muted-foreground">Enviadas esta semana</p>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Destacadas</h2>
          <Link to="/app/missions" className="text-sm text-primary font-medium">
            Ver todas
          </Link>
        </div>
        {state.missions.length === 0 ? (
          <EmptyState
            title="No tienes misiones disponibles"
            description="Vincúlate a un establecimiento o revisa más tarde."
            action={
              <Link to="/app/venues">
                <Button size="sm">Vincular establecimiento</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3">
            {state.missions.slice(0, 3).map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
