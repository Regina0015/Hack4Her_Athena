// Cliente tipado para el backend de Pythia (Express + MongoDB).
// Todas las respuestas del backend vienen envueltas en { data, meta? }.
//
// Base URL:
//  - Define VITE_API_URL en .env para apuntar a otro host.
//  - Por defecto usa http://localhost:4000/api (funciona en SSR y navegador).
//    En el navegador, Vite también proxea /api -> backend (ver vite.config.ts).

const BASE_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ??
  "http://localhost:4000/api";

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(`API ${res.status} ${path}${detail ? ` — ${detail}` : ""}`);
  }
  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

/* ===================== Tipos del dominio (espejo de backend/src/dtos/domain.ts) ===================== */

export type RiskBand = "alto" | "medio" | "bajo";

export interface DashboardKpis {
  pedidosEnRiesgo: number;
  productosCriticos: number;
  sustitucionesPendientes: number;
  tasaAceptacionGlobal: number; // 0..1
  // KPIs reales basados en el Status de las líneas:
  totalPedidos: number;
  totalLineas: number;
  lineasPendientes: number;
  lineasEntregadas: number;
  lineasRechazadas: number;
  totalSustituciones: number;
}

export interface Alert {
  id: string;
  tipo: "stock_critico" | "pedido_alto_riesgo";
  severidad: RiskBand;
  mensaje: string;
  referencia: string;
}

export interface AffectedLine {
  idLinea: string;
  skuSolicitado: string;
  nombreSku: string;
  quantity: number;
  stockActual: number;
  riskScore: number;
  riskBand: RiskBand;
  substitutionStatus: "none" | "pending" | "approved" | "rejected";
  skuSustituto?: string | null;
  nombreSkuSustituto?: string | null;
}

export type OrderEstado = "pendiente" | "entregado" | "rechazado";

export interface OrderSummary {
  idPedido: string;
  customerId: string;
  pais: string;
  businessUnit: string;
  cedis: string;
  statusFinal: string;
  total: number;
  riskScore: number;
  riskBand: RiskBand;
  lineasEnRiesgo: number;
  // Datos reales del Status de las líneas:
  estado: OrderEstado;
  totalLineas: number;
  lineasRegistradas: number;
  lineasEntregadas: number;
  lineasRechazadas: number;
}

export interface OrderDetail extends OrderSummary {
  lineas: AffectedLine[];
}

/** Conteo de pedidos por estado sobre TODA la colección (no solo la página). */
export interface OrderStats {
  total: number;
  pendiente: number;
  entregado: number;
  rechazado: number;
}

export interface RecommendationAlternative {
  sku: string;
  nombre: string;
  probabilidadAceptacion: number;
}

export interface Recommendation {
  idLinea: string;
  skuSolicitado: string;
  nombreSolicitado: string;
  skuRecomendado: string;
  nombreRecomendado: string;
  probabilidadAceptacion: number; // 0..1
  explicacion: string;
  alternativas: RecommendationAlternative[];
  fuente: "gemini" | "heuristico";
}

export interface InventoryItem {
  sku: string;
  nombre: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  consumoPromedioSemanal: number;
  riesgoAgotamiento: RiskBand;
  semanasRestantes: number | null;
  demandaPredichaSemanal: number;
  unidadesSolicitadas: number;
  lineasPendientes: number;
  lineasEntregadas: number;
}

/** Predicción de reabasto de un producto para un cliente (Pythia anticipa). */
export interface ReabastoPrediccion {
  sku: string;
  nombre: string;
  consumoSemanal: number;
  unidadesPendientes: number;
  semanasParaReabasto: number;
  urgencia: RiskBand;
  confianza: number; // 0..1
}

export interface CustomerPrediction {
  customerId: string;
  productos: ReabastoPrediccion[];
  resumen: { productosUrgentes: number; proximoReabastoSemanas: number | null };
}

export interface CustomerProfile {
  customerId: string;
  totalPedidos: number;
  totalLineas: number;
  totalUnidades: number;
  tasaAceptacionGlobal: number;
  totalSustituciones: number;
  preferencias: {
    skuSolicitado: string;
    skuPreferidoSustituto: string;
    nombreSustituto: string;
    aceptaciones: number;
    rechazos: number;
    score: number;
  }[];
  productosMasSolicitados: { sku: string; nombre: string; conteo: number }[];
  historialPedidos: OrderSummary[];
  historialSustituciones: {
    idPedido: string;
    skuSolicitado: string;
    nombreSkuSolicitado: string;
    skuEntregado: string;
    nombreSkuEntregado: string;
    aceptado: boolean;
  }[];
}

export interface PendingSubstitution {
  idPedido: string;
  idLinea: string;
  skuSolicitado: string;
  nombreSku: string;
  skuSustituto: string | null;
  nombreSkuSustituto: string | null;
  quantity: number;
}

export interface ChatReply {
  reply: string;
  fuente: "gemini" | "fallback";
}

/* ---- Portal del cliente: inventario, crecimiento y encuesta ---- */

export interface PortalProduct {
  sku: string;
  nombre: string;
  unidades: number;
  pendientes: number;
  entregadas: number;
}

export interface PortalInventory {
  totalSkus: number;
  totalUnidades: number;
  porAgotarse: number;
  mayorRotacion: PortalProduct[];
  menorRotacion: PortalProduct[];
  proximosAgotarse: PortalProduct[];
  tendencia: number[];
}

export interface GrowthOpportunity {
  sku: string;
  nombre: string;
  text: string;
  impact: string;
  confidence: number;
}

