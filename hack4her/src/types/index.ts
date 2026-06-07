/**
 * Tipos de dominio del frontend. Reflejan los DTOs del backend
 * (backend/src/dtos/domain.ts). El frontend de Figma puede reutilizarlos.
 */

export type RiskBand = 'bajo' | 'medio' | 'alto';

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

export interface OrderDetail extends OrderSummary {
  lineas: AffectedLine[];
}

export interface Recommendation {
  idLinea: string;
  skuSolicitado: string;
  nombreSolicitado: string;
  skuRecomendado: string;
  nombreRecomendado: string;
  probabilidadAceptacion: number;
  explicacion: string;
  alternativas: { sku: string; nombre: string; probabilidadAceptacion: number }[];
  fuente: 'gemini' | 'heuristico';
}

export interface DashboardKpis {
  pedidosEnRiesgo: number;
  productosCriticos: number;
  sustitucionesPendientes: number;
  tasaAceptacionGlobal: number;
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

export interface PendingSubstitution {
  idPedido: string;
  idLinea: string;
  skuSolicitado: string;
  nombreSku: string;
  skuSustituto: string | null;
  nombreSkuSustituto: string | null;
  quantity: number;
}
