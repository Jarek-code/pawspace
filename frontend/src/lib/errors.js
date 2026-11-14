/**
 * Error normalizado de la API o de la capa de mocks.
 * status = 0 representa un fallo de red o timeout, no una respuesta HTTP.
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}
