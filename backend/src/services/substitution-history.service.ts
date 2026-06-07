/**
 * Deriva las sustituciones históricas REALES a partir de los pedidos.
 *
 * En cada pedido, `StatusSustitucion` registra qué SKU se solicitó y por cuál
 * se cambió al entregar (sku_solicitado -> sku_solicitado_cambio). Acumulando
 * esos pares sobre todos los pedidos obtenemos los patrones reales de
 * sustitución, que son la base de las recomendaciones y su justificación.
 */
import { Order } from '../models/Order.js';

export interface SubstitutionPattern {
  skuSolicitado: string;
  nombreSolicitado: string;
  skuSustituto: string;
  nombreSustituto: string;
  veces: number; // cuántos pedidos hicieron esta misma sustitución
}

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

/** Limpia el padding de espacios que traen los nombres del CSV. */
function clean(nombre: unknown): string {
  return toStr(nombre).replace(/\s+/g, ' ').trim();
}

/**
 * Recorre todos los pedidos y agrupa los pares (solicitado -> sustituto) que
 * aparecen en StatusSustitucion. Devuelve los patrones ordenados por frecuencia.
 *
 * Si `customerId` se especifica, limita el análisis a los pedidos de ese cliente.
 */
export async function deriveSubstitutionPatterns(customerId?: string): Promise<SubstitutionPattern[]> {
  const filter = customerId ? { customer_id: customerId } : {};
  const cursor = Order.find(filter).select('StatusSustitucion').lean().cursor();

  const pares = new Map<string, SubstitutionPattern>();

  for await (const order of cursor) {
    const ss = (order as any).StatusSustitucion;
    if (!ss || typeof ss !== 'object') continue;

    const skuSolicitado = toStr(ss.sku_solicitado_hash ?? ss.sku_solicitado);
    const skuSustituto = toStr(ss.sku_solicitado_cambio_hash ?? ss.sku_solicitado_cambio);
    if (!skuSolicitado || !skuSustituto || skuSolicitado === skuSustituto) continue;

    const key = `${skuSolicitado}->${skuSustituto}`;
    const existing = pares.get(key);
    if (existing) {
      existing.veces += 1;
    } else {
      pares.set(key, {
        skuSolicitado,
        nombreSolicitado: clean(ss.nombre_sku_solicitado),
        skuSustituto,
        nombreSustituto: clean(ss.nombre_sku_solicitado_cambio),
        veces: 1,
      });
    }
  }

  return [...pares.values()].sort((a, b) => b.veces - a.veces);
}

/** Patrones de sustitución para un SKU solicitado específico (todos los clientes). */
export async function patternsForSku(skuSolicitado: string): Promise<SubstitutionPattern[]> {
  const all = await deriveSubstitutionPatterns();
  return all.filter((p) => p.skuSolicitado === skuSolicitado);
}
