/**
 * Inventario predictivo — derivado 100% de la tabla `orders` (datos reales).
 * No hay colección de stock, así que mostramos la DEMANDA REAL por producto
 * (unidades solicitadas) y el desglose real de su Status (pendiente/entregado).
 * El "riesgo de agotamiento" se deriva del VOLUMEN de unidades aún por surtir
 * (líneas Registrado) de cada producto, repartido por tercios para mostrar
 * variedad real (bajo/medio/alto) — sin simulación por hash.
 */
import { getTopProducts } from './stats.service.js';
import type { InventoryItem, RiskBand } from '../dtos/domain.js';

function buildItem(
  p: {
    sku: string;
    nombre: string;
    unidades: number;
    unidadesPendientes: number;
    lineasPendientes: number;
    lineasEntregadas: number;
    veces: number;
  },
  ctx: { rank: number; total: number },
): InventoryItem {
  // Riesgo por VOLUMEN PENDIENTE, repartido por TERCIOS del ranking: los
  // productos con más unidades por surtir son "alto", el tercio medio "medio"
  // y los de menor volumen pendiente "bajo". Así se ve variedad pareja y el
  // criterio sigue siendo el volumen pendiente real de cada producto.
  const posicion = ctx.total > 1 ? ctx.rank / (ctx.total - 1) : 0; // 0 = más pendientes
  const riesgo: RiskBand = posicion < 1 / 3 ? 'alto' : posicion < 2 / 3 ? 'medio' : 'bajo';
  // Score 0..100 coherente con la posición (para barras/orden en la UI).
  const score = Math.round((1 - posicion) * 100);

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
  // Ordena por unidades pendientes (más por surtir primero) y reparte el riesgo
  // por tercios del ranking: rank 0 = mayor volumen pendiente = "alto".
  const ordenados = [...top].sort((a, b) => b.unidadesPendientes - a.unidadesPendientes);
  const total = ordenados.length;
  return ordenados.map((p, rank) => buildItem(p, { rank, total }));
}

export async function getCriticalInventory(): Promise<InventoryItem[]> {
  const all = await getInventory();
  return all.filter((i) => i.riesgoAgotamiento !== 'bajo');
}
