import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/impulzii/Logo";
import { Target, Award, Store, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Impulzii — Convierte tu turno en recompensas" },
      {
        name: "description",
        content:
          "Meseros, bartenders, vendedores, promotores y tenderos: ejecuta misiones comerciales de tus marcas favoritas y gana puntos por cada actividad aprobada.",
      },
      { property: "og:title", content: "Impulzii — Misiones comerciales con recompensas" },
      {
        property: "og:description",
        content:
          "Publica actividades comerciales, adjunta evidencias y gana puntos por cada misión validada.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex gap-2">
            <Link to="/auth">
              <Button variant="ghost">Ingresar</Button>
            </Link>
            <Link to="/auth" search={{ mode: "register" }}>
              <Button>Registrarme</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-balance">
            Convierte cada turno
            <br />
            en <span className="gradient-brand bg-clip-text text-transparent">recompensas</span>.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Impulzii conecta marcas y distribuidores con meseros, bartenders, vendedores, promotores
            y tenderos que ejecutan actividades comerciales y ganan puntos por cada misión validada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "register" }}>
              <Button size="lg">Comenzar gratis</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-24 grid gap-4 md:grid-cols-4">
          {[
            {
              icon: Target,
              title: "Misiones a tu medida",
              desc: "Ves solo actividades para tu ciudad, tu perfil y tu establecimiento.",
            },
            {
              icon: Store,
              title: "Vincúlate a tu punto de venta",
              desc: "Restaurantes, bares, hoteles, tiendas y más.",
            },
            {
              icon: Award,
              title: "Puntos por cada misión",
              desc: "Redime en el catálogo de recompensas.",
            },
            {
              icon: ShieldCheck,
              title: "Validación transparente",
              desc: "Foto, ubicación y auditoría en cada evidencia.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <div className="grid h-10 w-10 place-items-center rounded-lg gradient-brand text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Impulzii — impulzii.com
      </footer>
    </div>
  );
}
