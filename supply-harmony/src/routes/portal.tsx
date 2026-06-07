import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Check,
  RefreshCw,
  Clock,
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Plug,
  Star,
  Brain,
  Plus,
  Gauge,
  Camera,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ViewSwitcher } from "@/components/platform/ViewSwitcher";
import { ChatWidget } from "@/components/ai/ChatWidget";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { api, type PortalProduct, type SurveyInput } from "@/lib/api/client";
import pythiaBot from "@/assets/pythia-bot.png";
import pythiaAvatar from "@/assets/pythia-avatar.png";

export const Route = createFileRoute("/portal")({
  component: Portal,
});

type Decision = null | "aceptado" | "otra" | "esperar";
type CaptureMethod = null | "pos" | "manual" | "scan";

function Portal() {
  const [decision, setDecision] = useState<Decision>(null);
  const [inventoryConnected, setInventoryConnected] = useState(false);
  const [captureMethod, setCaptureMethod] = useState<CaptureMethod>(null);
  const [orderDelivered, setOrderDelivered] = useState(false);
  const [surveyDone, setSurveyDone] = useState(false);

  // Cliente activo: lo derivamos del primer customerId real con pedidos.
  const ordersQ = useQuery({ queryKey: ["orders", 100], queryFn: () => api.orders({ limit: 100 }) });
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
            {pendingCount > 0 ? `Tienes ${pendingCount} producto(s) por validar` : "Tu pedido necesita validación"}
          </h1>
        </div>

        <Tabs defaultValue="pedido" className="mt-4">
          <TabsList
            className={cn(
              "grid h-auto w-full gap-1 rounded-2xl bg-muted p-1",
              inventoryConnected ? "grid-cols-4" : "grid-cols-2",
            )}
          >
            <TabsTrigger value="pedido" className="rounded-xl py-2 text-xs font-semibold">Pedido</TabsTrigger>
            <TabsTrigger value="inventario" className="rounded-xl py-2 text-xs font-semibold">Inventario</TabsTrigger>
            {inventoryConnected && (
              <>
                <TabsTrigger value="oportunidades" className="rounded-xl py-2 text-xs font-semibold">Crecer</TabsTrigger>
                <TabsTrigger value="encuesta" className="rounded-xl py-2 text-xs font-semibold">Encuesta</TabsTrigger>
              </>
            )}
          </TabsList>

          {/* ===== Pedido (conectado al backend) ===== */}
          <TabsContent value="pedido" className="mt-4">
            {/* Notificación */}
            <div className="flex items-center gap-3 rounded-3xl bg-gradient-brand p-4 text-primary-foreground shadow-brand">
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
                        “¡Hola! Noté que no alcanzamos {realName} para tu pedido, pero como sé que a tus clientes les
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
                    onClick={() => {
                      setDecision("aceptado");
                      setOrderDelivered(true);
                    }}
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

                <p className="mt-6 text-center text-xs text-muted-foreground">Tú conservas el control de la decisión.</p>
              </>
            ) : (
              <Confirmation decision={decision} realName={realName} onReset={() => setDecision(null)} />
            )}
          </TabsContent>

          {/* ===== Inventario Conectado ===== */}
          <TabsContent value="inventario" className="mt-4">
            {inventoryConnected ? (
              <InventoryPanel customerId={customerId} />
            ) : captureMethod === null ? (
              <InventoryMethodChooser onSelect={setCaptureMethod} />
            ) : captureMethod === "pos" ? (
              <ConnectInventory onConnect={() => setInventoryConnected(true)} onBack={() => setCaptureMethod(null)} />
            ) : captureMethod === "manual" ? (
              <ManualCapture onSave={() => setInventoryConnected(true)} onBack={() => setCaptureMethod(null)} />
            ) : (
              <ScanNotebook onSave={() => setInventoryConnected(true)} onBack={() => setCaptureMethod(null)} />
            )}
          </TabsContent>

          {/* ===== Oportunidades de crecimiento ===== */}
          {inventoryConnected && (
            <TabsContent value="oportunidades" className="mt-4">
              <GrowthPanel customerId={customerId} />
            </TabsContent>
          )}

          {/* ===== Encuesta de satisfacción ===== */}
          {inventoryConnected && (
            <TabsContent value="encuesta" className="mt-4">
              {orderDelivered && !surveyDone ? (
                <SurveyPanel customerId={customerId} onDone={() => setSurveyDone(true)} />
              ) : (
                <SurveyEmpty done={surveyDone} />
              )}
              <ContinuousLearningCard />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Asistente Pythia en modo cliente (conectado al backend) */}
      <ChatWidget mode="cliente" />
    </div>
  );
}

