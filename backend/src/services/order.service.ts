import { orderRepository } from '../repositories/order.repository.js';
import { bandFromScore } from './risk.service.js';
import { getOrderStatusCounts } from './stats.service.js';
import { AppError } from '../middlewares/AppError.js';
import type { OrderSummary, OrderDetailResponse, AffectedLine } from '../dtos/domain.js';

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

/**
 * Calcula el resumen de un pedido usando SOLO el Status real de sus líneas
 * (dato de la tabla orders). Una línea "en riesgo" = sigue en "Registrado"
 * (pendiente de entregar). No hay stock simulado.
 */
function computeOrderRisk(order: Record<string, unknown>) {
  const lineas = (order.ProductosSolicitados as any[]) ?? [];

  const affected: AffectedLine[] = lineas.map((l, idx) => {
    const sku = toStr(l.sku_solicitado);
    const st = toStr(l.Status).toLowerCase();
    const pendiente = st !== 'entregado' && st !== 'rechazado' && st !== 'cancelado';
    return {
      idLinea: toStr(l.id_linea) || String(idx),
      skuSolicitado: sku,
      nombreSku: l.nombre_sku_solicitado ?? '',
      quantity: l.Quantity ?? 0,
      stockActual: 0,
      riskScore: pendiente ? 100 : 0,
      riskBand: pendiente ? ('alto' as const) : ('bajo' as const),
      substitutionStatus: 'none' as const,
      skuSustituto: null,
      nombreSkuSustituto: null,
    };
  });

  const lineasEnRiesgo = affected.filter((a) => a.riskBand !== 'bajo').length;
  // Riesgo del pedido = proporción REAL de líneas aún pendientes.
  const proporcion = affected.length > 0 ? lineasEnRiesgo / affected.length : 0;
  const maxRisk = Math.round(proporcion * 100);

  // Conteo del Status REAL de cada línea (dato de la base de datos).
  let lineasRegistradas = 0;
  let lineasEntregadas = 0;
  let lineasRechazadas = 0;
  for (const l of lineas) {
    const st = toStr(l.Status).toLowerCase();
    if (st === 'entregado') lineasEntregadas += 1;
    else if (st === 'rechazado' || st === 'cancelado') lineasRechazadas += 1;
    else lineasRegistradas += 1; // "Registrado" u otros → pendiente
  }
  const totalLineas = lineas.length;
  // Estado global del pedido:
  //  - entregado: ya se entregó al menos una línea (entregas totales o parciales)
  //  - rechazado: nada entregado y predominan los rechazos
  //  - pendiente: aún no se ha entregado nada
  const estado: 'pendiente' | 'entregado' | 'rechazado' =
    lineasEntregadas > 0 ? 'entregado' : lineasRechazadas > 0 ? 'rechazado' : 'pendiente';

  return {
    affected,
    maxRisk,
    lineasEnRiesgo,
    estado,
    totalLineas,
    lineasRegistradas,
    lineasEntregadas,
    lineasRechazadas,
  };
}

function toSummary(
  o: any,
  risk: {
    maxRisk: number;
    lineasEnRiesgo: number;
    estado: 'pendiente' | 'entregado' | 'rechazado';
    totalLineas: number;
    lineasRegistradas: number;
    lineasEntregadas: number;
    lineasRechazadas: number;
  },
): OrderSummary {
  return {
    idPedido: toStr(o.id_pedido),
    customerId: toStr(o.customer_id),
    pais: '',
    businessUnit: '',
    cedis: '',
    statusFinal: toStr(o.StatusSustitucion?.status ?? ''),
    total: o.Total ?? 0,
    riskScore: risk.maxRisk,
    riskBand: bandFromScore(risk.maxRisk),
    lineasEnRiesgo: risk.lineasEnRiesgo,
    estado: risk.estado,
    totalLineas: risk.totalLineas,
    lineasRegistradas: risk.lineasRegistradas,
    lineasEntregadas: risk.lineasEntregadas,
    lineasRechazadas: risk.lineasRechazadas,
  };
}

export async function listOrders(page = 1, limit = 25, riskFilter?: string) {
  const skip = (page - 1) * limit;
  const orders = await orderRepository.findAll({}, skip, limit);
  const total = await orderRepository.count();

  const summaries: OrderSummary[] = orders.map((o) => {
    const risk = computeOrderRisk(o as any);
    return toSummary(o, risk);
  });

  const filtered = riskFilter ? summaries.filter((s) => s.riskBand === riskFilter) : summaries;
  return { orders: filtered, meta: { page, limit, total } };
}

/**
 * Conteo de pedidos por estado sobre TODA la colección (no solo la página
 * visible). Usa la misma regla de clasificación que listOrders, por lo que el
 * resumen de "Gestión de pedidos" refleja el universo completo y es coherente
 * con el dashboard.
 */
export async function getOrderStats() {
  return getOrderStatusCounts();
}

export async function getOrderDetail(id_pedido: string): Promise<OrderDetailResponse> {
  const order = await orderRepository.findById(id_pedido);
  if (!order) throw AppError.notFound('Pedido no encontrado');

  const risk = computeOrderRisk(order as any);
  return { ...toSummary(order, risk), lineas: risk.affected };
}

export async function approveSubstitution(
  idPedido: string,
  idLinea: string,
  skuSustituto: string,
  nombreSustituto: string,
) {
  const order = await orderRepository.findById(idPedido);
  if (!order) throw AppError.notFound('Pedido no encontrado');
  return { idPedido, idLinea, substitutionStatus: 'approved' as const };
}

export async function rejectSubstitution(idPedido: string, idLinea: string) {
  const order = await orderRepository.findById(idPedido);
  if (!order) throw AppError.notFound('Pedido no encontrado');
  return { idPedido, idLinea, substitutionStatus: 'rejected' as const };
}
