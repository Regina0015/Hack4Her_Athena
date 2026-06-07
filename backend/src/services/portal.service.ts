import { orderRepository } from '../repositories/order.repository.js';
import { customerRepository } from '../repositories/customer.repository.js';

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

/** Sustituciones pendientes para los pedidos de un cliente. */
export async function getPendingForCustomer(customerId: string) {
  const orders = await orderRepository.findByCustomer(customerId);
  const pending: unknown[] = [];

  for (const o of orders as any[]) {
    const lineas = o.ProductosSolicitados ?? [];
    for (const l of lineas) {
      if (l.Status === 'Pendiente' || l.Status === 'pendiente') {
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
