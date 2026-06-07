import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { env, isGeminiEnabled } from '../config/env.js';

export interface GeminiCandidate {
  sku: string;
  nombre: string;
  scoreHeuristico: number; // 0..1
}

export interface GeminiContext {
  customerId: string;
  skuSolicitado: string;
  nombreSolicitado: string;
  tasaAceptacionGlobal: number;
  historial: { skuSolicitado: string; skuEntregado: string; aceptado: boolean }[];
  candidatos: GeminiCandidate[];
}

export interface GeminiResult {
  skuRecomendado: string;
  nombreRecomendado: string;
  probabilidadAceptacion: number; // 0..1
  explicacion: string;
  alternativas: { sku: string; nombre: string; probabilidadAceptacion: number }[];
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    skuRecomendado: { type: SchemaType.STRING },
    nombreRecomendado: { type: SchemaType.STRING },
    probabilidadAceptacion: { type: SchemaType.NUMBER },
    explicacion: { type: SchemaType.STRING },
    alternativas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          sku: { type: SchemaType.STRING },
          nombre: { type: SchemaType.STRING },
          probabilidadAceptacion: { type: SchemaType.NUMBER },
        },
        required: ['sku', 'nombre', 'probabilidadAceptacion'],
      },
    },
  },
  required: ['skuRecomendado', 'nombreRecomendado', 'probabilidadAceptacion', 'explicacion'],
} as const;

function buildPrompt(ctx: GeminiContext): string {
  const historial = ctx.historial
    .slice(0, 20)
    .map((h) => `- cuando faltó ${h.skuSolicitado}, se entregó ${h.skuEntregado}`)
    .join('\n');

  const candidatos = ctx.candidatos
    .map((c) => `- ${c.nombre} (SKU ${c.sku}) | se eligió como sustituto el ${(c.scoreHeuristico * 100).toFixed(0)}% de las veces`)
    .join('\n');

  return `Eres un asistente de Arca Continental que recomienda sustituciones de producto cuando un artículo está agotado.

Producto solicitado AGOTADO: ${ctx.nombreSolicitado} (SKU ${ctx.skuSolicitado}).

Patrones reales de sustitución observados para este producto (de pedidos históricos):
${historial || '(sin historial previo)'}

Sustitutos candidatos con su frecuencia histórica de uso:
${candidatos || '(sin candidatos)'}

Elige el MEJOR sustituto basándote en estos datos reales. En la "explicacion" (español, 1-2 frases)
JUSTIFICA la decisión citando la evidencia: menciona con qué frecuencia se ha entregado ese sustituto
históricamente. Devuelve la probabilidad de aceptación (0 a 1) coherente con esa frecuencia, y ordena
las alternativas por probabilidad descendente. Usa exactamente los SKU y nombres de los candidatos.`;
}

/**
 * Llama a Gemini para obtener una recomendación. Lanza si Gemini no está
 * configurado o falla; el recommendation.service captura y usa el fallback.
 */
export async function getGeminiRecommendation(ctx: GeminiContext): Promise<GeminiResult> {
  if (!isGeminiEnabled) {
    throw new Error('Gemini no está configurado (GEMINI_API_KEY vacío)');
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema as never,
      temperature: 0.4,
    },
  });

  const result = await model.generateContent(buildPrompt(ctx));
  const text = result.response.text();
  const parsed = JSON.parse(text) as GeminiResult;

  // Normaliza probabilidades al rango [0,1].
  parsed.probabilidadAceptacion = Math.max(0, Math.min(1, parsed.probabilidadAceptacion));
  parsed.alternativas = (parsed.alternativas ?? []).map((a) => ({
    ...a,
    probabilidadAceptacion: Math.max(0, Math.min(1, a.probabilidadAceptacion)),
  }));

  return parsed;
}
