import { Order } from '../models/Order.js';
import { bandFromScore } from './risk.service.js';
import type { InventoryItem, RiskBand } from '../dtos/domain.js';

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}
function clean(nombre: unknown): string {
  return toStr(nombre).replace(/\s+/g, ' ').trim();
}

/** Hash determinista simple de un string → entero (para stock estable por SKU). */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface DemandAgg {
  sku: string;
  nombre: string;
  unidadesSolicitadas: number; // DEMANDA REAL: suma de Quantity en todos los pedidos
  vecesPedido: number;
}

/**
 * Deriva la DEMANDA REAL por SKU recorriendo los ProductosSolicitados de todos
 * los pedidos. Es 100% dato real. El stock y el riesgo se simulan de forma
 * determinista (estable entre recargas) porque la base no incluye inventario.
 */
async function aggregateDemand(limitOrders = 4000): Promise<DemandAgg[]> {
  const cursor = Order.find().select('ProductosSolicitados').limit(limitOrders).lean().cursor();
  const map = new Map<string, DemandAgg>();

  for await (const order of cursor) {
    const lineas = ((order as any).ProductosSolicitados ?? []) as any[];
    for (const l of lineas) {
      const sku = toStr(l.sku_solicitado);
      if (!sku) continue;
      const qty = Number(l.Quantity) || 0;
      const entry = map.get(sku) ?? { sku, nombre: clean(l.nombre_sku_solicitado), unidadesSolicitadas: 0, vecesPedido: 0 };
      entry.unidadesSolicitadas += qty;
      entry.vecesPedido += 1;
      map.set(sku, entry);
    }
  }

  return [...map.values()].sort((a, b) => b.unidadesSolicitadas - a.unidadesSolicitadas);
}

function buildItem(d: DemandAgg): InventoryItem {
  // Demanda semanal REAL aproximada (asume el histórico ~ varias semanas).
  const consumoPromedioSemanal = Math.max(1, Math.round(d.unidadesSolicitadas / 12));

  // Stock simulado DETERMINISTA: derivado del hash del SKU (no cambia al recargar).
  const factor = (hashStr(d.sku) % 100) / 100; // 0..1 estable
  const stockMinimo = Math.max(20, Math.round(consumoPromedioSemanal * 0.8));
  const stockActual = Math.round(consumoPromedioSemanal * (0.3 + factor * 3)); // entre ~0.3 y ~3.3 semanas

  const semanasRestantes = consumoPromedioSemanal > 0
    ? Number((stockActual / consumoPromedioSemanal).toFixed(1))
    : null;

  let score: number;
  if (stockActual <= stockMinimo) score = 100;
  else if (semanasRestantes === null) score = 10;
  else score = Math.max(0, Math.min(100, 100 - semanasRestantes * 22));

  const riesgo: RiskBand = bandFromScore(score);

  return {
    sku: d.sku,
    nombre: d.nombre || `SKU ${d.sku.slice(0, 6)}`,
    categoria: 'Bebidas',
    stockActual,
    stockMinimo,
    consumoPromedioSemanal,
    riesgoAgotamiento: riesgo,
    semanasRestantes,
    demandaPredichaSemanal: Math.round(consumoPromedioSemanal * 1.1),
  };
}

export async function getInventory(): Promise<InventoryItem[]> {
  const demand = await aggregateDemand();
  // Top 40 SKU más demandados (suficiente para la vista y rápido).
  return demand.slice(0, 40).map(buildItem);
}

export async function getCriticalInventory(): Promise<InventoryItem[]> {
  const all = await getInventory();
  return all.filter((i) => i.riesgoAgotamiento !== 'bajo');
}
