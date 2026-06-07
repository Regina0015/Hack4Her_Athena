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
}

export interface OrderDetail extends OrderSummary {
  lineas: AffectedLine[];
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
}

export interface CustomerProfile {
  customerId: string;
  totalPedidos: number;
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

/* ===================== Funciones de API ===================== */

export const api = {
  // Dashboard
  dashboardKpis: () => get<DashboardKpis>("/dashboard/kpis"),
  dashboardAlerts: () => get<Alert[]>("/dashboard/alerts"),

  // Pedidos
  orders: (risk?: RiskBand) => get<OrderSummary[]>(`/orders${risk ? `?risk=${risk}` : ""}`),
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

  // Inventario
  inventory: () => get<InventoryItem[]>("/inventory"),
  criticalInventory: () => get<InventoryItem[]>("/inventory/critical"),

  // Portal del cliente
  pending: (customerId: string) =>
    get<PendingSubstitution[]>(`/portal/${encodeURIComponent(customerId)}/pending`),
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

/** Convierte 0..1 a porcentaje entero. */
export const pct = (v: number) => Math.round((v ?? 0) * 100);
