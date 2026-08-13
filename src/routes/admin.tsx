import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/impulzii/AdminSidebar";
import { AuthService } from "@/lib/impulzii/services";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ location }) => {
    const u = AuthService.currentUser();
    if (!u) throw redirect({ to: "/auth" });
    if (!u.roles.some((r) => ["platform_admin", "auditor", "venue_admin"].includes(r))) {
      throw redirect({ to: "/app" });
    }
    if (u.roles.includes("platform_admin")) return;
    if (u.roles.includes("auditor")) {
      if (!location.pathname.startsWith("/admin/executions")) {
        throw redirect({ to: "/admin/executions" });
      }
      return;
    }
    if (u.roles.includes("venue_admin") && location.pathname !== "/admin/redemptions") {
      throw redirect({ to: "/admin/redemptions" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
