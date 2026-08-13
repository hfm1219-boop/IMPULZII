import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLive } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";
import { WalletService } from "@/lib/impulzii/services";
import { PROFILE_KIND_LABELS } from "@/lib/impulzii/types";

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
            <Card key={p.id} className="p-4 flex items-center justify-between gap-3">
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
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-primary">{b.available} pts</div>
                <Badge variant={p.active ? "default" : "outline"}>
                  {p.active ? "activo" : "inactivo"}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
