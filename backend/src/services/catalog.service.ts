/**
 * Catálogo de productos derivado de la colección `orders` (la tabla `products`
 * está vacía en este dataset). Mapea sku_solicitado -> nombre real, ignorando
 * los nombres "NaN"/vacíos del CSV. Se usa para ofrecer a Gemini candidatos de
 * sustitución cuando un producto no tiene historial previo.
 *
 * El catálogo se cachea en memoria porque deriva de una agregación pesada y
 * los datos no cambian durante la ejecución.
 */
import { orderRepository } from '../repositories/order.repository.js';

export interface CatalogItem {
  sku: string;
  nombre: string;
}

let cache: CatalogItem[] | null = null;
let cacheAt = 0;
const TTL_MS = 10 * 60 * 1000;

function clean(v: unknown): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

/** Catálogo completo (SKU con nombre real) derivado de las líneas de pedidos. */
export async function getCatalog(): Promise<CatalogItem[]> {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;

  const rows = (await orderRepository.aggregate([
    { $unwind: '$ProductosSolicitados' },
    {
      $match: {
        'ProductosSolicitados.nombre_sku_solicitado': { $nin: ['', 'NaN', null] },
      },
    },
    {
      $group: {
        _id: '$ProductosSolicitados.sku_solicitado',
        nombre: { $first: '$ProductosSolicitados.nombre_sku_solicitado' },
        unidades: { $sum: { $ifNull: ['$ProductosSolicitados.Quantity', 0] } },
      },
    },
    { $sort: { unidades: -1 } },
  ])) as { _id: unknown; nombre: unknown }[];

  cache = rows
    .map((r) => ({ sku: clean(r._id), nombre: clean(r.nombre) }))
    .filter((c) => c.sku && c.nombre && c.nombre !== 'NaN');
  cacheAt = Date.now();
  return cache;
}

/**
 * Candidatos de sustitución para un producto, derivados del catálogo real.
 * Heurística simple basada en nombre: comparte la primera palabra (marca) o
 * palabras clave de categoría con el solicitado. Si no hay coincidencias
 * suficientes, completa con los productos más vendidos.
 */
export async function getCatalogCandidates(
  skuSolicitado: string,
  nombreSolicitado: string,
  limit = 12,
): Promise<CatalogItem[]> {
  const catalog = await getCatalog();
  const tokens = clean(nombreSolicitado)
    .toLowerCase()
    .split(' ')
    .filter((t) => t.length >= 3);
  const marca = tokens[0] ?? '';

  const scored = catalog
    .filter((c) => c.sku !== skuSolicitado)
    .map((c) => {
      const n = c.nombre.toLowerCase();
      let score = 0;
      if (marca && n.startsWith(marca)) score += 3; // misma marca
      for (const t of tokens) if (n.includes(t)) score += 1; // categoría/atributos
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);

  // Completa con top productos si la heurística no encontró suficientes.
  if (scored.length < 4) {
    for (const c of catalog) {
      if (c.sku === skuSolicitado) continue;
      if (scored.find((s) => s.sku === c.sku)) continue;
      scored.push(c);
      if (scored.length >= limit) break;
    }
  }
  return scored.slice(0, limit);
}
