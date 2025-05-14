import { Cluster } from '@solana/web3.js';

export const SOLANA_CONFIG = {
  TESTNET: "testnet",
  ENDPOINTS: {
    testnet: [
      "https://solana-testnet.rpc.extrnode.com", // Endpoint alternativo público
      "https://api.testnet.solana.com"           // Endpoint oficial como respaldo
    ]
  },
  COMMITMENT: "confirmed"
};
export const WALLET_CONFIG = {
  // Wallets soportadas
  SUPPORTED_WALLETS: [
    'Phantom',
    'Solflare',
    'Clover',
    'Alpha',
    'Avana'
  ],
  // Configuración de auto-connect
  AUTO_CONNECT: true,
  // Tiempo de espera para conexión
  CONNECTION_TIMEOUT: 10000,
} as const;