import { orderRepository } from '../repositories/order.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { calculateLineRisk, bandFromScore } from './risk.service.js';
import { AppError } from '../middlewares/AppError.js';
import type { OrderSummary, OrderDetailResponse, AffectedLine } from '../dtos/domain.js';

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

async function computeOrderRisk(order: Record<string, unknown>) {
  const lineas = (order.ProductosSolicitados as any[]) ?? [];
  const skus = lineas.map((l) => toStr(l.sku_solicitado)).filter(Boolean);
  const productos = skus.length ? await productRepository.findBySkus(skus) : [];
  const productMap = new Map(productos.map((p) => [p.sku, p]));

  const affected: AffectedLine[] = lineas.map((l, idx) => {
    const sku = toStr(l.sku_solicitado);
    const prod = productMap.get(sku);
    const riskScore = calculateLineRisk({
      stockActual: prod?.stockActual ?? 50,
      stockMinimo: prod?.stockMinimo ?? 30,
      quantitySolicitada: l.Quantity ?? 1,
      vecesSustituido: 0,
    });
    return {
      idLinea: toStr(l.id_linea) || String(idx),
      skuSolicitado: sku,
      nombreSku: l.nombre_sku_solicitado ?? '',
      quantity: l.Quantity ?? 0,
      stockActual: prod?.stockActual ?? 50,
      riskScore,
      riskBand: bandFromScore(riskScore),
      substitutionStatus: 'none' as const,
      skuSustituto: null,
      nombreSkuSustituto: null,
    };
  });

  const maxRisk = affected.reduce((m, a) => Math.max(m, a.riskScore), 0);
  const lineasEnRiesgo = affected.filter((a) => a.riskBand !== 'bajo').length;
  return { affected, maxRisk, lineasEnRiesgo };
}

function toSummary(o: any, maxRisk: number, lineasEnRiesgo: number): OrderSummary {
  return {
    idPedido: toStr(o.id_pedido),
    customerId: toStr(o.customer_id),
    pais: '',
    businessUnit: '',
    cedis: '',
    statusFinal: toStr(o.StatusSustitucion?.status ?? ''),
    total: o.Total ?? 0,
    riskScore: maxRisk,
    riskBand: bandFromScore(maxRisk),
    lineasEnRiesgo,
  };
}

export async function listOrders(page = 1, limit = 25, riskFilter?: string) {
  const skip = (page - 1) * limit;
  const orders = await orderRepository.findAll({}, skip, limit);
  const total = await orderRepository.count();

  const summaries: OrderSummary[] = [];
  for (const o of orders) {
    const { maxRisk, lineasEnRiesgo } = await computeOrderRisk(o as any);
    summaries.push(toSummary(o, maxRisk, lineasEnRiesgo));
  }

  const filtered = riskFilter ? summaries.filter((s) => s.riskBand === riskFilter) : summaries;
  return { orders: filtered, meta: { page, limit, total } };
}

export async function getOrderDetail(id_pedido: string): Promise<OrderDetailResponse> {
  const order = await orderRepository.findById(id_pedido);
  if (!order) throw AppError.notFound('Pedido no encontrado');

  const { affected, maxRisk, lineasEnRiesgo } = await computeOrderRisk(order as any);
  return { ...toSummary(order, maxRisk, lineasEnRiesgo), lineas: affected };
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
