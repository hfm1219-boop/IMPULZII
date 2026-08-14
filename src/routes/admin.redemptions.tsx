import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Clock3, ScanLine, Search, ShieldX, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/impulzii/auth-context";
import { RewardService } from "@/lib/impulzii/services";

export const Route = createFileRoute("/admin/redemptions")({
  head: () => ({ meta: [{ title: "Validar token · Kicker" }] }),
  component: RedemptionValidator,
});

type TokenResult = ReturnType<typeof RewardService.checkToken> | null;

function RedemptionValidator() {
  const { user } = useAuth();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<TokenResult>(null);

  if (!user) return null;

  const validate = () => {
    if (!token.trim()) {
      toast.error("Ingresa el token entregado por el participante");
      return;
    }
    setResult(RewardService.checkToken(token, user.id));
  };

  const consume = () => {
    try {
      RewardService.consumeToken(token, user.id);
      setResult(RewardService.checkToken(token, user.id));
      toast.success("Beneficio aplicado y token marcado como utilizado");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <p className="text-sm font-semibold text-primary">Portal del restaurante</p>
        <h1 className="text-2xl font-black">Validar token de redención</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comprueba que el beneficio sea válido y esté vigente antes de aplicarlo a la cuenta.
        </p>
      </header>

      <Card className="p-5">
        <label htmlFor="redemption-token" className="text-sm font-semibold">
          Token del participante
        </label>
        <div className="mt-2 flex gap-2">
          <Input
            id="redemption-token"
            value={token}
            onChange={(event) => setToken(event.target.value.toUpperCase())}
            onKeyDown={(event) => event.key === "Enter" && validate()}
            placeholder="Ej. A7KP-9XQ2-K8MW"
            autoComplete="off"
            className="h-12 font-mono text-lg font-bold uppercase tracking-widest"
          />
          <Button onClick={validate} className="h-12 px-5">
            <Search className="mr-2 h-4 w-4" /> Verificar
          </Button>
        </div>
      </Card>

      {result && (
        <Card
          className={`overflow-hidden p-0 ${result.valid ? "border-primary/40" : "border-destructive/40"}`}
        >
          <div
            className={`flex items-center gap-3 p-4 ${result.valid ? "bg-primary/10" : "bg-destructive/10"}`}
          >
            {result.valid ? (
              <CheckCircle2 className="h-7 w-7 text-primary" />
            ) : (
              <ShieldX className="h-7 w-7 text-destructive" />
            )}
            <div>
              <p className="font-black">
                {result.valid ? "Token válido y vigente" : "Token no válido"}
              </p>
              {!result.valid && <p className="text-sm text-muted-foreground">{result.reason}</p>}
            </div>
          </div>

          {result.redemption && result.reward && result.participant && (
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Beneficio</p>
                <p className="font-bold">{result.reward.name}</p>
                <p className="text-sm text-muted-foreground">{result.reward.merchantName}</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Participante</p>
                    <p className="font-semibold">{result.participant.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Válido hasta</p>
                    <p className="font-semibold">
                      {new Date(result.redemption.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              {result.valid && (
                <Button onClick={consume} className="w-full" size="lg">
                  <ScanLine className="mr-2 h-4 w-4" /> Aplicar beneficio y marcar como utilizado
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Cada token está vinculado al establecimiento, solo puede utilizarse una vez y vence 24 horas
        después de ser generado.
      </p>
    </div>
  );
}
