import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Target, Activity, Gift, User } from "lucide-react";

const items = [
  { to: "/app", icon: Home, label: "Inicio" },
  { to: "/app/missions", icon: Target, label: "Misiones" },
  { to: "/app/activity", icon: Activity, label: "Actividad" },
  { to: "/app/rewards", icon: Gift, label: "Recompensas" },
  { to: "/app/profile", icon: User, label: "Perfil" },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur md:sticky md:top-0 md:h-screen md:w-60 md:border-r md:border-t-0 md:flex md:flex-col md:pt-6">
      <div className="hidden md:block px-4 pb-4">
        <Link
          to="/"
          aria-label="Ir a la página de bienvenida de Impulzii"
          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="text-xl font-black tracking-tight">
            Impulz<span className="text-primary">ii</span>
          </div>
        </Link>
      </div>
      <ul className="flex md:flex-col justify-around md:justify-start md:gap-1 md:px-2">
        {items.map((it) => {
          const active = it.to === "/app" ? path === "/app" : path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <li key={it.to} className="flex-1 md:flex-none">
              <Link
                to={it.to}
                className={`flex md:flex-row flex-col items-center gap-1 md:gap-3 py-2 md:py-2 md:px-3 rounded-md text-xs md:text-sm transition-colors ${
                  active
                    ? "text-primary md:bg-primary/10 md:text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground md:hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
