import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";
import { UserService, WalletService } from "@/lib/impulzii/services";
import { PROFILE_KIND_LABELS } from "@/lib/impulzii/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/participants")({
  head: () => ({ meta: [{ title: "Participantes · Impulzii Admin" }] }),
  component: Participants,
});

function Participants() {
  const state = useLive(() => getState());
  const participants = state.users.filter((u) => u.roles.includes("participant"));
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-black">Participantes</h1>
      </header>
      <div className="grid gap-2">
        {participants.map((p) => {
          const b = WalletService.balance(p.id);
          return (
            <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full gradient-brand grid place-items-center text-primary-foreground font-black shrink-0">
                  {p.fullName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.city} · {PROFILE_KIND_LABELS[p.profileKind]}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right">
                <div>
                  <div className="text-sm font-black text-primary">{b.available} pts</div>
                  <Badge variant={p.active ? "default" : "outline"}>
                    {p.active ? "activo" : "inactivo"}
                  </Badge>
                </div>
                {p.verification !== "verified" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      UserService.update(p.id, { verification: "verified" });
                      toast.success("Participante verificado");
                    }}
                  >
                    Verificar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={p.active ? "destructive" : "outline"}
                  onClick={() => {
                    UserService.toggleBlock(p.id);
                    toast.success(p.active ? "Participante bloqueado" : "Participante activado");
                  }}
                >
                  {p.active ? "Bloquear" : "Activar"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
