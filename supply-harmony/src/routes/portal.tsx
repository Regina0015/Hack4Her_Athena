import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, RefreshCw, Clock, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ViewSwitcher } from "@/components/platform/ViewSwitcher";
import { ChatWidget } from "@/components/ai/ChatWidget";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";
import pythiaBot from "@/assets/pythia-bot.png";
import pythiaAvatar from "@/assets/pythia-avatar.png";

export const Route = createFileRoute("/portal")({
  component: Portal,
});

type Decision = null | "aceptado" | "otra" | "esperar";

function Portal() {
  const [decision, setDecision] = useState<Decision>(null);

  // Cliente activo: lo derivamos del primer customerId real con pedidos.
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: () => api.orders() });
  const customerIds = [...new Set((ordersQ.data ?? []).map((o) => o.customerId))].slice(0, 15);
  const [customerId, setCustomerId] = useState<string | null>(null);
  useEffect(() => {
    if (!customerId && customerIds.length > 0) setCustomerId(customerIds[0]);
  }, [customerId, customerIds]);

  const pendingQ = useQuery({
    queryKey: ["portal", "pending", customerId],
    queryFn: () => api.pending(customerId!),
    enabled: !!customerId,
  });
  const pendingCount = pendingQ.data?.length ?? 0;
  // Nombre real del producto faltante si el backend reporta pendientes.
  const realName = pendingQ.data?.[0]?.nombreSku || "Fanta 600 ml";

  return (
    <div className="min-h-screen bg-secondary/50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Logo compact />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Salir
            </Link>
          </div>
        </div>

        <ViewSwitcher className="mt-4 self-start" />

        {/* Selector de cliente (clientes reales del backend) */}
        {customerIds.length > 0 && (
          <select
            value={customerId ?? ""}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mt-3 w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground outline-none ring-primary/40 focus:ring-2"
          >
            {customerIds.map((id) => (
              <option key={id} value={id}>
                Cliente {id.replace(/[^0-9]/g, "").slice(-6) || id.slice(0, 6)}
              </option>
            ))}
          </select>
        )}

        {/* Saludo */}
        <div className="mt-5">
          <p className="text-sm font-semibold text-muted-foreground">Hola 👋</p>
          <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-foreground">
            {pendingCount > 0
              ? `Tienes ${pendingCount} pedido(s) por validar`
              : "Tu pedido necesita validación"}
          </h1>
        </div>

        {/* Notificación */}
        <div className="mt-4 flex items-center gap-3 rounded-3xl bg-gradient-brand p-4 text-primary-foreground shadow-brand">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Un producto no está disponible</p>
            <p className="text-xs text-primary-foreground/85">Pythia ya te aseguró una alternativa.</p>
          </div>
        </div>

        {decision === null ? (
          <>
            {/* Tarjeta morada: Pythia Bot habla en primera persona */}
            <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
              <div className="flex items-start gap-3">
                <img
                  src={pythiaBot}
                  alt="Pythia Bot"
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 drop-shadow animate-float-slow"
                />
                <div>
                  <p className="text-sm font-bold">Pythia Bot</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ai-foreground/95">
                    “¡Hola! Noté que no alcanzamos Fanta para tu pedido, pero como sé que a tus clientes les
                    encantan los sabores cítricos, ya te aseguré Sprite de 600 ml. ¡Tu negocio no se detiene!”
                  </p>
                </div>
              </div>
            </div>

            {/* Producto vs alternativa */}
            <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary/60 p-4 text-center">
                  <span className="text-3xl">🥤</span>
                  <p className="mt-2 text-sm font-bold text-foreground">{realName}</p>
                  <p className="text-xs font-semibold text-destructive">No disponible</p>
                </div>
                <div className="rounded-2xl bg-ai-soft p-4 text-center ring-2 ring-ai/30">
                  <span className="text-3xl">🟢</span>
                  <p className="mt-2 text-sm font-bold text-foreground">Sprite 600 ml</p>
                  <p className="text-xs font-semibold text-ai">Sugerido por Pythia</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-ai-soft/70 p-3 text-sm text-foreground">
                <img src={pythiaAvatar} alt="" width={28} height={28} loading="lazy" className="h-7 w-7 shrink-0" />
                <span>
                  Elegí <strong>Sprite</strong> por tu preferencia de sabores cítricos.{" "}
                  <strong className="text-ai">92% compatible.</strong>
                </span>
              </div>
            </div>

            {/* Botones grandes */}
            <div className="mt-5 space-y-3">
              <button
                onClick={() => setDecision("aceptado")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-base font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98]"
              >
                <Check className="h-5 w-5" /> Aceptar Sprite 600 ml
              </button>
              <button
                onClick={() => setDecision("otra")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-4 text-base font-bold text-foreground transition-transform active:scale-[0.98]"
              >
                <RefreshCw className="h-5 w-5 text-muted-foreground" /> Elegir otra opción
              </button>
              <button
                onClick={() => setDecision("esperar")}
                className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-semibold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                <Clock className="h-4 w-4" /> Esperar reposición
              </button>
            </div>

            <p className="mt-auto pt-6 text-center text-xs text-muted-foreground">
              Tú conservas el control de la decisión.
            </p>
          </>
        ) : (
          <Confirmation decision={decision} onReset={() => setDecision(null)} />
        )}
      </div>

      {/* Asistente Pythia en modo cliente (conectado al backend) */}
      <ChatWidget mode="cliente" />
    </div>
  );
}

function Confirmation({ decision, onReset }: { decision: Exclude<Decision, null>; onReset: () => void }) {
  const map = {
    aceptado: { icon: Check, color: "bg-success/12 text-success", title: "¡Sustitución aceptada!", text: "Tu pedido sale con Sprite 600 ml. Llega hoy mismo." },
    otra: { icon: RefreshCw, color: "bg-ai-soft text-ai", title: "Veamos otras opciones", text: "Pythia te mostrará alternativas compatibles con tus preferencias." },
    esperar: { icon: Clock, color: "bg-warning/12 text-warning", title: "Reposición programada", text: "Pythia te avisará en cuanto Fanta 600 ml esté disponible." },
  } as const;
  const item = map[decision];
  const Icon = item.icon;
  return (
    <div className="mt-8 flex flex-1 flex-col items-center justify-center text-center">
      <img src={pythiaBot} alt="Pythia Bot" width={96} height={96} loading="lazy" className="h-24 w-24 drop-shadow animate-float-slow" />
      <span className={cn("mt-4 grid h-16 w-16 place-items-center rounded-3xl", item.color)}>
        <Icon className="h-8 w-8" />
      </span>
      <h2 className="mt-4 text-xl font-extrabold text-foreground">{item.title}</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{item.text}</p>
      <button
        onClick={onReset}
        className="mt-8 rounded-2xl bg-secondary px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-muted"
      >
        Volver
      </button>
    </div>
  );
}
