/**
 * Pythia — asistente conversacional de inventario y sustituciones.
 * Usa Gemini con contexto de los datos reales (KPIs + inventario crítico).
 * Si Gemini no está disponible, responde con un fallback informativo.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, isGeminiEnabled } from '../config/env.js';
import { getKpis } from './dashboard.service.js';
import { getCriticalInventory } from './inventory.service.js';

async function buildContext(): Promise<string> {
  const [kpis, criticos] = await Promise.all([getKpis(), getCriticalInventory()]);
  const top = criticos.slice(0, 5).map((c) => `- ${c.nombre}: ${c.semanasRestantes ?? '?'} semanas de stock (riesgo ${c.riesgoAgotamiento})`).join('\n');
  return `Datos actuales de la operación (reales):
- Pedidos en riesgo: ${kpis.pedidosEnRiesgo}
- Productos críticos: ${kpis.productosCriticos}
- Sustituciones pendientes: ${kpis.sustitucionesPendientes}
Productos con mayor riesgo de agotamiento:
${top || '(sin productos críticos)'}`;
}

type Mode = 'admin' | 'cliente';

export async function chatWithPythia(
  message: string,
  mode: Mode = 'admin',
): Promise<{ reply: string; fuente: 'gemini' | 'fallback' }> {
  // El admin necesita el contexto operativo; el cliente no.
  const contexto = mode === 'admin' ? await buildContext() : '';

  if (!isGeminiEnabled) {
    return { reply: fallbackReply(message, contexto), fuente: 'fallback' };
  }

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL, generationConfig: { temperature: 0.5 } });

    const prompt =
      mode === 'admin'
        ? `Eres "Pythia", el oráculo de inventario de Arca Continental, asistiendo a un OPERADOR de CEDIS.
Respondes en español, breve (2-4 frases), profesional. Te preguntan sobre stock, cambios, pedidos en
riesgo y sustituciones. Usa los datos reales de abajo y no inventes cifras que no estén en el contexto.

${contexto}

Pregunta del operador: "${message}"

Responde de forma útil y accionable.`
        : `Eres "Pythia", el asistente virtual de una tiendita cliente de Arca Continental.
Respondes en español, breve (2-3 frases), con tono cercano y amable. El cliente pregunta cosas
generales: estatus de su pedido, costos, promociones, o por qué se sustituyó un producto.
Si no tienes el dato exacto, responde de forma orientativa y tranquilizadora (ej. tiempos típicos
de entrega, que puede revisar "Mis Pedidos", etc.). No inventes precios específicos.

Pregunta del cliente: "${message}"

Responde de forma amable y útil.`;

    const result = await model.generateContent(prompt);
    return { reply: result.response.text().trim(), fuente: 'gemini' };
  } catch {
    return { reply: fallbackReply(message, contexto), fuente: 'fallback' };
  }
}

function fallbackReply(_message: string, contexto: string): string {
  if (!contexto) {
    return 'Gracias por tu mensaje. Puedes revisar el estatus de tu pedido en "Mis Pedidos" y aprobar cualquier sustitución desde la sección de Sustituciones. ¿Te ayudo con algo más?';
  }
  return `Según los datos actuales:\n\n${contexto}\n\nTe recomiendo revisar la pantalla de Gestión de Pedidos para validar las sustituciones sugeridas.`;
}
