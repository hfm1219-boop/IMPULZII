import { useState, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/impulzii/auth-context";
import {
  CampaignService,
  MissionService,
  RewardService,
  VenueService,
} from "@/lib/impulzii/services";
import { getState } from "@/lib/impulzii/store";
import type { Frequency, MissionType, VenueType } from "@/lib/impulzii/types";

const date = (days = 0) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
};

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function CreateCampaignDialog() {
  const { user } = useAuth();
  const state = getState();
  const [form, setForm] = useState({
    name: "",
    brandId: state.brands[0]?.id ?? "",
    description: "",
    startDate: date(),
    endDate: date(30),
    budgetPoints: 10000,
    terms: "",
    status: "published" as const,
  });
  return (
    <Shell
      title="Nueva campaña"
      description="Define la marca, vigencia y presupuesto de la campaña."
    >
      {(close) => (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!user) return;
            try {
              CampaignService.create({
                ...form,
                targetCities: [...new Set(state.venues.map((venue) => venue.city))],
                targetVenueIds: state.venues
                  .filter((venue) => venue.active)
                  .map((venue) => venue.id),
                targetProfileKinds: [
                  "waiter",
                  "bartender",
                  "seller",
                  "promoter",
                  "merchandiser",
                  "shopkeeper",
                  "brand_ambassador",
                  "customer_service",
                ],
                ownerUserId: user.id,
              });
              toast.success("Campaña creada");
              close();
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
        >
          <Field label="Nombre">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Marca">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={form.brandId}
              onChange={(e) => setForm({ ...form, brandId: e.target.value })}
            >
              {state.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descripción">
            <Textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio">
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="Fin">
              <Input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Presupuesto en créditos">
            <Input
              type="number"
              min={1}
              required
              value={form.budgetPoints}
              onChange={(e) => setForm({ ...form, budgetPoints: Number(e.target.value) })}
            />
          </Field>
          <Field label="Términos">
            <Textarea
              value={form.terms}
              onChange={(e) => setForm({ ...form, terms: e.target.value })}
            />
          </Field>
          <DialogFooter>
            <Button type="submit">Crear campaña</Button>
          </DialogFooter>
        </form>
      )}
    </Shell>
  );
}

export function CreateMissionDialog() {
  const { user } = useAuth();
  const state = getState();
  const [form, setForm] = useState({
    campaignId: state.campaigns[0]?.id ?? "",
    name: "",
    description: "",
    instructions: "",
    type: "sale" as MissionType,
    startDate: date(),
    endDate: date(30),
    rewardPoints: 200,
    totalQuota: 100,
    perUserQuota: 1,
    frequency: "campaign" as Frequency,
    requiresGeo: false,
    requiresPhoto: false,
    requiresAudit: true,
  });
  return (
    <Shell
      title="Nueva misión"
      description="Configura la actividad, evidencias, cupos y recompensa."
    >
      {(close) => (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!user) return;
            const campaign = state.campaigns.find((item) => item.id === form.campaignId);
            if (!campaign) return toast.error("Crea primero una campaña");
            try {
              MissionService.create(
                {
                  ...form,
                  targetCities: campaign.targetCities,
                  targetVenueIds: campaign.targetVenueIds,
                  targetProfileKinds: campaign.targetProfileKinds,
                  requiresVenueValidation: false,
                  status: "active",
                  fields: [
                    {
                      id: `field_${Date.now()}`,
                      label: "Resultado y observaciones",
                      type: "long_text",
                      required: true,
                      order: 1,
                    },
                  ],
                  geoRadiusMeters: form.requiresGeo ? 300 : undefined,
                },
                user.id,
              );
              toast.success("Misión creada");
              close();
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
        >
          <Field label="Campaña">
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={form.campaignId}
              onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
            >
              {state.campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nombre">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Instrucciones">
            <Textarea
              required
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as MissionType })}
              >
                <option value="sale">Venta</option>
                <option value="display">Exhibición</option>
                <option value="training">Capacitación</option>
                <option value="survey">Encuesta</option>
                <option value="activation">Activación</option>
              </select>
            </Field>
            <Field label="Frecuencia">
              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              >
                <option value="once">Una vez</option>
                <option value="daily">Diaria</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="campaign">Por campaña</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio">
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="Fin">
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Créditos">
              <Input
                type="number"
                min={1}
                value={form.rewardPoints}
                onChange={(e) => setForm({ ...form, rewardPoints: Number(e.target.value) })}
              />
            </Field>
            <Field label="Cupo total">
              <Input
                type="number"
                min={1}
                value={form.totalQuota}
                onChange={(e) => setForm({ ...form, totalQuota: Number(e.target.value) })}
              />
            </Field>
            <Field label="Por persona">
              <Input
                type="number"
                min={1}
                value={form.perUserQuota}
                onChange={(e) => setForm({ ...form, perUserQuota: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            {(
              [
                ["requiresPhoto", "Exigir foto"],
                ["requiresGeo", "Exigir ubicación"],
                ["requiresAudit", "Requiere auditoría"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form[key]}
                  onCheckedChange={(checked) => setForm({ ...form, [key]: checked === true })}
                />
                {label}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!state.campaigns.length}>
              Crear misión
            </Button>
          </DialogFooter>
        </form>
      )}
    </Shell>
  );
}

export function CreateVenueDialog() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    commercialName: "",
    legalName: "",
    nit: "",
    type: "restaurant" as VenueType,
    city: "Cartagena",
    address: "",
    lat: 10.391,
    lng: -75.479,
    joinCode: "",
  });
  return (
    <Shell
      title="Nuevo establecimiento"
      description="Registra un punto de venta disponible para vinculación."
    >
      {(close) => (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!user) return;
            try {
              VenueService.create(
                {
                  ...form,
                  joinCode:
                    form.joinCode.trim().toUpperCase() || `IMP-${Date.now().toString().slice(-6)}`,
                  active: true,
                },
                user.id,
              );
              toast.success("Establecimiento creado");
              close();
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
        >
          <Field label="Nombre comercial">
            <Input
              required
              value={form.commercialName}
              onChange={(e) => setForm({ ...form, commercialName: e.target.value })}
            />
          </Field>
          <Field label="Razón social">
            <Input
              required
              value={form.legalName}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="NIT">
              <Input
                required
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
              />
            </Field>
            <Field label="Tipo">
              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as VenueType })}
              >
                <option value="restaurant">Restaurante</option>
                <option value="bar">Bar</option>
                <option value="hotel">Hotel</option>
                <option value="store">Tienda</option>
                <option value="cafe">Café</option>
                <option value="other">Otro</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad">
              <Input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Código de vinculación">
              <Input
                value={form.joinCode}
                onChange={(e) => setForm({ ...form, joinCode: e.target.value })}
                placeholder="Automático"
              />
            </Field>
          </div>
          <Field label="Dirección">
            <Input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <DialogFooter>
            <Button type="submit">Crear establecimiento</Button>
          </DialogFooter>
        </form>
      )}
    </Shell>
  );
}

