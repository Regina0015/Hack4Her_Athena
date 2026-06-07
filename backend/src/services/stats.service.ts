/**
 * Estadísticas REALES derivadas exclusivamente de la colección `orders`.
 * Todo lo que se muestra en el dashboard/inventario/alertas sale de aquí,
 * usando agregaciones de MongoDB sobre los datos reales (sin simulación).
 */
import { orderRepository } from '../repositories/order.repository.js';
import { Order } from '../models/Order.js';

function clean(nombre: unknown): string {
  return String(nombre ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Conteo global de líneas por Status (Registrado/Entregado/Rechazado/Cancelado). */
export async function getLineStatusCounts() {
  const rows = (await orderRepository.aggregate([
    { $unwind: '$ProductosSolicitados' },
    { $group: { _id: '$ProductosSolicitados.Status', count: { $sum: 1 } } },
  ])) as { _id: string | null; count: number }[];

  let registrado = 0;
  let entregado = 0;
  let rechazado = 0;
  for (const r of rows) {
    const s = String(r._id ?? '').toLowerCase();
    if (s === 'entregado') entregado += r.count;
    else if (s === 'rechazado' || s === 'cancelado') rechazado += r.count;
    else registrado += r.count;
  }
  const total = registrado + entregado + rechazado;
  return { total, registrado, entregado, rechazado };
}

/**
 * Conteo de PEDIDOS por estado, sobre TODA la colección (no solo una página).
 * El estado se deriva del Status real de las líneas, con la MISMA regla que
 * computeOrderRisk en order.service.ts (entrega parcial cuenta como entregado):
 *   - entregadas > 0                  → entregado (entrega total o parcial)
 *   - sin entregas y rechazadas > 0   → rechazado
 *   - sin entregas ni rechazos        → pendiente
 */
export async function getOrderStatusCounts() {
  const rows = (await orderRepository.aggregate([
    {
      $project: {
        entregadas: {
          $size: {
            $filter: {
              input: { $ifNull: ['$ProductosSolicitados', []] },
              as: 'l',
              cond: { $eq: [{ $toLower: { $ifNull: ['$$l.Status', ''] } }, 'entregado'] },
            },
          },
        },
        rechazadas: {
          $size: {
            $filter: {
              input: { $ifNull: ['$ProductosSolicitados', []] },
              as: 'l',
              cond: {
                $in: [
                  { $toLower: { $ifNull: ['$$l.Status', ''] } },
                  ['rechazado', 'cancelado'],
                ],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        estado: {
          $switch: {
            branches: [
              { case: { $gt: ['$entregadas', 0] }, then: 'entregado' },
              { case: { $gt: ['$rechazadas', 0] }, then: 'rechazado' },
            ],
            default: 'pendiente',
          },
        },
      },
    },
    { $group: { _id: '$estado', count: { $sum: 1 } } },
  ])) as { _id: string; count: number }[];

  let pendiente = 0;
  let entregado = 0;
  let rechazado = 0;
  for (const r of rows) {
    if (r._id === 'pendiente') pendiente = r.count;
    else if (r._id === 'rechazado') rechazado = r.count;
    else entregado = r.count;
  }
  return { total: pendiente + entregado + rechazado, pendiente, entregado, rechazado };
}

/** Total de pedidos y de sustituciones reales (StatusSustitucion con cambio). */
export async function getOrderCounts() {
  const totalPedidos = await Order.countDocuments();
  const totalSustituciones = await Order.countDocuments({
    'StatusSustitucion.sku_solicitado_cambio': { $exists: true, $ne: null },
  });
  return { totalPedidos, totalSustituciones };
}

/** Productos más demandados por unidades reales (suma de Quantity). */
export async function getTopProducts(limit = 40) {
  const rows = (await orderRepository.aggregate([
    { $unwind: '$ProductosSolicitados' },
    {
      $group: {
        _id: '$ProductosSolicitados.sku_solicitado',
        nombre: { $first: '$ProductosSolicitados.nombre_sku_solicitado' },
        unidades: { $sum: { $ifNull: ['$ProductosSolicitados.Quantity', 0] } },
        registradas: {
          $sum: { $cond: [{ $eq: ['$ProductosSolicitados.Status', 'Registrado'] }, 1, 0] },
        },
        entregadas: {
          $sum: { $cond: [{ $eq: ['$ProductosSolicitados.Status', 'Entregado'] }, 1, 0] },
        },
        veces: { $sum: 1 },
      },
    },
    { $sort: { unidades: -1 } },
    { $limit: limit },
  ])) as {
    _id: unknown;
    nombre: unknown;
    unidades: number;
    registradas: number;
    entregadas: number;
    veces: number;
  }[];

  return rows.map((r) => ({
    sku: String(r._id ?? ''),
    nombre: clean(r.nombre) && clean(r.nombre) !== 'NaN' ? clean(r.nombre) : `SKU ${String(r._id).slice(0, 6)}`,
    unidades: r.unidades,
    lineasPendientes: r.registradas,
    lineasEntregadas: r.entregadas,
    veces: r.veces,
  }));
}

/** Sustituciones reales más recientes (de StatusSustitucion). */
export async function getRealSubstitutions(limit = 12) {
  const rows = (await orderRepository.aggregate([
    { $match: { 'StatusSustitucion.sku_solicitado_cambio': { $exists: true, $ne: null } } },
    { $limit: 500 },
    {
      $project: {
        idPedido: '$id_pedido',
        nombreSolicitado: '$StatusSustitucion.nombre_sku_solicitado',
        nombreCambio: '$StatusSustitucion.nombre_sku_solicitado_cambio',
      },
    },
    { $limit: limit },
  ])) as { idPedido: unknown; nombreSolicitado: unknown; nombreCambio: unknown }[];

  return rows.map((r) => ({
    idPedido: String(r.idPedido ?? ''),
    nombreSolicitado: clean(r.nombreSolicitado),
    nombreCambio: clean(r.nombreCambio),
  }));
}
