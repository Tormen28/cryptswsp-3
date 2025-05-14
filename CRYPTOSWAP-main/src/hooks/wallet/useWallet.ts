import { useState, useEffect } from 'react';
import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import { NETWORK_CONFIG } from '@/config/constants';
import type { Wallet } from '@/types/wallet';

/**
 * Hook personalizado para gestionar la wallet de Solana.
 * Usa el tipo Wallet centralizado y expone conexión, estado y errores.
 */
export const useWallet = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Inicializar conexión
        const conn = new Connection(
          NETWORK_CONFIG.RPC_ENDPOINT,
          NETWORK_CONFIG.COMMITMENT as Commitment
        );
        setConnection(conn);

        // Verificar si Phantom está instalado
        if ('solana' in window) {
          const provider = (window as any).solana;
          if (provider.isPhantom) {
            try {
              // Conectar wallet
              const resp = await provider.connect();
              setPublicKey(resp.publicKey);
              setWallet({
                publicKey: resp.publicKey,
                connected: true,
                signTransaction: provider.signTransaction.bind(provider),
                signAllTransactions: provider.signAllTransactions.bind(provider),
                signMessage: provider.signMessage?.bind(provider),
                signVersionedTransaction: provider.signVersionedTransaction?.bind(provider),
                disconnect: provider.disconnect.bind(provider),
              });
            } catch (err) {
              setError('Error al conectar wallet');
            }
          }
        } else {
          setError('Phantom wallet no encontrada');
        }
      } catch (err) {
        setError('Error al inicializar wallet');
      } finally {
        setLoading(false);
      }
    };

    initializeWallet();
  }, []);

  return {
    wallet,
    connection,
    loading,
    error,
    publicKey,
  };
}; 