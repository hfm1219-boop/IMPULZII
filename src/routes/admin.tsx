import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { AdminSidebar } from "@/components/impulzii/AdminSidebar";
import { useAuth } from "@/lib/impulzii/auth-context";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, ready } = useAuth();
  const path = useRouterState({ select: (state) => state.location.pathname });
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" />;
  if (!user.roles.some((role) => ["platform_admin", "auditor", "venue_admin"].includes(role))) {
    return <Navigate to="/app" />;
  }
  if (
    !user.roles.includes("platform_admin") &&
    user.roles.includes("auditor") &&
    !path.startsWith("/admin/executions")
  ) {
    return <Navigate to="/admin/executions" />;
  }
  if (
    !user.roles.includes("platform_admin") &&
    user.roles.includes("venue_admin") &&
    path !== "/admin/redemptions"
  ) {
    return <Navigate to="/admin/redemptions" />;
  }
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
