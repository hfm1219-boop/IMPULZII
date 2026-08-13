import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Ir a la página de bienvenida de Kicker"
      className={`inline-flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <div className="grid h-8 w-8 place-items-center rounded-lg gradient-brand text-primary-foreground font-black shadow-sm">
        i
      </div>
      <span className="text-xl font-black tracking-tight">
        Kick<span className="text-accent">er</span>
      </span>
    </Link>
  );
}
