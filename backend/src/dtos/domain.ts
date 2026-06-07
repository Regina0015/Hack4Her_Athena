/**
 * Tipos de dominio compartidos. Estos shapes se copian al frontend
 * (hack4her/src/types/index.ts) para que el frontend de Figma los reutilice.
 */

export type RiskBand = 'bajo' | 'medio' | 'alto';

export interface AffectedLine {
  idLinea: string;
  skuSolicitado: string;
  nombreSku: string;
  quantity: number;
  stockActual: number;
  riskScore: number;
  riskBand: RiskBand;
  substitutionStatus: 'none' | 'pending' | 'approved' | 'rejected';
  skuSustituto?: string | null;
  nombreSkuSustituto?: string | null;
}

/** Estado operativo del pedido derivado del Status REAL de sus líneas. */
export type OrderEstado = 'pendiente' | 'entregado' | 'rechazado';

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
  // Datos REALES de la base de datos (Status de cada línea):
  estado: OrderEstado; // estado global del pedido
  totalLineas: number; // total de líneas/productos del pedido
  lineasRegistradas: number; // líneas en Status "Registrado" (pendientes)
  lineasEntregadas: number; // líneas en Status "Entregado"
  lineasRechazadas: number; // líneas en Status "Rechazado" o "Cancelado"
}

export interface OrderDetailResponse extends OrderSummary {
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
  fuente: 'gemini' | 'heuristico';
}

export interface DashboardKpis {
  pedidosEnRiesgo: number;
  productosCriticos: number;
  sustitucionesPendientes: number;
  tasaAceptacionGlobal: number; // 0..1
  // KPIs basados en el Status REAL de las líneas (base de datos):
  totalPedidos: number; // total de pedidos analizados
  totalLineas: number; // total de productos/líneas
  lineasPendientes: number; // líneas en "Registrado"
  lineasEntregadas: number; // líneas "Entregado"
  lineasRechazadas: number; // líneas "Rechazado"/"Cancelado"
  totalSustituciones: number; // pedidos con sustitución real (StatusSustitucion)
}

export interface Alert {
  id: string;
  tipo: 'stock_critico' | 'pedido_alto_riesgo';
  severidad: RiskBand;
  mensaje: string;
  referencia: string;
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
  // Datos REALES derivados de la tabla orders:
  unidadesSolicitadas: number; // demanda real total (suma de Quantity)
  lineasPendientes: number; // líneas con Status "Registrado"
  lineasEntregadas: number; // líneas con Status "Entregado"
}

/** Predicción de reabasto de un producto para un cliente (Pythia anticipa). */
export interface ReabastoPrediccion {
  sku: string;
  nombre: string;
  consumoSemanal: number; // unidades/semana estimadas (histórico real / 12)
  unidadesPendientes: number; // lo aún no surtido
  semanasParaReabasto: number; // cuántas semanas cubre lo pendiente
  urgencia: RiskBand; // alto | medio | bajo
  confianza: number; // 0..1 — cuánta evidencia respalda la estimación
}

export interface CustomerPrediction {
  customerId: string;
  productos: ReabastoPrediccion[];
  resumen: { productosUrgentes: number; proximoReabastoSemanas: number | null };
}

export interface CustomerProfile {
  customerId: string;
  totalPedidos: number;
  totalLineas: number; // total de productos solicitados (suma de líneas de todos los pedidos)
  totalUnidades: number; // suma de Quantity de todas las líneas
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

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}
