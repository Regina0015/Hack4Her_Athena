import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Boxes, GitBranch, UserRound, Smartphone, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventario predictivo", icon: Boxes },
  { to: "/orders", label: "Gestión de pedidos", icon: GitBranch },
  { to: "/clients", label: "Perfil del cliente", icon: UserRound },
] as const;

export function PlatformSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="flex h-full w-[264px] flex-col gap-2 border-r border-border bg-sidebar px-4 py-5">
      <div className="px-2 pb-4">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all",
                active
                  ? "bg-gradient-brand text-primary-foreground shadow-brand"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className={cn("h-[18px] w-[18px]", active ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-2 border-t border-border pt-3">
        <Link
          to="/portal"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
        >
          <Smartphone className="h-[18px] w-[18px] text-muted-foreground" />
          Portal del cliente
        </Link>
      </div>

      <div className="mt-auto">
        <div className="rounded-3xl bg-gradient-brand-soft p-4">
          <div className="mb-1.5 flex items-center gap-2 text-primary">
            <Bell className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Alerta activa</span>
          </div>
          <p className="text-sm font-semibold leading-snug text-foreground">
            Fanta 600 ml se agotará en ~4 h
          </p>
          <p className="mt-1 text-xs text-muted-foreground">12 pedidos requieren sustitución.</p>
        </div>
      </div>
    </aside>
  );
}
