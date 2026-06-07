import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envuelve un handler async para que los errores se propaguen al errorHandler
 * sin necesidad de try/catch en cada controlador.
 */
export function asyncWrapper(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