function Confirmation({
  decision,
  realName,
  onReset,
}: {
  decision: Exclude<Decision, null>;
  realName: string;
  onReset: () => void;
}) {
  const map = {
    aceptado: { icon: Check, color: "bg-success/12 text-success", title: "¡Sustitución aceptada!", text: "Tu pedido sale con Sprite 600 ml. Llega hoy mismo." },
    otra: { icon: RefreshCw, color: "bg-ai-soft text-ai", title: "Veamos otras opciones", text: "Pythia te mostrará alternativas compatibles con tus preferencias." },
    esperar: { icon: Clock, color: "bg-warning/12 text-warning", title: "Reposición programada", text: `Pythia te avisará en cuanto ${realName} esté disponible.` },
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

/* ============ Inventario Conectado (datos reales del cliente) ============ */

function ConnectInventory({ onConnect, onBack }: { onConnect: () => void; onBack?: () => void }) {
  const benefits = [
    { icon: AlertTriangle, label: "Alertas de agotamiento" },
    { icon: RefreshCw, label: "Reposición inteligente" },
    { icon: Sparkles, label: "Recomendaciones personalizadas" },
    { icon: TrendingUp, label: "Oportunidades de crecimiento" },
  ];
  return (
    <div className="space-y-4">
      {onBack && <BackToMethods onBack={onBack} />}
      <div className="overflow-hidden rounded-3xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Plug className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Inventario Conectado</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ai-foreground/95">
              Conecta tu sistema de ventas para recibir recomendaciones más precisas y oportunidades de crecimiento personalizadas.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm font-bold text-foreground">Beneficios</p>
        <ul className="mt-3 space-y-3">
          {benefits.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-ai-soft text-ai">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onConnect}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-base font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98]"
      >
        <Plug className="h-5 w-5" /> Conectar sistema
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Opcional. Puedes seguir usando Pythia sin conectar tu inventario.
      </p>
    </div>
  );
}

function InventoryPanel({ customerId }: { customerId: string | null }) {
  const invQ = useQuery({
    queryKey: ["portal", "inventory", customerId],
    queryFn: () => api.portalInventory(customerId!),
    enabled: !!customerId,
  });

  if (invQ.isLoading) return <PanelLoading text="Analizando tu inventario…" />;
  if (invQ.isError || !invQ.data)
    return <PanelError text="No se pudo cargar tu inventario." />;

  const inv = invQ.data;
  const fmt = (n: number) => n.toLocaleString("es-MX");

  return (
    <div className="space-y-4">
      <AdaptabilityCard />
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-ai" />
          <p className="text-sm font-bold text-foreground">Inventario actual</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="SKUs" value={fmt(inv.totalSkus)} />
          <Stat label="Unidades" value={fmt(inv.totalUnidades)} />
          <Stat label="Por agotarse" value={fmt(inv.porAgotarse)} tone="warning" />
        </div>
      </div>

      <ProductList title="Mayor rotación" icon={TrendingUp} items={inv.mayorRotacion} unitLabel="uds. solicitadas" tone="success" />
      <ProductList title="Menor rotación" icon={TrendingDown} items={inv.menorRotacion} unitLabel="uds. solicitadas" tone="muted" />
      <ProductList title="Próximos a agotarse" icon={AlertTriangle} items={inv.proximosAgotarse} unitLabel="pendientes" tone="warning" valueKey="pendientes" />

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ai" />
          <p className="text-sm font-bold text-foreground">Tendencia de demanda</p>
        </div>
        <Sparkline points={inv.tendencia} />
        <p className="mt-2 text-xs text-muted-foreground">Demanda reciente derivada de tus pedidos.</p>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-3">
      <p className={cn("text-xl font-extrabold", tone === "warning" ? "text-warning" : "text-foreground")}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function ProductList({
  title,
  icon: Icon,
  items,
  unitLabel,
  tone,
  valueKey = "unidades",
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: PortalProduct[];
  unitLabel: string;
  tone: "success" | "warning" | "muted";
  valueKey?: "unidades" | "pendientes";
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-muted-foreground";
  if (items.length === 0) return null;
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", toneClass)} />
        <p className="text-sm font-bold text-foreground">{title}</p>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((p) => (
          <li key={p.sku} className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/60 px-3 py-2.5">
            <span className="min-w-0 truncate text-sm font-semibold text-foreground">{p.nombre}</span>
            <span className={cn("shrink-0 text-xs font-bold", toneClass)}>
              {p[valueKey].toLocaleString("es-MX")} {unitLabel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const max = Math.max(...points, 1);
  return (
    <div className="mt-3 flex h-20 items-end gap-1.5">
      {points.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-gradient-brand" style={{ height: `${(v / max) * 100}%` }} aria-hidden />
      ))}
    </div>
  );
}

/* ============ Oportunidades de Crecimiento (datos reales) ============ */

function GrowthPanel({ customerId }: { customerId: string | null }) {
  const growthQ = useQuery({
    queryKey: ["portal", "growth", customerId],
    queryFn: () => api.portalGrowth(customerId!),
    enabled: !!customerId,
  });

  if (growthQ.isLoading) return <PanelLoading text="Buscando oportunidades…" />;
  if (growthQ.isError || !growthQ.data) return <PanelError text="No se pudieron cargar las oportunidades." />;

  const { score, oportunidades } = growthQ.data;

  return (
    <div className="space-y-4">
      <GrowthScoreCard score={score} />

      <div className="space-y-3">
        {oportunidades.length === 0 && (
          <div className="rounded-3xl border border-border bg-card p-5 text-center text-sm text-muted-foreground shadow-soft">
            Tu catálogo ya cubre los productos de mayor demanda. ¡Buen trabajo!
          </div>
        )}
        {oportunidades.map((r) => (
          <div key={r.sku} className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-ai-soft text-ai">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">Impacto: {r.impact}</Badge>
              <Badge variant="outline" className="rounded-full">Confianza: {r.confidence}%</Badge>
            </div>
            <button
              onClick={() => toast.success("Producto agregado", { description: `${r.nombre} se incluirá en tu próximo pedido.` })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Agregar al próximo pedido
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Basado en la demanda real agregada de la red de clientes.
      </p>
    </div>
  );
}

function GrowthScoreCard({ score }: { score: number }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-brand">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4" />
        <p className="text-sm font-bold">Potencial de Crecimiento</p>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <p className="text-5xl font-extrabold leading-none">{score}</p>
        <p className="pb-1 text-sm font-semibold text-primary-foreground/80">/ 100</p>
      </div>
      <Progress value={score} className="mt-4 h-2 bg-white/20" />
      <ul className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold text-primary-foreground/90">
        <li>• Rotación</li>
        <li>• Diversidad de catálogo</li>
        <li>• Tendencias locales</li>
        <li>• Oportunidades detectadas</li>
      </ul>
    </div>
  );
}

/* ============ Encuesta de Satisfacción (se guarda en el backend) ============ */

function SurveyPanel({ customerId, onDone }: { customerId: string | null; onDone: () => void }) {
  const [received, setReceived] = useState<boolean | null>(null);
  const [substitution, setSubstitution] = useState<boolean | null>(null);
  const [onTime, setOnTime] = useState<boolean | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");

  const save = useMutation({
    mutationFn: (input: SurveyInput) => api.saveSurvey(customerId!, input),
    onSuccess: () => {
      toast.success("¡Gracias por tu opinión!", { description: "Pythia ya está aprendiendo de tu respuesta." });
      onDone();
    },
    onError: (e: Error) => toast.error("No se pudo enviar", { description: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
        <div className="flex items-start gap-3">
          <img src={pythiaBot} alt="" width={48} height={48} className="h-12 w-12 shrink-0 drop-shadow" />
          <div>
            <p className="text-sm font-bold">¿Cómo nos fue?</p>
            <p className="mt-1 text-sm text-ai-foreground/95">Tu opinión ayuda a Pythia a mejorar tus próximas recomendaciones.</p>
          </div>
        </div>
      </div>

      <YesNoQuestion label="¿Recibiste tu pedido completo?" value={received} onChange={setReceived} />
      <YesNoQuestion label="¿La sustitución sugerida fue adecuada?" value={substitution} onChange={setSubstitution} />
      <YesNoQuestion label="¿La entrega llegó a tiempo?" value={onTime} onChange={setOnTime} />

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm font-bold text-foreground">Calificación general</p>
        <div className="mt-3 flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setStars(n)} className="p-1 transition-transform active:scale-90" aria-label={`${n} estrellas`}>
              <Star className={cn("h-8 w-8", n <= stars ? "fill-warning text-warning" : "text-muted-foreground/40")} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentarios (opcional)" className="mt-4 rounded-2xl" />
      </div>

      <button
        onClick={() =>
          save.mutate({
            pedidoCompleto: received,
            sustitucionAdecuada: substitution,
            entregaATiempo: onTime,
            estrellas: stars,
            comentario: comment,
          })
        }
        disabled={save.isPending || !customerId}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-base font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {save.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} Enviar respuestas
      </button>
    </div>
  );
}

function YesNoQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange(true)}
          className={cn(
            "rounded-2xl border py-2.5 text-sm font-bold transition-colors",
            value === true ? "border-transparent bg-success/15 text-success" : "border-border bg-secondary/60 text-foreground hover:bg-muted",
          )}
        >
          Sí
        </button>
        <button
          onClick={() => onChange(false)}
          className={cn(
            "rounded-2xl border py-2.5 text-sm font-bold transition-colors",
            value === false ? "border-transparent bg-destructive/15 text-destructive" : "border-border bg-secondary/60 text-foreground hover:bg-muted",
          )}
        >
          No
        </button>
      </div>
    </div>
  );
}

function SurveyEmpty({ done }: { done: boolean }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-ai-soft text-ai">
        <Star className="h-7 w-7" />
      </span>
      <p className="mt-3 text-sm font-bold text-foreground">
        {done ? "¡Gracias por tu opinión!" : "Sin pedidos pendientes por evaluar"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {done ? "Pythia ya está aprendiendo de tu respuesta." : "Te enviaremos una encuesta cuando se entregue tu próximo pedido."}
      </p>
    </div>
  );
}

function ContinuousLearningCard() {
  return (
    <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ai-soft text-ai">
          <Brain className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Aprendizaje continuo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pythia aprende continuamente de tus decisiones y comentarios para mejorar futuras recomendaciones.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ Estados compartidos ============ */

function PanelLoading({ text }: { text: string }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
      <Loader2 className="h-8 w-8 animate-spin text-ai" />
      <p className="mt-3 text-sm font-bold text-foreground">{text}</p>
    </div>
  );
}

function PanelError({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive shadow-soft">
      {text} ¿Está corriendo el backend?
    </div>
  );
}

/* ============ Métodos de Captura de Inventario ============ */

function BackToMethods({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Cambiar método
    </button>
  );
}

function InventoryMethodChooser({ onSelect }: { onSelect: (m: Exclude<CaptureMethod, null>) => void }) {
  const methods: {
    id: Exclude<CaptureMethod, null>;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    action: string;
  }[] = [
    {
      id: "pos",
      icon: Plug,
      title: "Conectar Punto de Venta",
      description: "Sincroniza automáticamente tus ventas e inventario en tiempo real.",
      action: "Conectar sistema POS",
    },
    {
      id: "manual",
      icon: Pencil,
      title: "Captura Manual",
      description: "Actualiza tu inventario manualmente cuando lo necesites.",
      action: "Registrar existencias manualmente",
    },
    {
      id: "scan",
      icon: Camera,
      title: "Escanear Libreta con Pythia",
      description: "Toma una fotografía de tu libreta o registro de ventas y Pythia convertirá la información en inventario digital.",
      action: "Tomar fotografía",
    },
  ];
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
        <p className="text-sm font-bold">¿Cómo deseas compartir tu inventario?</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ai-foreground/95">
          Elige el método que mejor se adapte a tu forma de trabajar. Puedes cambiarlo cuando quieras.
        </p>
      </div>

      <div className="space-y-3">
        {methods.map(({ id, icon: Icon, title, description, action }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="group w-full rounded-3xl border border-border bg-card p-5 text-left shadow-soft transition-colors hover:bg-secondary/40"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ai-soft text-ai">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                <p className="mt-3 flex items-center gap-1 text-xs font-bold text-ai">
                  {action}
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <AdaptabilityCard />
    </div>
  );
}

function AdaptabilityCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-ai-soft text-ai">
          <Brain className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Pythia se adapta a tu forma de trabajar</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ya sea que utilices un sistema de ventas, registres información manualmente o lleves tus cuentas en libreta, podemos ayudarte a tomar mejores decisiones para tu negocio.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---- Captura Manual ---- */

type ManualItem = { id: number; name: string; units: string };

function ManualCapture({ onSave, onBack }: { onSave: () => void; onBack: () => void }) {
  const [items, setItems] = useState<ManualItem[]>([
    { id: 1, name: "Coca-Cola 600 ml", units: "24" },
    { id: 2, name: "", units: "" },
  ]);

  const update = (id: number, patch: Partial<ManualItem>) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: number) => setItems((arr) => arr.filter((i) => i.id !== id));
  const add = () => setItems((arr) => [...arr, { id: Date.now(), name: "", units: "" }]);

  const canSave = items.some((i) => i.name.trim() && i.units.trim());

  return (
    <div className="space-y-4">
      <BackToMethods onBack={onBack} />

      <div className="overflow-hidden rounded-3xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Pencil className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Captura Manual</p>
            <p className="mt-1.5 text-sm text-ai-foreground/95">Registra las existencias actuales de tus productos.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2">
              <Input value={item.name} onChange={(e) => update(item.id, { name: e.target.value })} placeholder="Producto" className="rounded-2xl" />
              <button
                onClick={() => remove(item.id)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                aria-label="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                inputMode="numeric"
                value={item.units}
                onChange={(e) => update(item.id, { units: e.target.value })}
                placeholder="Existencias"
                className="rounded-2xl"
              />
              <span className="text-xs font-semibold text-muted-foreground">unidades</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-secondary/40 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
      >
        <Plus className="h-4 w-4" /> Agregar producto
      </button>

      <button
        onClick={onSave}
        disabled={!canSave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-base font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Check className="h-5 w-5" /> Guardar inventario
      </button>
    </div>
  );
}

/* ---- Escaneo Inteligente de Libreta ---- */

type ScanStep = "capture" | "analyzing" | "preview";
type ScanItem = { id: number; name: string; units: string; note: string };

function ScanNotebook({ onSave, onBack }: { onSave: () => void; onBack: () => void }) {
  const [step, setStep] = useState<ScanStep>("capture");
  const [items, setItems] = useState<ScanItem[]>([]);

  const startAnalysis = () => {
    setStep("analyzing");
    setTimeout(() => {
      setItems([
        { id: 1, name: "Coca-Cola 600 ml", units: "24", note: "Existencia alta" },
        { id: 2, name: "Sprite 600 ml", units: "12", note: "Existencia media" },
        { id: 3, name: "Fanta 600 ml", units: "8", note: "Próximo a agotarse" },
      ]);
      setStep("preview");
    }, 1600);
  };

  const update = (id: number, patch: Partial<ScanItem>) =>
    setItems((arr) => arr.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: number) => setItems((arr) => arr.filter((i) => i.id !== id));

  return (
    <div className="space-y-4">
      <BackToMethods onBack={onBack} />

      <div className="overflow-hidden rounded-3xl bg-gradient-ai p-5 text-ai-foreground shadow-ai">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/15">
            <Camera className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Escanear libreta con Pythia</p>
            <p className="mt-1.5 text-sm text-ai-foreground/95">
              Toma una fotografía de tu libreta y Pythia extraerá productos, cantidades y observaciones.
            </p>
          </div>
        </div>
      </div>

      {step === "capture" && (
        <>
          <div className="grid place-items-center rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center shadow-soft">
            <span className="grid h-16 w-16 place-items-center rounded-3xl bg-ai-soft text-ai">
              <Camera className="h-8 w-8" />
            </span>
            <p className="mt-3 text-sm font-bold text-foreground">Coloca tu libreta frente a la cámara</p>
            <p className="mt-1 text-xs text-muted-foreground">Asegúrate de que se vea clara y bien iluminada.</p>
          </div>
          <button
            onClick={startAnalysis}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-base font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" /> Tomar fotografía
          </button>
        </>
      )}

      {step === "analyzing" && (
        <div className="grid place-items-center rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
          <Loader2 className="h-10 w-10 animate-spin text-ai" />
          <p className="mt-3 text-sm font-bold text-foreground">Pythia está analizando tu libreta…</p>
          <p className="mt-1 text-xs text-muted-foreground">Identificando productos, cantidades y observaciones.</p>
        </div>
      )}

      {step === "preview" && (
        <>
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ai" />
              <p className="text-sm font-bold text-foreground">Vista previa editable</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Revisa lo que Pythia detectó y corrige si es necesario.</p>

            <div className="mt-4 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="rounded-2xl bg-secondary/60 p-3">
                  <div className="flex items-center gap-2">
                    <Input value={it.name} onChange={(e) => update(it.id, { name: e.target.value })} className="rounded-xl" />
                    <button
                      onClick={() => remove(it.id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input inputMode="numeric" value={it.units} onChange={(e) => update(it.id, { units: e.target.value })} placeholder="Unidades" className="rounded-xl" />
                    <Input value={it.note} onChange={(e) => update(it.id, { note: e.target.value })} placeholder="Observaciones" className="rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("capture")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
          >
            <Camera className="h-4 w-4" /> Volver a tomar fotografía
          </button>

          <button
            onClick={onSave}
            disabled={items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-4 text-base font-bold text-primary-foreground shadow-brand transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-5 w-5" /> Guardar inventario
          </button>
        </>
      )}
    </div>
  );
}
