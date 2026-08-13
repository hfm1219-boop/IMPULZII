import { useRef } from "react";
import type { MissionField } from "@/lib/impulzii/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { toast } from "sonner";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

interface Props {
  field: MissionField;
  value: unknown;
  onChange: (v: unknown) => void;
  onPhoto?: (dataUrl: string) => void;
}

export function DynamicField({ field, value, onChange, onPhoto }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = (
    <Label className="text-sm font-medium">
      {field.label}
      {field.required && <span className="text-destructive ml-1">*</span>}
      {field.description && (
        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
          {field.description}
        </span>
      )}
    </Label>
  );

  const commonWrap = (child: React.ReactNode) => (
    <div className="space-y-2">
      {label}
      {child}
    </div>
  );

  switch (field.type) {
    case "short_text":
      return commonWrap(
        <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />,
      );
    case "long_text":
      return commonWrap(
        <Textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />,
      );
    case "number":
    case "currency":
      return commonWrap(
        <Input
          type="number"
          min={field.min}
          max={field.max}
          value={(value as number | undefined) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />,
      );
    case "date":
      return commonWrap(
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "time":
      return commonWrap(
        <Input
          type="time"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />,
      );
    case "yes_no":
      return commonWrap(
        <div className="flex gap-2">
          <Button
            type="button"
            variant={value === true ? "default" : "outline"}
            onClick={() => onChange(true)}
          >
            Sí
          </Button>
          <Button
            type="button"
            variant={value === false ? "default" : "outline"}
            onClick={() => onChange(false)}
          >
            No
          </Button>
        </div>,
      );
    case "dropdown":
      return commonWrap(
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>,
      );
    case "single_choice":
      return commonWrap(
        <RadioGroup value={(value as string) ?? ""} onValueChange={onChange}>
          {(field.options ?? []).map((o) => (
            <div key={o} className="flex items-center gap-2">
              <RadioGroupItem value={o} id={`${field.id}-${o}`} />
              <Label htmlFor={`${field.id}-${o}`} className="font-normal">
                {o}
              </Label>
            </div>
          ))}
        </RadioGroup>,
      );
    case "multi_choice": {
      const arr = (value as string[]) ?? [];
      return commonWrap(
        <div className="space-y-2">
          {(field.options ?? []).map((o) => (
            <div key={o} className="flex items-center gap-2">
              <Checkbox
                id={`${field.id}-${o}`}
                checked={arr.includes(o)}
                onCheckedChange={(c) => {
                  const next = c ? [...arr, o] : arr.filter((x) => x !== o);
                  onChange(next);
                }}
              />
              <Label htmlFor={`${field.id}-${o}`} className="font-normal">
                {o}
              </Label>
            </div>
          ))}
        </div>,
      );
    }
    case "photo":
      return commonWrap(
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                toast.error("Selecciona un archivo de imagen válido");
                e.target.value = "";
                return;
              }
              if (file.size > MAX_FILE_BYTES) {
                toast.error("La imagen no puede superar 2 MB");
                e.target.value = "";
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                onChange(dataUrl);
                onPhoto?.(dataUrl);
              };
              reader.readAsDataURL(file);
            }}
          />
          {value ? (
            <div className="relative">
              <img
                src={value as string}
                alt="Evidencia"
                className="rounded-lg max-h-64 w-full object-cover border border-border"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => inputRef.current?.click()}
              >
                Cambiar foto
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="h-5 w-5 mr-2" /> Tomar fotografía
            </Button>
          )}
        </div>,
      );
    case "document":
      return commonWrap(
        <Input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return onChange("");
            if (file.size > MAX_FILE_BYTES) {
              toast.error("El archivo no puede superar 2 MB");
              e.target.value = "";
              return;
            }
            onChange(file.name);
          }}
        />,
      );
    default:
      return commonWrap(
        <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />,
      );
  }
}
