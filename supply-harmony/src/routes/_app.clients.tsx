import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, TrendingUp, Tag, Package } from "lucide-react";
import { api, pct, emojiForProduct, type CustomerProfile } from "@/lib/api/client";
import { DonutRing, Sparkline } from "@/components/platform/charts";
import { cn } from "@/lib/utils";
import pythiaAvatar from "@/assets/pythia-avatar.png";

export const Route = createFileRoute("/_app/clients")({
  component: Clients,
});

function shortId(id: string): string {
  return id.replace(/[^0-9]/g, "").slice(-6) || id.slice(0, 6);
}

/** Deriva chips de preferencias desde el perfil real. */
function buildPreferences(p: CustomerProfile): string[] {
  const prefs = p.preferencias
    .filter((x) => x.nombreSustituto)
    .slice(0, 4)
    .map((x) => x.nombreSustituto);
  const top = p.productosMasSolicitados.slice(0, 4).map((x) => x.nombre);
  const set = [...new Set([...prefs, ...top])];
  return set.length ? set.slice(0, 6) : ["Sin preferencias registradas aún"];
}

/** Insights legibles derivados de las métricas reales. */
function buildInsights(p: CustomerProfile): string[] {
  const out: string[] = [];
  out.push(
    `Ha solicitado ${p.totalLineas} producto(s) (${p.totalUnidades.toLocaleString("es-MX")} unidades) en ${p.totalPedidos} pedido(s).`,
  );
  if (p.totalSustituciones > 0) {
    out.push(
      `Acepta ${pct(p.tasaAceptacionGlobal)}% de las sustituciones sugeridas (${p.totalSustituciones} en total).`,
    );
  } else {
    out.push("Aún no tiene sustituciones registradas; Pythia aprenderá con cada pedido.");
  }
  if (p.productosMasSolicitados[0]) {
    out.push(`Su producto más solicitado es ${p.productosMasSolicitados[0].nombre}.`);
  }
  return out;
}

function Clients() {
  // La lista de clientes se deriva de los customerIds reales de los pedidos.
  const ordersQ = useQuery({ queryKey: ["orders", 100], queryFn: () => api.orders({ limit: 100 }) });
  const customerIds = [...new Set((ordersQ.data ?? []).map((o) => o.customerId))].slice(0, 15);

  const [activeId, setActiveId] = useState<string | null>(null);

  // Selecciona el primero por defecto cuando llegan los datos.
  useEffect(() => {
    if (!activeId && customerIds.length > 0) setActiveId(customerIds[0]);
  }, [activeId, customerIds]);

  const profileQ = useQuery({
    queryKey: ["customer", activeId],
    queryFn: () => api.customerProfile(activeId!),
    enabled: !!activeId,
  });
  const profile = profileQ.data;
  const score = profile ? pct(profile.tasaAceptacionGlobal) : 0;
  const preferences = profile ? buildPreferences(profile) : [];
  const insights = profile ? buildInsights(profile) : [];
  // Historial visual derivado del score (no hay serie temporal en el backend).
  const history = profile
    ? Array.from({ length: 7 }, (_, i) => Math.max(0, Math.round(score - (6 - i) * 3)))
    : [];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">Perfil inteligente del cliente</h1>
        <p className="mt-1 text-sm text-muted-foreground">Comportamiento y preferencias detectadas por Pythia.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Lista / selector de clientes */}
        <div className="space-y-3">
          {ordersQ.isLoading && (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft">
              Cargando clientes…
            </div>
          )}
          {customerIds.map((id) => (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-soft transition-all",
                activeId === id ? "border-primary" : "border-border hover:shadow-card",
              )}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-sm font-bold text-primary-foreground">
                {shortId(id).slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">Cliente {shortId(id)}</p>
                <p className="truncate text-xs text-muted-foreground">Tiendita · Arca</p>
              </div>
            </button>
          ))}
        </div>

        {/* Detalle */}
        <div className="space-y-6">
          {profileQ.isLoading && (
            <div className="rounded-3xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">
              Cargando perfil…
            </div>
          )}

          {profile && (
            <>
              <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
                <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <DonutRing value={score} size={120} stroke={11} color="var(--color-ai)">
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-ai">{score}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Score</p>
                    </div>
                  </DonutRing>
                  <p className="mt-3 text-sm font-bold text-foreground">Aceptación de sustituciones</p>
                </div>

                <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                    <TrendingUp className="h-4 w-4 text-primary" /> Resumen del cliente
                  </div>
                  <Sparkline data={history} height={90} />
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xl font-extrabold text-foreground">{profile.totalPedidos}</p>
                      <p className="text-[11px] text-muted-foreground">Pedidos</p>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-foreground">{profile.totalLineas}</p>
                      <p className="text-[11px] text-muted-foreground">Productos</p>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-foreground">{profile.totalUnidades.toLocaleString("es-MX")}</p>
                      <p className="text-[11px] text-muted-foreground">Unidades</p>
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-foreground">{profile.totalSustituciones}</p>
                      <p className="text-[11px] text-muted-foreground">Sustituciones</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferencias */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Heart className="h-4 w-4 text-primary" /> Preferencias detectadas
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferences.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand-soft px-3.5 py-2 text-sm font-semibold text-foreground">
                      <Tag className="h-3.5 w-3.5 text-primary" /> {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Productos más solicitados (datos reales del historial) */}
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                  <Package className="h-4 w-4 text-primary" /> Productos más solicitados
                </div>
                {profile.productosMasSolicitados.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin productos registrados todavía.</p>
                ) : (
                  <div className="space-y-2.5">
                    {(() => {
                      const max = Math.max(...profile.productosMasSolicitados.map((p) => p.conteo), 1);
                      return profile.productosMasSolicitados.map((p) => (
                        <div key={p.sku} className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-brand-soft text-lg">
                            {emojiForProduct(p.nombre)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {p.nombre || `SKU ${p.sku.slice(0, 6)}`}
                              </p>
                              <span className="shrink-0 text-sm font-bold text-primary">
                                {p.conteo.toLocaleString("es-MX")} u
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full bg-gradient-brand"
                                style={{ width: `${(p.conteo / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Insights de Pythia */}
              <div className="rounded-3xl bg-gradient-ai p-6 text-ai-foreground shadow-ai">
                <div className="mb-4 flex items-center gap-3">
                  <img src={pythiaAvatar} alt="Pythia Bot" width={44} height={44} loading="lazy" className="h-11 w-11 drop-shadow" />
                  <div className="leading-tight">
                    <p className="text-sm font-bold">Insights de Pythia</p>
                    <p className="text-xs text-ai-foreground/80">Lectura humana del comportamiento</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {insights.map((ins) => (
                    <div key={ins} className="flex items-start gap-2.5 rounded-2xl bg-white/12 p-3.5 text-sm leading-relaxed backdrop-blur">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ai-foreground" />
                      {ins}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