export function CreateRewardDialog() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    description: "",
    pointsRequired: 500,
    stock: 10,
    merchantName: "",
    merchantId: "",
    city: "Cartagena",
    category: "Gastronomía",
  });
  return (
    <Shell
      title="Nueva recompensa"
      description="Crea un beneficio vinculado a un comercio autorizado."
    >
      {(close) => (
        <form
          className="space-y-4"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            if (!user) return;
            try {
              RewardService.create({ ...form, active: true }, user.id);
              toast.success("Recompensa creada");
              close();
            } catch (error) {
              toast.error((error as Error).message);
            }
          }}
        >
          <Field label="Nombre del beneficio">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Descripción">
            <Textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Créditos requeridos">
              <Input
                type="number"
                min={1}
                value={form.pointsRequired}
                onChange={(e) => setForm({ ...form, pointsRequired: Number(e.target.value) })}
              />
            </Field>
            <Field label="Inventario">
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
              />
            </Field>
          </div>
          <Field label="Comercio">
            <Input
              required
              value={form.merchantName}
              onChange={(e) => setForm({ ...form, merchantName: e.target.value })}
            />
          </Field>
          <Field label="Identificador del comercio">
            <Input
              required
              value={form.merchantId}
              onChange={(e) =>
                setForm({ ...form, merchantId: e.target.value.toLowerCase().replace(/\s+/g, "_") })
              }
              placeholder="ej. ctg_restaurante"
            />
          </Field>
          <Field label="Ciudad">
            <Input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </Field>
          <DialogFooter>
            <Button type="submit">Crear recompensa</Button>
          </DialogFooter>
        </form>
      )}
    </Shell>
  );
}
