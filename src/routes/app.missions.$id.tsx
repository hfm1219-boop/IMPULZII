import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth, useLive } from "@/lib/impulzii/auth-context";
import { MissionService, CampaignService, ExecutionService, VenueService } from "@/lib/impulzii/services";
import { MISSION_TYPE_LABELS } from "@/lib/impulzii/types";
import { StatusBadge } from "@/components/impulzii/StatusBadge";
import { getState } from "@/lib/impulzii/store";
import { ArrowLeft, Award, Calendar, MapPin, Camera, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/app/missions/$id")({
  loader: ({ params }) => {
    const m = MissionService.byId(params.id);
    if (!m) throw notFound();
    return { missionId: m.id };
  },
  component: MissionDetail,
});

function MissionDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const data = useLive(() => ({
    mission: MissionService.byId(id),
    exec: user ? ExecutionService.activeForMission(user.id, id) : undefined,
    allExecs: user ? ExecutionService.byUser(user.id).filter((e) => e.missionId === id) : [],
  }));

  if (!user || !data.mission) return null;
  const m = data.mission;
  const campaign = CampaignService.byId(m.campaignId);
  const brand = campaign ? getState().brands.find((b) => b.id === campaign.brandId) : undefined;
  const daysLeft = Math.max(0, Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000));

  const lastExec = data.allExecs.sort((a, b) => (a.acceptedAt! < b.acceptedAt! ? 1 : -1))[0];

  return (
    <div className="space-y-4">
      <Link to="/app/missions" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <div className="rounded-xl gradient-brand text-primary-foreground p-6">
        <div className="flex gap-2 mb-2">
          <Badge className="bg-white/20 border-0">{brand?.name}</Badge>
          <Badge className="bg-white/20 border-0">{MISSION_TYPE_LABELS[m.type]}</Badge>
        </div>
        <h1 className="text-2xl font-black">{m.name}</h1>
        <p className="mt-2 opacity-90">{m.description}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1"><Award className="h-4 w-4" /> {m.rewardPoints} pts</span>
          <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {daysLeft}d restantes</span>
        </div>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Instrucciones</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{m.instructions}</p>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Evidencias requeridas</h3>
        <ul className="space-y-2 text-sm">
          {m.requiresPhoto && <li className="flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Fotografía</li>}
          {m.requiresGeo && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Ubicación GPS</li>}
          {m.fields.map((f) => (
            <li key={f.id} className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-muted-foreground" /> {f.label}{f.required && " *"}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Establecimientos habilitados</h3>
        <div className="flex flex-wrap gap-2">
          {m.targetVenueIds.map((vid) => {
            const v = VenueService.byId(vid);
            return v ? <Badge key={vid} variant="outline">{v.commercialName}</Badge> : null;
          })}
        </div>
      </Card>

      {campaign?.terms && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2 text-sm">Términos</h3>
          <p className="text-xs text-muted-foreground">{campaign.terms}</p>
        </Card>
      )}

      <div className="sticky bottom-20 md:bottom-4 z-20">
        {data.exec ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate({ to: "/app/missions/$id/execute", params: { id: m.id } })}
          >
            Continuar ejecución
          </Button>
        ) : lastExec && ["in_review", "submitted", "approved"].includes(lastExec.status) ? (
          <Card className="p-3 flex items-center justify-between">
            <span className="text-sm">Última ejecución:</span>
            <StatusBadge status={lastExec.status} />
          </Card>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              try {
                ExecutionService.accept(user.id, m.id);
                toast.success("Misión aceptada");
                navigate({ to: "/app/missions/$id/execute", params: { id: m.id } });
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
          >
            Aceptar misión
          </Button>
        )}
      </div>
    </div>
  );
}
