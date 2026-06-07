import { orderRepository } from '../repositories/order.repository.js';
import { getGeminiRecommendation, type GeminiCandidate } from './gemini.service.js';
import { patternsForSku, type SubstitutionPattern } from './substitution-history.service.js';
import { getCatalogCandidates, getCatalog } from './catalog.service.js';
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

  // Mapa SKU -> nombre real del catálogo, para rellenar nombres "NaN"/vacíos.
  const catalog = await getCatalog();
  const nombrePorSku = new Map(catalog.map((c) => [c.sku, c.nombre]));
  const nombreLegible = (sku: string, raw: string) => {
    const n = clean(raw);
    if (n && n !== 'NaN') return n;
    return nombrePorSku.get(sku) || `Producto SKU ${sku.slice(0, 6)}`;
  };

  for (const [idx, l] of aRecomendar.entries()) {
    const skuSolicitado = toStr(l.sku_solicitado);
    if (!skuSolicitado) continue;

    const idLinea = toStr(l.id_linea) || String(idx);
    const nombreSolicitado = nombreLegible(skuSolicitado, l.nombre_sku_solicitado);

    // Patrones reales: cuando faltó este SKU, ¿por cuál se sustituyó?
    const patterns = await patternsForSku(skuSolicitado);
    const historialCandidatos = patternsToCandidates(patterns);
    const totalVeces = patterns.reduce((s, p) => s + p.veces, 0);
    const tieneHistorial = historialCandidatos.length > 0;

    // Gemini SIEMPRE sugiere. Si hay historial, esos son los candidatos (con su
    // frecuencia real). Si no, derivamos candidatos del catálogo de productos.
    const candidatos: GeminiCandidate[] = tieneHistorial
      ? historialCandidatos
      : (await getCatalogCandidates(skuSolicitado, nombreSolicitado)).map((c) => ({
          sku: c.sku,
          nombre: c.nombre,
          scoreHeuristico: 0, // sin frecuencia histórica; Gemini estima la probabilidad
        }));

    if (candidatos.length === 0) {
      // Caso extremo: ni historial ni catálogo (producto sin nombre/“NaN”).
      results.push({
        idLinea,
        skuSolicitado,
        nombreSolicitado,
        skuRecomendado: '',
        nombreRecomendado: 'Sin candidatos disponibles',
        probabilidadAceptacion: 0,
        explicacion: 'No hay productos en el catálogo para sugerir un sustituto.',
        alternativas: [],
        fuente: 'heuristico',
      });
      continue;
    }

    try {
      const gem = await getGeminiRecommendation({
        customerId,
        skuSolicitado,
        nombreSolicitado,
        tasaAceptacionGlobal: 0,
        tieneHistorial,
        historial: patterns.map((p) => ({
          skuSolicitado: p.nombreSolicitado,
          skuEntregado: `${p.nombreSustituto} (sustituido ${p.veces} ${p.veces === 1 ? 'vez' : 'veces'})`,
          aceptado: true,
        })),
        candidatos,
      });

      // Si hay historial, mezclamos la probabilidad de Gemini con la frecuencia
      // real del sustituto elegido; sin historial usamos solo el juicio de Gemini.
      const heuristicoDelRecomendado = tieneHistorial
        ? candidatos.find((c) => c.sku === gem.skuRecomendado)?.scoreHeuristico ?? candidatos[0].scoreHeuristico
        : 0;
      const probabilidadFinal = tieneHistorial
        ? 0.6 * gem.probabilidadAceptacion + 0.4 * heuristicoDelRecomendado
        : gem.probabilidadAceptacion;

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
  const conHistorial = totalVeces > 0 && mejor.scoreHeuristico > 0;
  const vecesMejor = Math.round(mejor.scoreHeuristico * totalVeces);
  // Si hay historial, justificamos con la frecuencia real; si no (candidatos del
  // catálogo), damos una probabilidad estimada por defecto y lo indicamos.
  const probabilidad = conHistorial ? mejor.scoreHeuristico : 0.5;
  const explicacion = conHistorial
    ? `Cuando faltó este producto, históricamente se entregó "${mejor.nombre}" en ${vecesMejor} de ${totalVeces} ocasiones (${(mejor.scoreHeuristico * 100).toFixed(0)}%).`
    : `Sin historial previo para este producto; "${mejor.nombre}" es el sustituto más parecido del catálogo.`;
  return {
    idLinea,
    skuSolicitado,
    nombreSolicitado,
    skuRecomendado: mejor.sku,
    nombreRecomendado: mejor.nombre,
    probabilidadAceptacion: Number(probabilidad.toFixed(2)),
    explicacion,
    alternativas: candidatos.slice(1, 4).map((c) => ({
      sku: c.sku,
      nombre: c.nombre,
      probabilidadAceptacion: Number((c.scoreHeuristico || 0.4).toFixed(2)),
    })),
    fuente: 'heuristico',
  };
}
