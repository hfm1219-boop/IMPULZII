import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Ir a la página de bienvenida de Kicker"
      className={`inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <span className="text-xl font-black tracking-tight">
        KICK<span className="text-accent">ER</span>
      </span>
    </Link>
  );
}
