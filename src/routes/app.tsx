import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BottomNav } from "@/components/impulzii/BottomNav";
import { AuthService } from "@/lib/impulzii/services";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    const u = AuthService.currentUser();
    if (!u) throw redirect({ to: "/auth" });
    if (!u.roles.includes("participant")) throw redirect({ to: "/admin" });
  },
  component: AppLayout,
});

function AppLayout() {
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
