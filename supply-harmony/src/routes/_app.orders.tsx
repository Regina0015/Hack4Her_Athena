import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Sparkles, ArrowRight, X, AlertTriangle, Clock, PackageCheck, ChevronDown } from "lucide-react";
import { api, pct, type OrderSummary, type Recommendation } from "@/lib/api/client";
import { DonutRing } from "@/components/platform/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/orders")({
  component: Orders,
});

type OrderState = "pendiente" | "entregado" | "rechazado";

/** Estado REAL del pedido según el Status de sus líneas (viene de la base de datos). */
function classifyOrder(o: OrderSummary): OrderState {
  return o.estado;
}

const STATE_META: Record<
  OrderState,
  { label: string; hint: string; icon: typeof AlertTriangle; classes: string }
> = {
  pendiente: {
    label: "Pedidos pendientes",
    hint: "Aún sin ningún producto entregado",
    icon: Clock,
    classes: "bg-warning/12 text-warning",
  },
  entregado: {
    label: "Pedidos entregados",
    hint: "Con al menos un producto entregado (total o parcial)",
    icon: PackageCheck,
    classes: "bg-success/12 text-success",
  },
  rechazado: {
    label: "Pedidos con rechazo",
    hint: "Sin entregas y con productos rechazados",
    icon: AlertTriangle,
    classes: "bg-destructive/12 text-destructive",
  },
};

function shortId(id: string): string {
  return `#${id.replace(/[^0-9]/g, "").slice(-5) || id.slice(0, 6)}`;
}

