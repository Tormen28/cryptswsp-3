import { Connection, Commitment } from '@solana/web3.js';
import { NETWORK_CONFIG } from '@/config/constants';

/**
 * Hook personalizado para gestionar la conexión con Solana.
 * Usa la configuración centralizada de la red.
 */
export const useSolanaConnection = () => {
  const connection = new Connection(
    NETWORK_CONFIG.RPC_ENDPOINT,
    NETWORK_CONFIG.COMMITMENT as Commitment
  );

  return { connection };
}; 