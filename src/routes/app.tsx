import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/impulzii/BottomNav";
import { useAuth } from "@/lib/impulzii/auth-context";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" />;
  if (!user.roles.includes("participant")) return <Navigate to="/admin" />;
  return (
    <div className="min-h-screen bg-background md:flex">
      <BottomNav />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-4 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
