/** Error de aplicación con código HTTP y código semántico para el cliente. */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static badRequest(message = 'Solicitud inválida') {
    return new AppError(message, 400, 'BAD_REQUEST');
  }
}
