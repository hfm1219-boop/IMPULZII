import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, useLive } from "@/lib/impulzii/auth-context";
import { AuthService, VenueService } from "@/lib/impulzii/services";
import { getState } from "@/lib/impulzii/store";
import { PROFILE_KIND_LABELS } from "@/lib/impulzii/types";
import { LogOut, Store } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({
  head: () => ({ meta: [{ title: "Mi perfil · Impulzii" }] }),
  component: Profile,
});

function Profile() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const venues = useLive(() =>
    user ? getState().venues.filter((v) => VenueService.membershipsForUser(user.id).some(mem=>mem.venueId===v.id && mem.status==="approved")) : [],
  );
  if (!user) return null;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full gradient-brand grid place-items-center text-primary-foreground text-2xl font-black">
            {user.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black truncate">{user.fullName}</h1>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {user.roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-2 text-sm">
        <Row label="Documento" value={`${user.docType} ${user.docNumber}`} />
        <Row label="Celular" value={user.phone} />
        <Row label="Ciudad" value={user.city} />
        <Row label="Perfil" value={PROFILE_KIND_LABELS[user.profileKind]} />
      </Card>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-2"><Store className="h-4 w-4" /> Establecimientos</h2>
        </div>
        {venues.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground">
            No estás vinculado a ningún establecimiento.
          </Card>
        ) : (
          <div className="space-y-2">
            {venues.map((v) => (
              <Card key={v.id} className="p-3">
                <div className="font-semibold">{v.commercialName}</div>
                <div className="text-xs text-muted-foreground">{v.city} · {v.type}</div>
              </Card>
            ))}
          </div>
        )}
        <div className="mt-3">
          <VenueJoin />
        </div>
      </section>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          AuthService.logout();
          refresh();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="h-4 w-4 mr-2" /> Cerrar sesión
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function VenueJoin() {
  const { user, refresh } = useAuth();
  const venues = useLive(() => getState().venues);
  if (!user) return null;
  const available = venues.filter((v) => !VenueService.membershipsForUser(user.id).some(mem=>mem.venueId===v.id && mem.status==="approved"));

  return (
    <details className="rounded-md border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Vincular otro establecimiento</summary>
      <div className="mt-3 space-y-2">
        {available.map((v) => (
          <div key={v.id} className="flex items-center justify-between text-sm">
            <span>{v.commercialName}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                VenueService.requestMembership(user.id, v.id);
                refresh();
                toast.success(`Te vinculaste a ${v.commercialName}`);
              }}
            >
              Vincular
            </Button>
          </div>
        ))}
      </div>
    </details>
  );
}
