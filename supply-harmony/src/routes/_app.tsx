import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { ChatWidget } from "@/components/ai/ChatWidget";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ViewSwitcher } from "@/components/platform/ViewSwitcher";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-secondary/40">
      {/* Sidebar desktop */}
      <div className="sticky top-0 hidden h-screen lg:block">
        <PlatformSidebar />
      </div>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full bg-sidebar shadow-card">
            <PlatformSidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:px-8">
          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-border lg:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="lg:hidden">
            <Logo compact />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3.5 py-2 text-sm text-muted-foreground sm:flex">
              <Search className="h-4 w-4" />
              <span>Buscar pedidos, productos, clientes…</span>
            </div>
            <ViewSwitcher className="hidden sm:inline-flex" />
            <ThemeToggle />
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl bg-secondary/70 px-2 py-1.5 transition-colors hover:bg-secondary"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand text-sm font-bold text-primary-foreground">
                AC
              </span>
              <div className="hidden pr-1 leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">Ana Cárdenas</p>
                <p className="text-xs text-muted-foreground">Gerente de Operaciones</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
