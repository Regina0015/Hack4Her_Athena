import { customerRepository } from '../repositories/customer.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import type { CustomerProfile, OrderSummary, RiskBand } from '../dtos/domain.js';

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}
function clean(nombre: unknown): string {
  return toStr(nombre).replace(/\s+/g, ' ').trim();
}

/** Construye el perfil inteligente del cliente leyendo su historial de pedidos. */
export async function getCustomerProfile(customerId: string): Promise<CustomerProfile> {
  const orders = await orderRepository.findByCustomer(customerId);

  // Productos más solicitados + sustituciones reales (de StatusSustitucion).
  const historialSustituciones: CustomerProfile['historialSustituciones'] = [];
  const solicitadosCount = new Map<string, { sku: string; nombre: string; conteo: number }>();
  let totalLineas = 0;
  let totalUnidades = 0;
  for (const o of orders) {
    const lineas = (o as any).ProductosSolicitados ?? [];
    for (const l of lineas) {
      const sku = toStr(l.sku_solicitado);
      if (!sku) continue;
      totalLineas += 1;
      totalUnidades += Number(l.Quantity) || 0;
      const entry = solicitadosCount.get(sku) ?? { sku, nombre: clean(l.nombre_sku_solicitado), conteo: 0 };
      // Cuenta unidades reales (Quantity), no solo apariciones de la línea.
      entry.conteo += Number(l.Quantity) || 1;
      solicitadosCount.set(sku, entry);
    }

    // Sustitución real que ocurrió en este pedido.
    const ss = (o as any).StatusSustitucion;
    if (ss && typeof ss === 'object') {
      const skuSol = toStr(ss.sku_solicitado_hash ?? ss.sku_solicitado);
      const skuEnt = toStr(ss.sku_solicitado_cambio_hash ?? ss.sku_solicitado_cambio);
      if (skuSol && skuEnt && skuSol !== skuEnt) {
        historialSustituciones.push({
          idPedido: toStr(o.id_pedido),
          skuSolicitado: skuSol,
          nombreSkuSolicitado: clean(ss.nombre_sku_solicitado),
          skuEntregado: skuEnt,
          nombreSkuEntregado: clean(ss.nombre_sku_solicitado_cambio),
          aceptado: true,
        });
      }
    }
  }

  const historialPedidos: OrderSummary[] = (orders as any[]).map((o) => {
    const lineas = (o.ProductosSolicitados ?? []) as any[];
    let reg = 0;
    let ent = 0;
    let rech = 0;
    for (const l of lineas) {
      const st = toStr(l.Status).toLowerCase();
      if (st === 'entregado') ent += 1;
      else if (st === 'rechazado' || st === 'cancelado') rech += 1;
      else reg += 1;
    }
    const estado: 'pendiente' | 'entregado' | 'rechazado' =
      reg > 0 ? 'pendiente' : rech > ent ? 'rechazado' : 'entregado';
    return {
      idPedido: toStr(o.id_pedido),
      customerId: toStr(o.customer_id),
      pais: '',
      businessUnit: '',
      cedis: '',
      statusFinal: toStr(o.StatusSustitucion?.status ?? ''),
      total: o.Total ?? 0,
      riskScore: 0,
      riskBand: 'bajo' as RiskBand,
      lineasEnRiesgo: 0,
      estado,
      totalLineas: lineas.length,
      lineasRegistradas: reg,
      lineasEntregadas: ent,
      lineasRechazadas: rech,
    };
  });

  const productosMasSolicitados = [...solicitadosCount.values()]
    .sort((a, b) => b.conteo - a.conteo)
    .slice(0, 10);

  // Preferencias REALES: agrupa los pares (solicitado → entregado) del historial.
  const paresMap = new Map<string, { skuSolicitado: string; skuPreferidoSustituto: string; nombreSustituto: string; aceptaciones: number; rechazos: number; score: number }>();
  for (const s of historialSustituciones) {
    const key = `${s.skuSolicitado}->${s.skuEntregado}`;
    const par = paresMap.get(key) ?? {
      skuSolicitado: s.skuSolicitado,
      skuPreferidoSustituto: s.skuEntregado,
      nombreSustituto: s.nombreSkuEntregado,
      aceptaciones: 0,
      rechazos: 0,
      score: 1,
    };
    par.aceptaciones += 1;
    paresMap.set(key, par);
  }
  const preferencias = [...paresMap.values()].sort((a, b) => b.aceptaciones - a.aceptaciones);
  const totalSustituciones = historialSustituciones.length;
  const tasaAceptacionGlobal = totalSustituciones > 0 ? 1 : 0; // todas las observadas se entregaron

  return {
    customerId,
    totalPedidos: orders.length,
    totalLineas,
    totalUnidades,
    tasaAceptacionGlobal,
    totalSustituciones,
    preferencias,
    productosMasSolicitados,
    historialPedidos,
    historialSustituciones,
  };
}

/** Recalcula y persiste preferencias de un cliente tras una aprobación/rechazo. */
export async function recomputePreferences(customerId: string) {
  const pref = await customerRepository.findPreference(customerId);
  return customerRepository.upsertPreference(customerId, {
    tasaAceptacionGlobal: pref?.tasaAceptacionGlobal ?? 0,
    totalSustituciones: pref?.totalSustituciones ?? 0,
    preferencias: (pref?.preferencias ?? []).map((p) => ({
      skuSolicitado: p.skuSolicitado ?? '',
      skuPreferidoSustituto: p.skuPreferidoSustituto ?? '',
      nombreSustituto: p.nombreSustituto ?? '',
      aceptaciones: p.aceptaciones ?? 0,
      rechazos: p.rechazos ?? 0,
      score: p.score ?? 0,
    })),
    productosMasSolicitados: (pref?.productosMasSolicitados ?? []).map((p) => ({
      sku: p.sku ?? '',
      nombre: p.nombre ?? '',
      conteo: p.conteo ?? 0,
    })),
  });
}
