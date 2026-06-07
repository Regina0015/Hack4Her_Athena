import type { DashboardKpis, Alert } from '../dtos/domain.js';
import {
  getLineStatusCounts,
  getOrderCounts,
  getTopProducts,
  getRealSubstitutions,
} from './stats.service.js';

/**
 * KPIs del dashboard — 100% derivados de la tabla `orders` (datos reales).
 * No usa stock simulado: todo viene del Status real de las líneas y de
 * StatusSustitucion (sustituciones reales).
 */
export async function getKpis(): Promise<DashboardKpis> {
  const [status, counts] = await Promise.all([getLineStatusCounts(), getOrderCounts()]);

  return {
    // Métricas reales de la tabla orders:
    totalPedidos: counts.totalPedidos,
    totalLineas: status.total,
    lineasPendientes: status.registrado,
    lineasEntregadas: status.entregado,
    lineasRechazadas: status.rechazado,
    totalSustituciones: counts.totalSustituciones,
    // Compatibilidad con campos previos (derivados de lo real):
    pedidosEnRiesgo: counts.totalSustituciones, // pedidos que requirieron sustitución (real)
    productosCriticos: status.rechazado, // líneas rechazadas (real)
    sustitucionesPendientes: status.registrado, // líneas aún por entregar (real)
    tasaAceptacionGlobal: 0,
  };
}

/**
 * Alertas inteligentes — basadas en sustituciones REALES de la tabla orders
 * (StatusSustitucion: producto solicitado → producto entregado en su lugar).
 */
export async function getAlerts(): Promise<Alert[]> {
  const subs = await getRealSubstitutions(10);
  const alerts: Alert[] = subs.map((s, i) => ({
    id: `sust-${s.idPedido}-${i}`,
    tipo: 'pedido_alto_riesgo',
    severidad: 'medio',
    mensaje: s.nombreSolicitado
      ? `Sustitución: ${s.nombreSolicitado} → ${s.nombreCambio || 'alternativa'}`
      : `Pedido ${s.idPedido} con sustitución aplicada`,
    referencia: s.idPedido,
  }));

  // Si no hubiera sustituciones, mostrar los productos más demandados como contexto real.
  if (alerts.length === 0) {
    const top = await getTopProducts(5);
    return top.map((p, i) => ({
      id: `top-${p.sku}-${i}`,
      tipo: 'stock_critico',
      severidad: 'bajo',
      mensaje: `Alta demanda: ${p.nombre} (${p.unidades.toLocaleString('es-MX')} unidades)`,
      referencia: p.sku,
    }));
  }
  return alerts;
}
