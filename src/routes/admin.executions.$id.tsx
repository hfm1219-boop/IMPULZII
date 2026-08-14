import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLive, useAuth } from "@/lib/impulzii/auth-context";
import { ExecutionService, MissionService } from "@/lib/impulzii/services";
import { getState } from "@/lib/impulzii/store";
import { StatusBadge } from "@/components/impulzii/StatusBadge";
import { ArrowLeft, Check, X, AlertCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/admin/executions/$id")({
  component: ExecReview,
});

function ExecReview() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [note, setNote] = useState("");
  const exec = useLive(() => getState().executions.find((e) => e.id === id));
  if (!user) return null;
  if (!exec) {
    return (
      <Card className="p-6 text-center">
        <h1 className="font-bold">Ejecución no encontrada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          La ejecución pudo haber sido eliminada o el enlace no es válido.
        </p>
        <Button asChild className="mt-4">
          <Link to="/admin/executions">Volver a auditoría</Link>
        </Button>
      </Card>
    );
  }

  const mission = MissionService.byId(exec.missionId);
  const participant = getState().users.find((u) => u.id === exec.userId);
  const venue = getState().venues.find((v) => v.id === exec.venueId);

  const act = (kind: "approve" | "reject" | "needs_fix") => {
    try {
      if (kind === "approve")
        ExecutionService.review(exec.id, user.id, "approved", note || undefined);
      if (kind === "reject") {
        if (!note) return toast.error("Escribe el motivo del rechazo");
        ExecutionService.review(exec.id, user.id, "rejected", note);
      }
      if (kind === "needs_fix") {
        if (!note) return toast.error("Indica qué debe corregir el participante");
        ExecutionService.review(exec.id, user.id, "needs_fix", note);
      }
      toast.success("Decisión registrada");
      navigate({ to: "/admin/executions" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to="/admin/executions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a la cola
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{mission?.name}</h1>
          <p className="text-sm text-muted-foreground">
            {participant?.fullName} · {venue?.commercialName}
          </p>
        </div>
        <StatusBadge status={exec.status} />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2 text-sm">
          <h3 className="font-semibold">Detalles</h3>
          <Row
            label="Enviado"
            value={exec.submittedAt ? new Date(exec.submittedAt).toLocaleString() : "—"}
          />
          <Row label="Recompensa" value={`${mission?.rewardPoints ?? 0} pts`} />
          <Row label="Establecimiento" value={venue?.commercialName ?? "—"} />
          {exec.lat !== undefined && (
            <Row
              label="Ubicación"
              value={`${exec.lat.toFixed(5)}, ${exec.lng?.toFixed(5)}`}
              icon={MapPin}
            />
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Respuestas</h3>
          {mission?.fields.map((f) => (
            <div key={f.id} className="text-sm">
              <div className="text-xs text-muted-foreground">{f.label}</div>
              <div className="font-medium break-words">{formatValue(exec.answers[f.id])}</div>
            </div>
          ))}
        </Card>
      </div>

      {exec.evidences.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Evidencias</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {exec.evidences.map((ev) => (
              <div key={ev.id} className="rounded-md overflow-hidden border border-border bg-muted">
                {ev.type === "photo" && ev.fileDataUrl ? (
                  <img src={ev.fileDataUrl} alt="evidencia" className="w-full h-40 object-cover" />
                ) : (
                  <div className="p-3 text-xs">{ev.type}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {exec.status === "needs_fix" && exec.reviewNotes && (
        <Card className="p-4 border-orange-500/40 bg-orange-500/5">
          <div className="flex gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <div>
              <strong>Corrección solicitada:</strong> {exec.reviewNotes}
            </div>
          </div>
        </Card>
      )}

      {["submitted", "in_review"].includes(exec.status) && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Decisión</h3>
          <Textarea
            placeholder="Nota / motivo (obligatorio para rechazo o corrección)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => act("approve")} className="flex-1">
              <Check className="h-4 w-4 mr-1" /> Aprobar
            </Button>
            <Button onClick={() => act("needs_fix")} variant="outline" className="flex-1">
              <AlertCircle className="h-4 w-4 mr-1" /> Solicitar corrección
            </Button>
            <Button onClick={() => act("reject")} variant="destructive" className="flex-1">
              <X className="h-4 w-4 mr-1" /> Rechazar
            </Button>
          </div>
        </Card>
      )}

      {exec.reviewNotes && exec.status !== "needs_fix" && (
        <Card className="p-4 text-sm">
          <div className="text-xs text-muted-foreground">Nota del auditor</div>
          <div>{exec.reviewNotes}</div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof MapPin }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium inline-flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />} {value}
      </span>
    </div>
  );
}

function formatValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
