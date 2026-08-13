import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Megaphone,
  Target,
  ShieldCheck,
  Users,
  Store,
  Gift,
  ScanLine,
} from "lucide-react";

const items: { to: string; icon: typeof LayoutDashboard; label: string; exact?: boolean }[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/admin/campaigns", icon: Megaphone, label: "Campañas" },
  { to: "/admin/missions", icon: Target, label: "Misiones" },
  { to: "/admin/executions", icon: ShieldCheck, label: "Auditoría" },
  { to: "/admin/participants", icon: Users, label: "Participantes" },
  { to: "/admin/venues", icon: Store, label: "Establecimientos" },
  { to: "/admin/redemptions", icon: ScanLine, label: "Validar token" },
  { to: "/admin/rewards", icon: Gift, label: "Recompensas" },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:sticky md:top-0 bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6">
        <Link
          to="/"
          aria-label="Ir a la página de bienvenida de Impulzii"
          className="inline-block rounded-md text-xl font-black tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          Impulz<span className="text-sidebar-primary">ii</span>
        </Link>
        <div className="text-xs uppercase tracking-wider text-sidebar-foreground/60 mt-1">
          Panel administrativo
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map((it) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to as "/admin"}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "hover:bg-sidebar-accent/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
