import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/venues")({
  component: () => <Navigate to="/app/profile" />,
});