export interface PortalGrowth {
  score: number;
  oportunidades: GrowthOpportunity[];
}

export interface SurveyInput {
  pedidoCompleto: boolean | null;
  sustitucionAdecuada: boolean | null;
  entregaATiempo: boolean | null;
  estrellas: number;
  comentario: string;
}

/* ===================== Funciones de API ===================== */

export const api = {
  // Dashboard
  dashboardKpis: () => get<DashboardKpis>("/dashboard/kpis"),
  dashboardAlerts: () => get<Alert[]>("/dashboard/alerts"),

  // Pedidos
  orders: (opts?: { risk?: RiskBand; limit?: number }) => {
    const params = new URLSearchParams();
    if (opts?.risk) params.set("risk", opts.risk);
    if (opts?.limit) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return get<OrderSummary[]>(`/orders${qs ? `?${qs}` : ""}`);
  },
  orderStats: () => get<OrderStats>("/orders/stats"),
  order: (idPedido: string) => get<OrderDetail>(`/orders/${idPedido}`),
  recommendations: (idPedido: string) =>
    get<Recommendation[]>(`/orders/${idPedido}/recommendations`),
  approve: (idPedido: string, idLinea: string, skuSustituto: string, nombreSustituto: string) =>
    post(`/orders/${idPedido}/substitutions/${idLinea}/approve`, { skuSustituto, nombreSustituto }),
  reject: (idPedido: string, idLinea: string) =>
    post(`/orders/${idPedido}/substitutions/${idLinea}/reject`),

  // Clientes
  customerProfile: (customerId: string) =>
    get<CustomerProfile>(`/customers/${encodeURIComponent(customerId)}/profile`),
  customerPrediction: (customerId: string) =>
    get<CustomerPrediction>(`/customers/${encodeURIComponent(customerId)}/prediction`),

  // Inventario
  inventory: () => get<InventoryItem[]>("/inventory"),
  criticalInventory: () => get<InventoryItem[]>("/inventory/critical"),

  // Portal del cliente
  pending: (customerId: string) =>
    get<PendingSubstitution[]>(`/portal/${encodeURIComponent(customerId)}/pending`),
  portalInventory: (customerId: string) =>
    get<PortalInventory>(`/portal/${encodeURIComponent(customerId)}/inventory`),
  portalGrowth: (customerId: string) =>
    get<PortalGrowth>(`/portal/${encodeURIComponent(customerId)}/growth`),
  saveSurvey: (customerId: string, survey: SurveyInput) =>
    post(`/portal/${encodeURIComponent(customerId)}/survey`, survey),
  savePreferences: (
    customerId: string,
    preferencias: { skuSolicitado: string; skuPreferidoSustituto: string; nombreSustituto?: string }[],
  ) => post(`/portal/${encodeURIComponent(customerId)}/preferences`, { preferencias }),

  // Chat Pythia (IA)
  chat: (message: string, mode: "admin" | "cliente" = "admin") =>
    post<ChatReply>("/chat", { message, mode }),
};

/* ===================== Helpers de presentación ===================== */

/** Mapea el riskBand del backend al tipo Risk de la UI (son equivalentes). */
export type Risk = RiskBand;

/** Emoji por categoría/nombre de producto, para mantener la UI rica. */
export function emojiForProduct(nombre: string): string {
  const n = nombre.toLowerCase();
  if (n.includes("fanta")) return "🥤";
  if (n.includes("sprite")) return "🟢";
  if (n.includes("zero")) return "⚫";
  if (n.includes("coca")) return "🧴";
  if (n.includes("fuze") || n.includes("té") || n.includes("tea")) return "🍵";
  if (n.includes("ciel") || n.includes("agua")) return "💧";
  if (n.includes("powerade") || n.includes("gato")) return "⚡";
  if (n.includes("jugo") || n.includes("del valle")) return "🧃";
  return "🥫";
}

/**
 * Imagen real del producto por marca/palabra clave del nombre. Devuelve la ruta
 * del PNG en /products si hay match, o null para que la UI use el emoji como
 * respaldo. Los archivos viven en supply-harmony/public/products/.
 */
export function imageForProduct(nombre: string): string | null {
  const n = nombre.toLowerCase();
  // El orden importa: primero las marcas/sabores más específicos.
  if (n.includes("topo chico")) return "/products/topo-chico.png";
  if (n.includes("fuze")) return "/products/fuze-tea.png";
  if (n.includes("powerade")) return "/products/powerade-azul.png";
  if (n.includes("lonchys") || n.includes("fideo")) return "/products/Lonchys-fideos.png";
  if (n.includes("vianda") || n.includes("alegría") || n.includes("alegria"))
    return "/products/Vianda-alegria.png";
  // Variantes Toni por sabor; el genérico (mix/yogurt/leche Toni) cae al mix.
  if (n.includes("toni") || n.includes("chiqui") || n.includes("yogurt mix")) {
    if (n.includes("chocolate")) return "/products/toni-chocolate.png";
    if (n.includes("frutilla") || n.includes("fresa")) return "/products/toni-frutilla.png";
    return "/products/toni-mix.png";
  }
  // "coca" cubre Coca-Cola y variantes (Zero, Light, Sin Azúcar) — misma imagen.
  if (n.includes("coca")) return "/products/coca-cola.png";
  return null;
}

/** Convierte 0..1 a porcentaje entero. */
export const pct = (v: number) => Math.round((v ?? 0) * 100);
