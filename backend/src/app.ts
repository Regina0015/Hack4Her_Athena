import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS_ORIGIN puede ser una lista separada por comas (varios puertos de dev).
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  // En desarrollo Vite puede elegir cualquier puerto libre; permitimos cualquier
  // origen localhost/127.0.0.1 además de los explícitamente configurados.
  const isLocalhost = (origin: string) =>
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  app.use(
    cors({
      origin(origin, callback) {
        // Permite herramientas sin origin (curl, same-origin) y orígenes locales.
        if (!origin || allowedOrigins.includes(origin) || isLocalhost(origin)) {
          return callback(null, true);
        }
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      },
    }),
  );
  app.use(express.json());

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
