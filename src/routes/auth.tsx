import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/impulzii/Logo";
import { AuthService } from "@/lib/impulzii/services";
import { PROFILE_KIND_LABELS } from "@/lib/impulzii/types";
import type { ProfileKind } from "@/lib/impulzii/types";
import { useAuth } from "@/lib/impulzii/auth-context";
import { getState } from "@/lib/impulzii/store";

const searchSchema = z.object({
  mode: z.enum(["login", "register"]).optional().default("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Ingresar a Kicker" },
      { name: "description", content: "Inicia sesión o crea tu cuenta en Kicker." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");

  return (
    <div className="min-h-screen grid place-items-center px-4 py-8 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card className="p-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarme</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm
                onDone={(role) => {
                  refresh();
                  navigate({ to: role === "participant" ? "/app" : "/admin" });
                }}
              />
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <RegisterForm
                onDone={() => {
                  refresh();
                  navigate({ to: "/app" });
                }}
              />
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-xs text-muted-foreground text-center">
          <p className="mb-2 font-semibold">Cuentas demo (MVP):</p>
          <div className="grid grid-cols-2 gap-2">
            {getState()
              .users.filter((u) =>
                ["u_demo", "u_buena_vida_admin", "u_auditor", "u_admin"].includes(u.id),
              )
              .map((u) => (
                <button
                  key={u.id}
                  className="rounded-md border border-border bg-card px-2 py-1.5 text-left hover:bg-muted"
                  onClick={() => {
                    const usr = AuthService.loginAs(u.id);
                    if (usr) {
                      refresh();
                      toast.success(`Sesión iniciada como ${usr.fullName}`);
                      navigate({
                        to: usr.roles.some((role) =>
                          ["platform_admin", "auditor", "venue_admin"].includes(role),
                        )
                          ? "/admin"
                          : "/app",
                      });
                    }
                  }}
                >
                  <div className="font-semibold text-foreground">{u.fullName}</div>
                  <div className="text-[10px] text-muted-foreground">{u.roles.join(", ")}</div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onDone }: { onDone: (role: string) => void }) {
  const [email, setEmail] = useState("demo@kicker.com");
  const [password, setPassword] = useState("demo");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!email) {
          toast.error("Ingresa tu correo");
          return;
        }
        const user = AuthService.loginByEmail(email);
        if (!user) {
          toast.error("Usuario no encontrado. Usa una cuenta demo.");
          return;
        }
        toast.success(`Bienvenido, ${user.fullName}`);
        onDone(
          user.roles.some((role) => ["platform_admin", "auditor", "venue_admin"].includes(role))
            ? "admin"
            : "participant",
        );
      }}
    >
      <div>
        <Label>Correo</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label>Contraseña</Label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-muted-foreground mt-1">
          MVP demo: cualquier contraseña funciona.
        </p>
      </div>
      <Button type="submit" className="w-full">
        Entrar
      </Button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "Barranquilla",
    docNumber: "",
    profileKind: "bartender" as ProfileKind,
  });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          AuthService.register({
            ...form,
            docType: "CC",
            photoUrl: undefined,
          });
          toast.success("Cuenta creada");
          onDone();
        } catch (err) {
          toast.error((err as Error).message);
        }
      }}
    >
      <div>
        <Label>Nombre completo</Label>
        <Input
          required
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Documento</Label>
          <Input
            required
            value={form.docNumber}
            onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
          />
        </div>
        <div>
          <Label>Ciudad</Label>
          <Input
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Correo</Label>
        <Input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div>
        <Label>Celular</Label>
        <Input
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div>
        <Label>Tipo de perfil</Label>
        <Select
          value={form.profileKind}
          onValueChange={(v) => setForm({ ...form, profileKind: v as ProfileKind })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(PROFILE_KIND_LABELS) as [ProfileKind, string][]).map(([k, l]) => (
              <SelectItem key={k} value={k}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Crear cuenta
      </Button>
    </form>
  );
}
