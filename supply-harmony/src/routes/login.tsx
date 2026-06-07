import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import loginBg from "@/assets/login-bg.jpg";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Panel visual */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img src={loginBg} alt="Centro de distribución" width={1280} height={1600} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-guindo/70 via-primary/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-10 text-primary-foreground">
          <Logo className="[&_p]:text-primary-foreground" />
          <div className="max-w-md">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Supply Chain Intelligence
            </span>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight">Prevención inteligente de faltantes.</h2>
            <p className="mt-3 text-primary-foreground/85">
              Pythia detecta el faltante antes de que el camión salga y propone la mejor alternativa.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <ThemeToggle />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Accede al centro de control inteligente.</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = "/dashboard";
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Correo corporativo</label>
              <input
                type="email"
                defaultValue="ana.cardenas@arca.com"
                className="w-full rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none ring-primary/40 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">Contraseña</label>
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full rounded-2xl border border-border bg-secondary/40 px-4 py-3 text-sm outline-none ring-primary/40 focus:ring-2"
              />
            </div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-bold text-primary-foreground shadow-brand transition-transform hover:scale-[1.01]"
            >
              Entrar a la plataforma <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-secondary/50 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            Acceso seguro · Pythia para Arca Continental
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Eres cliente?{" "}
            <Link to="/portal" className="font-semibold text-primary hover:underline">
              Ir al portal del cliente
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
