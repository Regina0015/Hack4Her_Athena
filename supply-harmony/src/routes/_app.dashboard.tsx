import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes,  ArrowLeftRight, CheckCircle2, TrendingDown, MapPin, ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-logistics.jpg";
import { centers, monterreyMap, type Risk } from "@/lib/mock-data";
import { api, pct } from "@/lib/api/client";
import { RiskBadge, SectionTitle } from "@/components/platform/ui";
import { Sparkline } from "@/components/platform/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const kpiIcons = { alert: AlertTriangle, box: Boxes, swap: ArrowLeftRight, check: CheckCircle2 } as const;
const alertEmoji: Record<Risk, string> = { alto: "🔴", medio: "🟠", bajo: "🟢" };

function Dashboard() {
  const kpisQ = useQuery({ queryKey: ["dashboard", "kpis"], queryFn: api.dashboardKpis });
  const alertsQ = useQuery({ queryKey: ["dashboard", "alerts"], queryFn: api.dashboardAlerts });

  // KPIs reales del backend mapeados a las tarjetas de la UI.
  // Los 3 de productos vienen del Status REAL de las líneas (base de datos).
  const k = kpisQ.data;
  const fmt = (n?: number) => (n === undefined ? "—" : n.toLocaleString("es-MX"));
  const kpiCards = [
    { id: "k1", label: "Pedidos en total", value: fmt(k?.totalPedidos), delta: "tabla orders", tone: "bajo" as Risk, icon: "box" },
    { id: "k2", label: "Productos pendientes", value: fmt(k?.lineasPendientes), delta: "líneas · Registrado", tone: "medio" as Risk, icon: "swap" },
    { id: "k3", label: "Productos entregados", value: fmt(k?.lineasEntregadas), delta: "líneas · Entregado", tone: "bajo" as Risk, icon: "check" },
    { id: "k4", label: "Sustituciones reales", value: fmt(k?.totalSustituciones), delta: "datos reales", tone: "alto" as Risk, icon: "alert" },
  ];

  // Alertas reales → forma de la tarjeta (title/detail/time).
  const alertCards = (alertsQ.data ?? []).slice(0, 4).map((a) => ({
    id: a.id,
    level: a.severidad,
    title: a.mensaje,
    detail: a.tipo === "stock_critico" ? `SKU ${a.referencia}` : `Pedido ${a.referencia}`,
    time: a.tipo === "stock_critico" ? "Inventario" : "Pedidos",
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-muted-foreground">Buenos días, Ana 👋</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
          Centro de control inteligente
        </h1>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-brand p-6 text-primary-foreground shadow-brand lg:p-10">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Pythia en tiempo real
          </span>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight lg:text-4xl">
            Pythia detectó posibles faltantes antes del despacho
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/85 lg:text-base">
            {k
              ? `${k.pedidosEnRiesgo} pedidos en riesgo y ${k.productosCriticos} productos críticos. Pythia ya preparó las mejores sustituciones para que el cliente conserve el control.`
              : "Pythia ya preparó las mejores sustituciones para que el cliente conserve el control."}
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-background px-5 py-3 text-sm font-bold text-primary shadow-soft transition-transform hover:scale-[1.02]"
          >
            Revisar sustituciones <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <img
          src={heroImg}
          alt="Centro de distribución logístico"
          width={1280}
          height={960}
          className="pointer-events-none absolute -right-6 bottom-0 hidden w-[46%] max-w-2xl rounded-2xl opacity-95 mix-blend-luminosity lg:block"
        />
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = kpiIcons[card.icon as keyof typeof kpiIcons];
          return (
            <div key={card.id} className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-card">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-2xl",
                    card.tone === "alto" && "bg-destructive/10 text-destructive",
                    card.tone === "medio" && "bg-warning/12 text-warning",
                    card.tone === "bajo" && "bg-success/12 text-success",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <RiskBadge risk={card.tone} label={card.delta} />
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground">
                {kpisQ.isLoading ? "…" : card.value}
              </p>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </section>

      {/* Distribución REAL por Status (tabla orders) */}
      {k && (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Distribución de productos por Status</p>
              <p className="text-[11px] text-muted-foreground/70">
                Cuenta líneas de producto, no pedidos. El conteo por pedido está en Gestión de pedidos.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">{k.totalLineas.toLocaleString("es-MX")} productos · datos reales</p>
          </div>
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-secondary">
            <div className="bg-warning" style={{ width: `${(k.lineasPendientes / Math.max(k.totalLineas, 1)) * 100}%` }} />
            <div className="bg-success" style={{ width: `${(k.lineasEntregadas / Math.max(k.totalLineas, 1)) * 100}%` }} />
            <div className="bg-destructive" style={{ width: `${(k.lineasRechazadas / Math.max(k.totalLineas, 1)) * 100}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /> Pendientes: <strong>{k.lineasPendientes.toLocaleString("es-MX")}</strong></span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Entregados: <strong>{k.lineasEntregadas.toLocaleString("es-MX")}</strong></span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Rechazados: <strong>{k.lineasRechazadas.toLocaleString("es-MX")}</strong></span>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* MAPA OPERATIVO — Monterrey (ubicaciones ilustrativas) */}
        <section className="lg:col-span-3">
          <SectionTitle title="Mapa operativo" subtitle="Centros de distribución en el área metropolitana de Monterrey" />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="relative h-[320px] w-full overflow-hidden rounded-2xl border border-border">
              {/* Mapa real de Monterrey (OpenStreetMap, sin API key) */}
              <iframe
                title="Mapa de Monterrey"
                className="h-full w-full"
                style={{ border: 0, filter: "grayscale(0.2) contrast(1.05)" }}
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${monterreyMap.bbox.minLng}%2C${monterreyMap.bbox.minLat}%2C${monterreyMap.bbox.maxLng}%2C${monterreyMap.bbox.maxLat}&layer=mapnik`}
              />

              {/* Marcadores de CEDIS superpuestos según su lat/lng dentro de la bbox */}
              <div className="pointer-events-none absolute inset-0">
                {centers.map((c) => {
                  const left = ((c.lng - monterreyMap.bbox.minLng) / (monterreyMap.bbox.maxLng - monterreyMap.bbox.minLng)) * 100;
                  const top = ((monterreyMap.bbox.maxLat - c.lat) / (monterreyMap.bbox.maxLat - monterreyMap.bbox.minLat)) * 100;
                  return (
                    <div key={c.id} className="pointer-events-auto absolute" style={{ left: `${left}%`, top: `${top}%` }}>
                      <div className="group relative -translate-x-1/2 -translate-y-1/2">
                        <span
                          className={cn(
                            "block h-4 w-4 rounded-full ring-4 ring-offset-1 ring-offset-background",
                            c.status === "alto" && "bg-destructive ring-destructive/30 animate-pulse-ring",
                            c.status === "medio" && "bg-warning ring-warning/30",
                            c.status === "bajo" && "bg-success ring-success/30",
                          )}
                        />
                        <div className="pointer-events-none absolute left-1/2 top-6 z-10 w-48 -translate-x-1/2 rounded-xl border border-border bg-card p-2.5 text-center opacity-0 shadow-card transition-opacity group-hover:opacity-100">
                          <p className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
                            <MapPin className="h-3 w-3 text-primary" /> {c.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">{c.city}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {centers.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                  <RiskBadge risk={c.status} label={c.city} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ALERTAS */}
        <section className="lg:col-span-2">
          <SectionTitle title="Alertas inteligentes" subtitle="Detección automática" />
          <div className="space-y-3">
            {alertsQ.isLoading && (
              <div className="rounded-3xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
                Cargando alertas…
              </div>
            )}
            {!alertsQ.isLoading && alertCards.length === 0 && (
              <div className="rounded-3xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
                Sin alertas activas. ✅
              </div>
            )}
            {alertCards.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-card"
              >
                <span className="text-xl">{alertEmoji[a.level]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-snug text-foreground">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground/70">{a.time}</p>
                </div>
              </div>
            ))}
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
                <TrendingDown className="h-4 w-4 text-primary" /> Tendencia de faltantes (7 días)
              </div>
              <Sparkline data={[8, 11, 9, 14, 12, 16, 18]} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
