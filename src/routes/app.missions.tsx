import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/missions")({
  component: () => <Outlet />,
});
