import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Brain, Gauge, CalendarClock, Lightbulb } from "lucide-react";
import { type Product } from "@/lib/mock-data";
import { api, emojiForProduct, type InventoryItem } from "@/lib/api/client";
import { RiskBadge } from "@/components/platform/ui";
import { Sparkline, MiniBars } from "@/components/platform/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/inventory")({
  component: Inventory,
});

/** Combina el shape Product (UI) con los datos reales del InventoryItem. */
type RealProduct = Product & {
  unidades: number;
  lineasPendientes: number;
  lineasEntregadas: number;
};

/** Adapta un InventoryItem (datos reales de orders) al shape de la UI. */
function toProduct(it: InventoryItem): RealProduct {
  const totalLineas = it.lineasPendientes + it.lineasEntregadas;
  // Tendencia visual = ritmo de entregas (proporción entregada por tramos).
  const trend = Array.from({ length: 7 }, (_, i) =>
    Math.max(2, Math.round((it.lineasEntregadas / Math.max(1, totalLineas)) * 60 * ((i + 3) / 9))),
  );
  return {
    id: it.sku,
    name: it.nombre,
    size: it.categoria,
    emoji: emojiForProduct(it.nombre),
    risk: it.riesgoAgotamiento,
    stock: it.unidadesSolicitadas, // demanda real
    daysLeft: 0,
    dailyConsumption: it.consumoPromedioSemanal,
    trend,
    unidades: it.unidadesSolicitadas,
    lineasPendientes: it.lineasPendientes,
    lineasEntregadas: it.lineasEntregadas,
  };
}

function Inventory() {
  const [selected, setSelected] = useState<RealProduct | null>(null);
  const inventoryQ = useQuery({ queryKey: ["inventory"], queryFn: api.inventory });
  const products = (inventoryQ.data ?? []).map(toProduct);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">Inventario predictivo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Demanda real por producto (tabla orders) y su estado de entrega.
        </p>
      </div>

      {inventoryQ.isLoading && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          Cargando inventario…
        </div>
      )}
      {inventoryQ.isError && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive shadow-soft">
          No se pudo cargar el inventario. ¿Está corriendo el backend en :4000?
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            className={cn(
              "group rounded-3xl border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card",
              selected?.id === p.id ? "border-primary" : "border-border",
            )}
          >
            <div className="flex items-start justify-between">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand-soft text-2xl">
                {p.emoji}
              </span>
              <RiskBadge risk={p.risk} />
            </div>
            <p className="mt-4 text-lg font-bold text-foreground">
              {p.name} <span className="text-muted-foreground">· {p.size}</span>
            </p>
            <div className="mt-4">
              <Sparkline
                data={p.trend}
                stroke={p.risk === "alto" ? "var(--color-destructive)" : "var(--color-guindo)"}
                fill={p.risk === "alto" ? "var(--color-destructive)" : "var(--color-guindo)"}
                height={44}
              />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div>
                <p className="text-xs text-muted-foreground">Demanda total</p>
                <p className="text-sm font-bold text-foreground">{p.unidades.toLocaleString()} u</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Pendientes</p>
                <p className={cn("text-sm font-bold", p.risk === "alto" ? "text-destructive" : "text-foreground")}>
                  {p.lineasPendientes.toLocaleString()} líneas
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Panel lateral */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="absolute right-0 top-0 flex h-full w-[min(440px,100vw)] flex-col overflow-y-auto bg-card shadow-card animate-slide-in-right">
            <div className="flex items-center justify-between bg-gradient-brand p-6 text-primary-foreground">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 text-2xl">{selected.emoji}</span>
                <div>
                  <p className="text-lg font-extrabold">{selected.name}</p>
                  <p className="text-sm text-primary-foreground/80">{selected.size}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Cerrar" className="rounded-xl p-2 hover:bg-white/15">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-3">
                <Metric icon={<Gauge className="h-4 w-4" />} label="Demanda total" value={`${selected.unidades.toLocaleString()} u`} />
                <Metric icon={<CalendarClock className="h-4 w-4" />} label="Demanda semanal" value={`${selected.dailyConsumption.toLocaleString()} u`} />
              </div>

              <div className="rounded-3xl border border-border bg-secondary/40 p-5">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Brain className="h-4 w-4 text-ai" /> Estado de entrega (real)
                </div>
                <Sparkline data={selected.trend} stroke="var(--color-primary)" fill="var(--color-primary)" height={56} />
                <p className="mt-3 text-sm text-muted-foreground">
                  De este producto, <strong className="text-foreground">{selected.lineasPendientes.toLocaleString()}</strong>{" "}
                  línea(s) siguen pendientes y{" "}
                  <strong className="text-foreground">{selected.lineasEntregadas.toLocaleString()}</strong> ya se entregaron.
                </p>
              </div>

              <div className="rounded-3xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
                <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
                  <Lightbulb className="h-4 w-4" /> Sugerido por Pythia
                </div>
                <p className="text-sm leading-relaxed text-ai-foreground/90">
                  {selected.risk === "alto"
                    ? "Alta proporción de líneas pendientes. Prioriza la entrega o prepara sustituciones para este producto."
                    : "La mayoría de las líneas de este producto ya fueron entregadas. Operación estable."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}</div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
