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

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}