function Orders() {
  // Resumen superior: conteo por estado sobre TODA la colección (no solo la
  // muestra visible), para que coincida con el universo real del dashboard.
  const statsQ = useQuery({ queryKey: ["orders", "stats"], queryFn: api.orderStats });
  // Lista de tarjetas: muestra paginada (100 pedidos) priorizando pendientes.
  const ordersQ = useQuery({ queryKey: ["orders", 100], queryFn: () => api.orders({ limit: 100 }) });
  const list = ordersQ.data ?? [];

  // Contadores por estado para el resumen superior (universo completo, backend).
  const counts: Record<OrderState, number> = {
    pendiente: statsQ.data?.pendiente ?? 0,
    entregado: statsQ.data?.entregado ?? 0,
    rechazado: statsQ.data?.rechazado ?? 0,
  };

  // Prioriza pendientes (los que requieren acción) primero en la lista.
  const orderPriority: Record<OrderState, number> = { pendiente: 0, rechazado: 1, entregado: 2 };
  const sorted = [...list].sort((a, b) => orderPriority[classifyOrder(a)] - orderPriority[classifyOrder(b)]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">Gestión de pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conteo por <strong>pedido</strong> (no por producto): cada pedido se cuenta una vez según el estado de sus líneas.
          {statsQ.data ? ` Total: ${statsQ.data.total.toLocaleString("es-MX")} pedidos.` : ""}
        </p>
      </div>

      {/* Resumen por estado */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {(["pendiente", "entregado", "rechazado"] as OrderState[]).map((s) => {
          const meta = STATE_META[s];
          const Icon = meta.icon;
          return (
            <div key={s} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <span className={cn("grid h-10 w-10 place-items-center rounded-2xl", meta.classes)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-extrabold leading-none text-foreground">
                    {statsQ.isLoading ? "…" : counts[s].toLocaleString("es-MX")}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{meta.label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground/70">{meta.hint}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {ordersQ.isLoading && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          Cargando pedidos…
        </div>
      )}
      {ordersQ.isError && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive shadow-soft">
          No se pudo cargar pedidos. ¿Está corriendo el backend en :4000?
        </div>
      )}
      {!ordersQ.isLoading && !ordersQ.isError && list.length === 0 && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
          No hay pedidos para mostrar.
        </div>
      )}

      <div className="space-y-4">
        {sorted.slice(0, 30).map((o) => (
          <OrderCard key={o.idPedido} order={o} />
        ))}
        {sorted.length > 30 && (
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Mostrando 30 de {sorted.length} pedidos · pendientes primero
          </p>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const state = classifyOrder(order);
  const meta = STATE_META[state];
  const StateIcon = meta.icon;
  // Pythia sugiere sustituciones para pedidos pendientes (productos por entregar).
  const necesitaAccion = state === "pendiente" && order.lineasRegistradas > 0;

  // El panel de sugerencia se carga solo cuando el usuario lo abre.
  const [showSuggestion, setShowSuggestion] = useState(false);

  return (
    <div
      className={cn(
        "rounded-3xl border bg-card p-5 shadow-soft lg:p-6",
        state === "rechazado" ? "border-destructive/30" : "border-border",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-foreground">
            {shortId(order.idPedido)}{" "}
            <span className="font-medium text-muted-foreground">· Cliente {shortId(order.customerId)}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Total ${order.total.toLocaleString("es-MX", { maximumFractionDigits: 2 })} · {order.totalLineas} productos
            {order.lineasRegistradas > 0 && ` · ${order.lineasRegistradas} pendiente(s)`}
            {order.lineasEntregadas > 0 && ` · ${order.lineasEntregadas} entregado(s)`}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", meta.classes)}>
          <StateIcon className="h-3.5 w-3.5" /> {meta.label}
        </span>
      </div>

      {/* Botón de sugerencia de Pythia (para pedidos pendientes) */}
      {necesitaAccion && (
        <div className="mt-5">
          <button
            onClick={() => setShowSuggestion((v) => !v)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-ai px-4 py-2.5 text-sm font-bold text-ai-foreground shadow-ai transition-transform active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            {showSuggestion ? "Ocultar sugerencia" : "Ver sugerencia de Pythia"}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showSuggestion && "rotate-180")} />
          </button>

          {showSuggestion && <SubstitutionPanel idPedido={order.idPedido} />}
        </div>
      )}
    </div>
  );
}

function SubstitutionPanel({ idPedido }: { idPedido: string }) {
  const qc = useQueryClient();
  const recQ = useQuery({
    queryKey: ["recommendations", idPedido],
    queryFn: () => api.recommendations(idPedido),
  });

  // Primera recomendación con un sustituto real sugerido.
  const rec: Recommendation | undefined =
    recQ.data?.find((r) => r.skuRecomendado) ?? recQ.data?.[0];

  const approve = useMutation({
    mutationFn: () =>
      api.approve(idPedido, rec!.idLinea, rec!.skuRecomendado, rec!.nombreRecomendado),
    onSuccess: () => {
      toast.success("Sustitución aprobada", {
        description: rec ? `${rec.nombreSolicitado} → ${rec.nombreRecomendado}` : undefined,
      });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["recommendations", idPedido] });
    },
    onError: (e: Error) => toast.error("No se pudo aprobar", { description: e.message }),
  });
  const reject = useMutation({
    mutationFn: () => api.reject(idPedido, rec!.idLinea),
    onSuccess: () => {
      toast.success("Sustitución rechazada");
      qc.invalidateQueries({ queryKey: ["recommendations", idPedido] });
    },
    onError: (e: Error) => toast.error("No se pudo rechazar", { description: e.message }),
  });

  if (recQ.isLoading) {
    return (
      <div className="mt-4 rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
        Pythia está calculando la mejor sustitución…
      </div>
    );
  }
  if (recQ.isError) {
    return (
      <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        No se pudo obtener la sugerencia de Pythia.
      </div>
    );
  }
  if (!rec || !rec.skuRecomendado) {
    return (
      <div className="mt-4 rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
        Pythia aún no tiene un sustituto histórico para este pedido.
      </div>
    );
  }

  const acceptance = pct(rec.probabilidadAceptacion);

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-ai/20 bg-ai-soft/40 p-4">
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr_auto]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitado</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{rec.nombreSolicitado}</p>
        </div>
        <ArrowRight className="hidden h-5 w-5 text-primary sm:block" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ai">
            Sugerido por Pythia {rec.fuente === "gemini" ? "· IA" : ""}
          </p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{rec.nombreRecomendado}</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          <DonutRing value={acceptance} size={64} stroke={7} color="var(--color-ai)">
            <span className="text-sm font-extrabold text-ai">{acceptance}%</span>
          </DonutRing>
        </div>
      </div>

      {rec.explicacion && <p className="px-1 text-xs text-muted-foreground">{rec.explicacion}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => approve.mutate()}
          disabled={approve.isPending || approve.isSuccess}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {approve.isSuccess ? "Sustitución aprobada" : "Aprobar sugerencia"}
        </button>
        <button
          onClick={() => reject.mutate()}
          disabled={reject.isPending || approve.isSuccess}
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <X className="h-4 w-4 text-muted-foreground" /> Rechazar
        </button>
      </div>
    </div>
  );
}
