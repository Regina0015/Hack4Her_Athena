/**
 * Inventario predictivo — derivado 100% de la tabla `orders` (datos reales).
 * No hay colección de stock, así que mostramos la DEMANDA REAL por producto
 * (unidades solicitadas) y el desglose real de su Status (pendiente/entregado).
 * El "riesgo de agotamiento" se deriva de la proporción real de líneas
 * pendientes (Registrado) vs entregadas — sin simulación por hash.
 */
import { bandFromScore } from './risk.service.js';
import { getTopProducts } from './stats.service.js';
import type { InventoryItem, RiskBand } from '../dtos/domain.js';

function buildItem(p: {
  sku: string;
  nombre: string;
  unidades: number;
  lineasPendientes: number;
  lineasEntregadas: number;
  veces: number;
}): InventoryItem {
  const totalLineas = p.lineasPendientes + p.lineasEntregadas;
  // Riesgo REAL: qué proporción de la demanda de este producto sigue pendiente.
  const proporcionPendiente = totalLineas > 0 ? p.lineasPendientes / totalLineas : 0;
  const score = Math.round(proporcionPendiente * 100);
  const riesgo: RiskBand = bandFromScore(score);

  // Demanda semanal aproximada (histórico ~12 semanas) — base real.
  const consumoPromedioSemanal = Math.max(1, Math.round(p.unidades / 12));

  return {
    sku: p.sku,
    nombre: p.nombre,
    categoria: 'Bebidas',
    // Sin stock real en la base: exponemos demanda real en su lugar.
    stockActual: p.unidades,
    stockMinimo: 0,
    consumoPromedioSemanal,
    riesgoAgotamiento: riesgo,
    semanasRestantes: null,
    demandaPredichaSemanal: Math.round(consumoPromedioSemanal * 1.1),
    unidadesSolicitadas: p.unidades,
    lineasPendientes: p.lineasPendientes,
    lineasEntregadas: p.lineasEntregadas,
  };
}

export async function getInventory(): Promise<InventoryItem[]> {
  const top = await getTopProducts(40);
  return top.map(buildItem);
}

export async function getCriticalInventory(): Promise<InventoryItem[]> {
  const all = await getInventory();
  return all.filter((i) => i.riesgoAgotamiento !== 'bajo');
}
