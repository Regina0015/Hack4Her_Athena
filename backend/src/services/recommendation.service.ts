import { orderRepository } from '../repositories/order.repository.js';
import { getGeminiRecommendation, type GeminiCandidate } from './gemini.service.js';
import { patternsForSku, type SubstitutionPattern } from './substitution-history.service.js';
import type { Recommendation } from '../dtos/domain.js';
import { AppError } from '../middlewares/AppError.js';

function toStr(v: unknown): string {
  return v === null || v === undefined ? '' : String(v).trim();
}

function clean(nombre: unknown): string {
  return toStr(nombre).replace(/\s+/g, ' ').trim();
}

/**
 * Convierte los patrones históricos de un SKU en candidatos con score.
 * El score = frecuencia relativa de cada sustituto sobre el total de
 * sustituciones observadas para ese producto (probabilidad empírica).
 */
function patternsToCandidates(patterns: SubstitutionPattern[]): GeminiCandidate[] {
  const totalVeces = patterns.reduce((s, p) => s + p.veces, 0);
  if (totalVeces === 0) return [];
  return patterns
    .map((p) => ({
      sku: p.skuSustituto,
      nombre: p.nombreSustituto,
      scoreHeuristico: p.veces / totalVeces,
    }))
    .sort((a, b) => b.scoreHeuristico - a.scoreHeuristico);
}

/** Genera recomendaciones para las líneas en riesgo (status "Registrado") de un pedido. */
export async function recommendForOrder(id_pedido: string): Promise<Recommendation[]> {
  const order = await orderRepository.findById(id_pedido);
  if (!order) throw AppError.notFound('Pedido no encontrado');

  const customerId = toStr((order as any).customer_id);
  const lineas = ((order as any).ProductosSolicitados ?? []) as any[];

  // Una línea está "pendiente de entregar" si su Status no es Entregado.
  // Para evitar duplicados (cada SKU suele aparecer Registrado + Entregado),
  // recomendamos sobre las líneas "Registrado" sin un par "Entregado" igual.
  const entregados = new Set(
    lineas.filter((l) => l.Status === 'Entregado').map((l) => toStr(l.sku_solicitado)),
  );
  const aRecomendar = lineas.filter(
    (l) => l.Status !== 'Entregado' && !entregados.has(toStr(l.sku_solicitado)),
  );

  const results: Recommendation[] = [];

  for (const [idx, l] of aRecomendar.entries()) {
    const skuSolicitado = toStr(l.sku_solicitado);
    if (!skuSolicitado) continue;

    const idLinea = toStr(l.id_linea) || String(idx);
    const nombreSolicitado = clean(l.nombre_sku_solicitado);

    // Patrones reales: cuando faltó este SKU, ¿por cuál se sustituyó?
    const patterns = await patternsForSku(skuSolicitado);
    const candidatos = patternsToCandidates(patterns);

    if (candidatos.length === 0) {
      // Sin historial de sustitución para este producto.
      results.push({
        idLinea,
        skuSolicitado,
        nombreSolicitado,
        skuRecomendado: '',
        nombreRecomendado: 'Sin sustituto histórico',
        probabilidadAceptacion: 0,
        explicacion: 'No hay sustituciones registradas previamente para este producto.',
        alternativas: [],
        fuente: 'heuristico',
      });
      continue;
    }

    const totalVeces = patterns.reduce((s, p) => s + p.veces, 0);

    try {
      const gem = await getGeminiRecommendation({
        customerId,
        skuSolicitado,
        nombreSolicitado,
        tasaAceptacionGlobal: 0,
        historial: patterns.map((p) => ({
          skuSolicitado: p.nombreSolicitado,
          skuEntregado: `${p.nombreSustituto} (sustituido ${p.veces} ${p.veces === 1 ? 'vez' : 'veces'})`,
          aceptado: true,
        })),
        candidatos,
      });

      const heuristicoDelRecomendado =
        candidatos.find((c) => c.sku === gem.skuRecomendado)?.scoreHeuristico ?? candidatos[0].scoreHeuristico;
      const probabilidadFinal = 0.6 * gem.probabilidadAceptacion + 0.4 * heuristicoDelRecomendado;

      results.push({
        idLinea,
        skuSolicitado,
        nombreSolicitado,
        skuRecomendado: gem.skuRecomendado,
        nombreRecomendado: gem.nombreRecomendado,
        probabilidadAceptacion: Number(probabilidadFinal.toFixed(2)),
        explicacion: gem.explicacion,
        alternativas: gem.alternativas ?? [],
        fuente: 'gemini',
      });
    } catch (err) {
      console.warn(`⚠️  Gemini falló para SKU ${skuSolicitado}, usando heurístico:`, (err as Error).message);
      results.push(heuristicFallback(idLinea, skuSolicitado, nombreSolicitado, candidatos, totalVeces));
    }
  }

  return results;
}

/** Recomendación basada solo en los patrones históricos (sin Gemini). */
function heuristicFallback(
  idLinea: string,
  skuSolicitado: string,
  nombreSolicitado: string,
  candidatos: GeminiCandidate[],
  totalVeces: number,
): Recommendation {
  const mejor = candidatos[0];
  const vecesMejor = Math.round(mejor.scoreHeuristico * totalVeces);
  return {
    idLinea,
    skuSolicitado,
    nombreSolicitado,
    skuRecomendado: mejor.sku,
    nombreRecomendado: mejor.nombre,
    probabilidadAceptacion: Number(mejor.scoreHeuristico.toFixed(2)),
    explicacion: `Cuando faltó este producto, históricamente se entregó "${mejor.nombre}" en ${vecesMejor} de ${totalVeces} ocasiones (${(mejor.scoreHeuristico * 100).toFixed(0)}%).`,
    alternativas: candidatos.slice(1, 4).map((c) => ({
      sku: c.sku,
      nombre: c.nombre,
      probabilidadAceptacion: Number(c.scoreHeuristico.toFixed(2)),
    })),
    fuente: 'heuristico',
  };
}
