import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Megaphone,
  Target,
  ShieldCheck,
  Users,
  Store,
  Gift,
  ScanLine,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/impulzii/auth-context";
import { AuthService } from "@/lib/impulzii/services";
import { Button } from "@/components/ui/button";

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
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const visibleItems = user?.roles.includes("platform_admin")
    ? items
    : user?.roles.includes("auditor")
      ? items.filter((item) => item.to === "/admin/executions")
      : items.filter((item) => item.to === "/admin/redemptions");
  const links = visibleItems.map((it) => {
    const active = it.exact ? path === it.to : path.startsWith(it.to);
    const Icon = it.icon;
    return (
      <Link
        key={it.to}
        to={it.to as "/admin"}
        className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
            : "hover:bg-sidebar-accent/60"
        }`}
      >
        <Icon className="h-4 w-4" />
        {it.label}
      </Link>
    );
  });
  const logout = () => {
    AuthService.logout();
    refresh();
    navigate({ to: "/" });
  };
  return (
    <>
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:sticky md:top-0 bg-sidebar text-sidebar-foreground">
        <div className="px-5 py-6">
          <Link
            to="/"
            aria-label="Ir a la página de bienvenida de Kicker"
            className="inline-block rounded-md text-xl font-black tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            KICK<span className="text-sidebar-primary">ER</span>
          </Link>
          <div className="text-xs uppercase tracking-wider text-sidebar-foreground/60 mt-1">
            Panel administrativo
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">{links}</nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="mb-2 truncate px-2 text-xs text-sidebar-foreground/60">{user?.fullName}</p>
          <Button variant="ghost" className="w-full justify-start" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto border-t bg-sidebar p-2 text-sidebar-foreground md:hidden">
        {links}
        <button
          type="button"
          onClick={logout}
          className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent/60"
        >
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </nav>
    </>
  );
}
