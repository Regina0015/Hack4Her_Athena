import 'dotenv/config';
import { z } from 'zod';

/**
 * Esquema de variables de entorno. Se valida al arrancar el servidor para
 * fallar rápido si falta configuración crítica.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI es requerido'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash-lite'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

/** Indica si Gemini está configurado; si no, los servicios usan fallback heurístico. */
export const isGeminiEnabled = env.GEMINI_API_KEY.trim().length > 0;
