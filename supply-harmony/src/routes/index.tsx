import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Building2,
  Store,
  ArrowRight,
  BarChart3,
  Boxes,
  GitBranch,
  UserRound,
  CheckCircle2,
  Sparkles,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Route = createFileRoute("/")({
  component: Landing,
});

const adminFeatures = [
  { icon: BarChart3, label: "Centro de control inteligente" },
  { icon: Boxes, label: "Inventario predictivo" },
  { icon: GitBranch, label: "Gestión de pedidos" },
  { icon: UserRound, label: "Perfil inteligente del cliente" },
];

const clientFeatures = [
  "Validación de tu pedido",
  "Sustituciones sugeridas por Pythia",
  "Tú conservas el control de la decisión",
  "Sin sorpresas, sin devoluciones",
];

function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-secondary/40">
      {/* Glows de fondo */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-brand-soft opacity-60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[460px] w-[460px] rounded-full bg-gradient-ai opacity-10 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between border-b border-border/60 px-6 py-5 lg:px-10">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 rounded-full bg-success/12 px-3 py-1.5 text-xs font-bold text-success sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_currentColor]" />
            Sistema activo
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:py-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-brand-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> IA aplicada a la logística de último kilómetro
        </span>

        <h1 className="mt-7 max-w-3xl text-center text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground lg:text-6xl">
          Detectamos el problema{" "}
          <span className="bg-gradient-brand bg-clip-text text-transparent">
            antes de que el camión salga.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-center text-sm leading-relaxed text-muted-foreground lg:text-base">
          Pythia detecta el desabasto, entiende las preferencias del cliente, recomienda el mejor
          sustituto y deja que el cliente decida. Sin sorpresas. Sin devoluciones.
        </p>

        {/* Tarjetas de selección de vista */}
        <div className="mt-12 grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {/* Panel Admin / Empresa */}
          <Link
            to="/dashboard"
            className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft transition-all hover:-translate-y-1.5 hover:shadow-card"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-brand" />
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-brand">
              <Building2 className="h-7 w-7" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Portal administrador
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              Centro de Comando Arca
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Monitorea riesgos en tiempo real, valida órdenes, predice desabastos y gestiona
              sustituciones antes del despacho.
            </p>
            <div className="mt-5 space-y-2">
              {adminFeatures.map((f) => (
                <div key={f.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <f.icon className="h-4 w-4 text-primary" />
                  {f.label}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-brand px-4 py-3 text-sm font-bold text-primary-foreground shadow-brand">
              Entrar al portal
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Panel Cliente */}
          <Link
            to="/portal"
            className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-soft transition-all hover:-translate-y-1.5 hover:shadow-card"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-gradient-ai" />
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-ai text-ai-foreground shadow-ai">
              <Store className="h-7 w-7" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-ai">
              Portal cliente
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground">
              Tu Tienda, Tu Decisión
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Revisa tus pedidos, aprueba sustituciones y mantén el control total sobre lo que
              recibes. Sin sorpresas.
            </p>
            <div className="mt-5 space-y-2">
              {clientFeatures.map((label) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-ai px-4 py-3 text-sm font-bold text-ai-foreground shadow-ai">
              Entrar como tienda
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Flujo demo */}
        <div className="mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {[
            { label: "Pythia detecta desabasto de Fanta", accent: true },
            { label: "→ Predice 30 unidades faltantes" },
            { label: "→ Identifica 12 órdenes afectadas" },
            { label: "→ Recomienda Sprite (92%)" },
            { label: "→ Cliente aprueba antes del despacho" },
            { label: "→ Pedido sale validado ✓", success: true },
          ].map((step) => (
            <span
              key={step.label}
              className={
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold " +
                (step.accent
                  ? "border-primary/30 bg-gradient-brand-soft text-primary"
                  : step.success
                    ? "border-success/30 bg-success/12 text-success"
                    : "border-border bg-card text-muted-foreground")
              }
            >
              {step.label}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 px-6 py-5 text-center lg:px-10">
        <div className="flex flex-col items-center justify-center gap-1">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="h-3.5 w-3.5 text-primary" />
            Pythia · Arca Continental · 2026 · Powered by AI
          </p>
          <Link to="/login" className="text-xs font-semibold text-primary hover:underline">
            ¿Acceso corporativo? Inicia sesión
          </Link>
        </div>
      </footer>
    </div>
  );
}
