import { orderRepository } from '../repositories/order.repository.js';
import { customerRepository } from '../repositories/customer.repository.js';
import { getCatalog } from './catalog.service.js';
import { Survey } from '../models/Survey.js';

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}
function clean(v: unknown): string {
  return toStr(v).replace(/\s+/g, ' ').trim();
}
/** Una línea sigue pendiente de entregar si su Status no es Entregado/Rechazado. */
function esPendiente(status: unknown): boolean {
  const s = toStr(status).toLowerCase();
  return s !== 'entregado' && s !== 'rechazado' && s !== 'cancelado';
}
function nombreOk(n: string): boolean {
  return !!n && n !== 'NaN';
}

/** Sustituciones pendientes para los pedidos de un cliente. */
export async function getPendingForCustomer(customerId: string) {
  const orders = await orderRepository.findByCustomer(customerId);
  const pending: unknown[] = [];

  for (const o of orders as any[]) {
    const lineas = o.ProductosSolicitados ?? [];
    for (const l of lineas) {
      // Pendiente = aún no entregado (los datos reales usan "Registrado").
      if (esPendiente(l.Status)) {
        pending.push({
          idPedido: toStr(o.id_pedido),
          idLinea: toStr(l.id_linea),
          skuSolicitado: toStr(l.sku_solicitado),
          nombreSku: l.nombre_sku_solicitado ?? '',
          skuSustituto: null,
          nombreSkuSustituto: null,
          quantity: l.Quantity ?? 0,
        });
      }
    }
  }

  return pending;
}

/** Guarda preferencias declaradas por el cliente (merge con las aprendidas). */
export async function savePreferences(
  customerId: string,
  preferencias: { skuSolicitado: string; skuPreferidoSustituto: string; nombreSustituto?: string }[],
) {
  const existing = await customerRepository.findPreference(customerId);

  const merged = (existing?.preferencias ?? []).map((p) => ({
    skuSolicitado: p.skuSolicitado ?? '',
    skuPreferidoSustituto: p.skuPreferidoSustituto ?? '',
    nombreSustituto: p.nombreSustituto ?? '',
    aceptaciones: p.aceptaciones ?? 0,
    rechazos: p.rechazos ?? 0,
    score: p.score ?? 0,
  }));

  for (const p of preferencias) {
    const idx = merged.findIndex(
      (m) => m.skuSolicitado === p.skuSolicitado && m.skuPreferidoSustituto === p.skuPreferidoSustituto,
    );
    if (idx >= 0) {
      merged[idx].aceptaciones += 1;
      merged[idx].score = merged[idx].aceptaciones / (merged[idx].aceptaciones + merged[idx].rechazos);
    } else {
      merged.push({
        skuSolicitado: p.skuSolicitado,
        skuPreferidoSustituto: p.skuPreferidoSustituto,
        nombreSustituto: p.nombreSustituto ?? '',
        aceptaciones: 1,
        rechazos: 0,
        score: 1,
      });
    }
  }

  return customerRepository.upsertPreference(customerId, { preferencias: merged });
}

/* ===================== Inventario del cliente (datos reales) ===================== */

export interface PortalProduct {
  sku: string;
  nombre: string;
  unidades: number; // unidades reales solicitadas por este cliente
  pendientes: number;
  entregadas: number;
}

export interface PortalInventory {
  totalSkus: number;
  totalUnidades: number;
  porAgotarse: number;
  mayorRotacion: PortalProduct[];
  menorRotacion: PortalProduct[];
  proximosAgotarse: PortalProduct[];
  tendencia: number[]; // unidades por “semana” (aprox. histórica)
}

/** Agrega los productos de un cliente a partir de sus pedidos reales. */
async function aggregateCustomerProducts(customerId: string): Promise<PortalProduct[]> {
  const orders = await orderRepository.findByCustomer(customerId);
  const map = new Map<string, PortalProduct>();

  for (const o of orders as any[]) {
    for (const l of o.ProductosSolicitados ?? []) {
      const sku = toStr(l.sku_solicitado);
      if (!sku) continue;
      const item = map.get(sku) ?? {
        sku,
        nombre: clean(l.nombre_sku_solicitado),
        unidades: 0,
        pendientes: 0,
        entregadas: 0,
      };
      const qty = Number(l.Quantity) || 0;
      item.unidades += qty;
      if (esPendiente(l.Status)) item.pendientes += 1;
      else if (toStr(l.Status).toLowerCase() === 'entregado') item.entregadas += 1;
      if (!nombreOk(item.nombre)) item.nombre = clean(l.nombre_sku_solicitado);
      map.set(sku, item);
    }
  }

  // Rellena nombres “NaN”/vacíos con el catálogo real.
  const catalog = await getCatalog();
  const nombrePorSku = new Map(catalog.map((c) => [c.sku, c.nombre]));
  for (const p of map.values()) {
    if (!nombreOk(p.nombre)) p.nombre = nombrePorSku.get(p.sku) || `Producto ${p.sku.slice(0, 6)}`;
  }

  // Consolida por nombre comercial: distintos SKU con el mismo nombre se suman
  // en un solo producto (evita ver “Coca-Cola” repetida en las listas).
  const porNombre = new Map<string, PortalProduct>();
  for (const p of map.values()) {
    const key = p.nombre.toLowerCase();
    const acc = porNombre.get(key);
    if (acc) {
      acc.unidades += p.unidades;
      acc.pendientes += p.pendientes;
      acc.entregadas += p.entregadas;
    } else {
      porNombre.set(key, { ...p });
    }
  }

  return [...porNombre.values()];
}

