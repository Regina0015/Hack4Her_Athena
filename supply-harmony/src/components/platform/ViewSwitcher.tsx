import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vistas de doble impacto: alterna entre la vista de la Empresa (operador CEDIS)
 * y la vista del Cliente (portal de la tiendita).
 */
export function ViewSwitcher({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isClient = pathname.startsWith("/portal");

  return (
    <div className={cn("inline-flex items-center rounded-2xl border border-border bg-secondary/60 p-1", className)}>
      <Link
        to="/dashboard"
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
          !isClient ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Building2 className="h-3.5 w-3.5" /> Empresa
      </Link>
      <Link
        to="/portal"
        className={cn(
          "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all",
          isClient ? "bg-gradient-brand text-primary-foreground shadow-brand" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Store className="h-3.5 w-3.5" /> Cliente
      </Link>
    </div>
  );
}
