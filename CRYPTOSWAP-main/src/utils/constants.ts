/**
 * Constantes globales de la aplicación
 */

// Configuración de la blockchain
export const BLOCKCHAIN = {
  SOLANA_ADDRESS_LENGTH: 44,
  DEFAULT_RPC_ENDPOINT: 'https://api.mainnet-beta.solana.com',
  NETWORK: 'mainnet-beta',
} as const;

// Configuración de la UI
export const UI = {
  DEFAULT_LOCALE: 'es-ES',
  DEFAULT_CURRENCY: 'USD',
  ANIMATION_DURATION: 300,
  BREAKPOINTS: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
  },
} as const;

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  INVALID_ADDRESS: 'Dirección inválida',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  NETWORK_ERROR: 'Error de conexión',
  TRANSACTION_FAILED: 'Transacción fallida',
} as const;

// Configuración de API
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 5000,
  RETRY_ATTEMPTS: 3,
} as const; 