/**
 * Configuración de ejecución del frontend.
 *
 * VITE_USE_MOCKS ausente en desarrollo = mocks activados.
 * En producción ausente = API real. Nunca se activan mocks por accidente en un
 * build de producción.
 */
const useMocksEnv = import.meta.env.VITE_USE_MOCKS;

export const config = {
  apiBase: (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, ''),
  useMocks: useMocksEnv === undefined ? import.meta.env.DEV : useMocksEnv === 'true',
  mockLatency: Number(import.meta.env.VITE_MOCK_LATENCY || 450),
  appName: 'PawSpace',
};
