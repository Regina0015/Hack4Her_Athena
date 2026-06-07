import { getCriticalInventory } from './inventory.service.js';
import { listOrders } from './order.service.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { DashboardKpis, Alert } from '../dtos/domain.js';

export async function getKpis(): Promise<DashboardKpis> {
  const { orders } = await listOrders(1, 100);
  const pedidosEnRiesgo = orders.filter((o) => o.riskBand !== 'bajo').length;

  const criticos = await getCriticalInventory();
  const productosCriticos = criticos.filter((c) => c.riesgoAgotamiento === 'alto').length;

  // Cuenta líneas con Status "Pendiente" embebidas en los pedidos.
  const allOrders = await orderRepository.findAll({}, 0, 200);
  let sustitucionesPendientes = 0;
  for (const o of allOrders as any[]) {
    const lineas = o.ProductosSolicitados ?? [];
    sustitucionesPendientes += lineas.filter(
      (l: any) => l.Status === 'Pendiente' || l.Status === 'pendiente',
    ).length;
  }

  return {
    pedidosEnRiesgo,
    productosCriticos,
    sustitucionesPendientes,
    tasaAceptacionGlobal: 0,
  };
}

export async function getAlerts(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  const criticos = await getCriticalInventory();
  for (const c of criticos.slice(0, 10)) {
    alerts.push({
      id: `stock-${c.sku}`,
      tipo: 'stock_critico',
      severidad: c.riesgoAgotamiento,
      mensaje: `Stock crítico: ${c.nombre} (${c.stockActual} uds, mínimo ${c.stockMinimo}).`,
      referencia: c.sku,
    });
  }

  const { orders } = await listOrders(1, 50, 'alto');
  for (const o of orders.slice(0, 10)) {
    alerts.push({
      id: `pedido-${o.idPedido}`,
      tipo: 'pedido_alto_riesgo',
      severidad: 'alto',
      mensaje: `Pedido ${o.idPedido} con ${o.lineasEnRiesgo} línea(s) en riesgo alto.`,
      referencia: o.idPedido,
    });
  }

  return alerts;
}
