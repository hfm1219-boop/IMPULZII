import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { DynamicField } from "@/components/impulzii/DynamicField";
import { MissionService, ExecutionService, VenueService } from "@/lib/impulzii/services";
import { useAuth } from "@/lib/impulzii/auth-context";
import type { Evidence } from "@/lib/impulzii/types";
import { ArrowLeft, MapPin, Send } from "lucide-react";

export const Route = createFileRoute("/app/missions_/$id/execute")({
  component: ExecutePage,
});

function ExecutePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mission = MissionService.byId(id);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locStatus, setLocStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [execId, setExecId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const execution = execId ? ExecutionService.byId(execId) : undefined;
  const demoVenue = execution?.venueId ? VenueService.byId(execution.venueId) : undefined;

  useEffect(() => {
    if (!user || !mission) return;
    try {
      const ex =
        ExecutionService.activeForMission(user.id, mission.id) ??
        ExecutionService.accept(user.id, mission.id);
      if (["accepted", "needs_fix"].includes(ex.status)) ExecutionService.start(ex.id);
      setExecId(ex.id);
      setAnswers(ex.answers);
      setEvidences(ex.evidences);
      if (ex.lat !== undefined && ex.lng !== undefined) {
        setLoc({ lat: ex.lat, lng: ex.lng });
        setLocStatus("ok");
      }
      setReady(true);
    } catch (error) {
      setInitializationError((error as Error).message);
    }
  }, [user, mission]);

  const requiredFields = useMemo(() => mission?.fields.filter((f) => f.required) ?? [], [mission]);
  const filledRequired = requiredFields.filter((f) => {
    const v = answers[f.id];
    return v !== undefined && v !== "" && v !== null && !(Array.isArray(v) && v.length === 0);
  }).length;
  const totalSteps =
    requiredFields.length + (mission?.requiresPhoto ? 1 : 0) + (mission?.requiresGeo ? 1 : 0);
  const doneSteps =
    filledRequired +
    (mission?.requiresPhoto ? (evidences.some((e) => e.type === "photo") ? 1 : 0) : 0) +
    (mission?.requiresGeo ? (loc ? 1 : 0) : 0);
  const progress = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  // autosave
  useEffect(() => {
    if (!execId || !ready) return;
    try {
      ExecutionService.saveDraft(execId, answers, evidences, loc ?? undefined);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }, [answers, evidences, loc, execId, ready]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus("err");
      toast.error("Geolocalización no disponible");
      return;
    }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("ok");
      },
      () => {
        setLocStatus("err");
        toast.error("No pudimos obtener tu ubicación");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!user || !mission) return null;

  if (initializationError) {
    return (
      <Card className="p-6 space-y-4 text-center">
        <h1 className="text-xl font-bold">No se puede iniciar esta actividad</h1>
        <p className="text-sm text-muted-foreground">{initializationError}</p>
        <Button asChild>
          <Link to="/app/missions/$id" params={{ id: mission.id }}>
            Volver a la misión
          </Link>
        </Button>
      </Card>
    );
  }

  const submit = () => {
    if (!execId) return;
    try {
      ExecutionService.submit(execId);
      toast.success("Ejecución enviada");
      navigate({ to: "/app/activity" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/app/missions/$id"
        params={{ id: mission.id }}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Guardar y salir
      </Link>
      <div>
        <h1 className="text-xl font-black">{mission.name}</h1>
        <p className="text-sm text-muted-foreground">Completa los campos y envía tu evidencia.</p>
      </div>

      <div className="sticky top-0 z-10 bg-background pt-2 pb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold">Progreso</span>
          <span className="text-muted-foreground">
            {doneSteps}/{totalSteps}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <Card className="p-4 space-y-4">
        {[...mission.fields]
          .sort((a, b) => a.order - b.order)
          .map((f) => (
            <DynamicField
              key={f.id}
              field={f}
              value={answers[f.id]}
              onChange={(v) => setAnswers({ ...answers, [f.id]: v })}
              onPhoto={(dataUrl) => {
                const ev: Evidence = {
                  id: `ev_${Date.now()}`,
                  type: "photo",
                  fileDataUrl: dataUrl,
                  createdAt: new Date().toISOString(),
                  hash: String(dataUrl.length),
                };
                setEvidences((prev) => [...prev.filter((e) => e.type !== "photo"), ev]);
              }}
            />
          ))}
      </Card>

      {mission.requiresGeo && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Ubicación
              </p>
              {loc ? (
                <p className="text-xs text-muted-foreground mt-1">
                  {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Requerimos tu ubicación GPS.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={loc ? "outline" : "default"}
                onClick={requestLocation}
                disabled={locStatus === "loading"}
              >
                {loc ? "Actualizar GPS" : locStatus === "loading" ? "..." : "Obtener GPS"}
              </Button>
              {demoVenue && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setLoc({ lat: demoVenue.lat, lng: demoVenue.lng });
                    setLocStatus("ok");
                    toast.success(`Ubicación demo: ${demoVenue.commercialName}`);
                  }}
                >
                  Usar ubicación demo
                </Button>
              )}
            </div>
          </div>
          {demoVenue && (
            <p className="mt-3 text-xs text-muted-foreground">
              La ubicación demo permite probar este flujo localmente sin estar físicamente en{" "}
              {demoVenue.commercialName}.
            </p>
          )}
        </Card>
      )}

      <Button className="w-full" size="lg" onClick={submit} disabled={!ready || !execId}>
        <Send className="h-4 w-4 mr-2" /> Enviar ejecución
      </Button>
    </div>
  );
}
