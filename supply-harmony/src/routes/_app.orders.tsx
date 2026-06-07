import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Sparkles, ArrowRight, X } from "lucide-react";
import { orderStages } from "@/lib/mock-data";
import { api, pct, type OrderSummary, type Recommendation } from "@/lib/api/client";
import { DonutRing } from "@/components/platform/charts";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/orders")({
  component: Orders,
});

/** Etapa del pipeline (0..4) derivada del nivel de riesgo del pedido. */
function stageFromOrder(o: OrderSummary): number {
  if (o.lineasEnRiesgo === 0) return 4; // sin riesgo → aprobado
  if (o.riskBand === "alto") return 3; // sugerencia lista, esperando aprobación
  if (o.riskBand === "medio") return 2;
  return 1;
}

function shortId(id: string): string {
  // Los ids vienen como notación científica; mostramos un sufijo legible.
  return `#${id.replace(/[^0-9]/g, "").slice(-5) || id.slice(0, 6)}`;
}

function Orders() {
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: () => api.orders() });
  const list = ordersQ.data ?? [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">Gestión de pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipeline desde el pedido hasta la aprobación, con propensión de aceptación calculada por Pythia.
        </p>
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

      <div className="space-y-5">
        {list.slice(0, 12).map((o) => (
          <OrderCard key={o.idPedido} order={o} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderSummary }) {
  const stage = stageFromOrder(order);
  const hasRisk = order.lineasEnRiesgo > 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-foreground">
            {shortId(order.idPedido)}{" "}
            <span className="font-medium text-muted-foreground">· Cliente {shortId(order.customerId)}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Total ${order.total.toLocaleString("es-MX", { maximumFractionDigits: 2 })}
          </p>
        </div>
        {!hasRisk ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1 text-xs font-bold text-success">
            <Check className="h-3.5 w-3.5" /> Sin riesgo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-soft px-3 py-1 text-xs font-bold text-ai">
            <Sparkles className="h-3.5 w-3.5" /> {order.lineasEnRiesgo} línea(s) en riesgo {order.riskBand}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="mt-6 flex items-center">
        {orderStages.map((s, i) => {
          const done = i <= stage;
          const current = i === stage && stage < 4;
          return (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full text-xs font-bold transition-colors",
                    done ? "bg-gradient-brand text-primary-foreground shadow-brand" : "bg-secondary text-muted-foreground",
                    current && "ring-4 ring-primary/20",
                  )}
                >
                  {done && !current ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn("text-[11px] font-semibold", done ? "text-foreground" : "text-muted-foreground")}>
                  {s}
                </span>
              </div>
              {i < orderStages.length - 1 && (
                <div className={cn("mx-1 mb-5 h-1 flex-1 rounded-full", i < stage ? "bg-gradient-brand" : "bg-secondary")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Sustitución (carga la recomendación real solo si hay riesgo) */}
      {hasRisk && <SubstitutionPanel idPedido={order.idPedido} />}
    </div>
  );
}

function SubstitutionPanel({ idPedido }: { idPedido: string }) {
  const qc = useQueryClient();
  const recQ = useQuery({
    queryKey: ["recommendations", idPedido],
    queryFn: () => api.recommendations(idPedido),
  });

  const rec: Recommendation | undefined = recQ.data?.[0];

  const approve = useMutation({
    mutationFn: () =>
      api.approve(idPedido, rec!.idLinea, rec!.skuRecomendado, rec!.nombreRecomendado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["recommendations", idPedido] });
    },
  });
  const reject = useMutation({
    mutationFn: () => api.reject(idPedido, rec!.idLinea),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations", idPedido] }),
  });

  if (recQ.isLoading) {
    return (
      <div className="mt-6 rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
        Pythia está calculando la mejor sustitución…
      </div>
    );
  }
  if (!rec) {
    return (
      <div className="mt-6 rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">
        Sin sustitución sugerida para este pedido.
      </div>
    );
  }

  const acceptance = pct(rec.probabilidadAceptacion);

  return (
    <div className="mt-6 space-y-4">
      <div className="grid items-center gap-4 rounded-2xl bg-secondary/50 p-4 sm:grid-cols-[1fr_auto_1fr_auto]">
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

      {rec.explicacion && (
        <p className="px-1 text-xs text-muted-foreground">{rec.explicacion}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => approve.mutate()}
          disabled={approve.isPending || approve.isSuccess}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {approve.isSuccess ? "Sustitución aprobada" : "Aprobar sustitución"}
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