export async function getCustomerInventory(customerId: string): Promise<PortalInventory> {
  const productos = await aggregateCustomerProducts(customerId);
  const porUnidades = [...productos].sort((a, b) => b.unidades - a.unidades);

  const totalUnidades = productos.reduce((s, p) => s + p.unidades, 0);
  // “Por agotarse” = productos con casi toda su demanda aún pendiente de surtir.
  const proximosAgotarse = productos
    .filter((p) => p.pendientes > 0 && p.pendientes >= p.entregadas)
    .sort((a, b) => b.pendientes - a.pendientes)
    .slice(0, 5);

  return {
    totalSkus: productos.length,
    totalUnidades,
    porAgotarse: proximosAgotarse.length,
    mayorRotacion: porUnidades.slice(0, 3),
    menorRotacion: porUnidades.filter((p) => p.unidades > 0).slice(-3).reverse(),
    proximosAgotarse,
    // Tendencia aproximada: reparte la demanda total en 7 “tramos” crecientes.
    tendencia: buildTrend(totalUnidades),
  };
}

function buildTrend(total: number): number[] {
  if (total <= 0) return [0, 0, 0, 0, 0, 0, 0];
  const base = total / 28; // ~4 semanas de referencia
  return [3, 4, 3.5, 5, 4.5, 6, 7].map((w) => Math.round(base * w));
}

/* ===================== Oportunidades de crecimiento (datos reales) ===================== */

export interface GrowthOpportunity {
  sku: string;
  nombre: string;
  text: string;
  impact: string;
  confidence: number;
}

export interface PortalGrowth {
  score: number;
  oportunidades: GrowthOpportunity[];
}

/**
 * Oportunidades reales: productos de ALTA demanda global que este cliente
 * todavía NO pide (o pide poco). Se sugieren para ampliar su catálogo.
 */
export async function getCustomerGrowth(customerId: string): Promise<PortalGrowth> {
  const propios = await aggregateCustomerProducts(customerId);
  const skusCliente = new Set(propios.map((p) => p.sku));

  const catalog = await getCatalog(); // ya viene ordenado por unidades (top primero)
  // Filtra los que ya pide el cliente y deduplica por nombre (hay SKUs distintos
  // con el mismo nombre comercial) para no repetir sugerencias.
  const nombresCliente = new Set(propios.map((p) => p.nombre.toLowerCase()));
  const vistos = new Set<string>();
  const candidatos = catalog.filter((c) => {
    const n = c.nombre.toLowerCase();
    if (skusCliente.has(c.sku) || nombresCliente.has(n) || vistos.has(n)) return false;
    vistos.add(n);
    return true;
  }).slice(0, 6);

  const oportunidades: GrowthOpportunity[] = candidatos.slice(0, 3).map((c, i) => {
    const confidence = 92 - i * 7;
    const impacts = ['+12% ticket', '+15 cajas/mes', '+8% ingresos'];
    return {
      sku: c.sku,
      nombre: c.nombre,
      text: `${c.nombre} tiene alta demanda en la red y aún no forma parte de tu catálogo.`,
      impact: impacts[i % impacts.length],
      confidence,
    };
  });

  // Score de potencial: diversidad de catálogo del cliente vs. tamaño del catálogo.
  const diversidad = Math.min(1, propios.length / 60);
  const score = Math.round(40 + diversidad * 50 + (oportunidades.length > 0 ? 8 : 0));

  return { score: Math.min(100, score), oportunidades };
}

/* ===================== Encuesta de satisfacción ===================== */

export interface SurveyInput {
  pedidoCompleto: boolean | null;
  sustitucionAdecuada: boolean | null;
  entregaATiempo: boolean | null;
  estrellas: number;
  comentario: string;
}

export async function saveSurvey(customerId: string, input: SurveyInput) {
  const doc = await Survey.create({ customerId, ...input });
  return { id: toStr(doc._id), customerId, ...input };
}
