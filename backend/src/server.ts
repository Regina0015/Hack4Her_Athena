import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env, isGeminiEnabled } from './config/env.js';

async function bootstrap() {
  await connectDB();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`🚀 API escuchando en http://localhost:${env.PORT}/api`);
    console.log(`   Gemini: ${isGeminiEnabled ? 'habilitado' : 'DESHABILITADO (usando fallback heurístico)'}`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Error al arrancar el servidor:', err);
  process.exit(1);
});
