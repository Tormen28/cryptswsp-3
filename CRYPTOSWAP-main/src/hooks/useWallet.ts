import { useCallback, useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Wallet } from '../types/wallet';
import { WalletAdapterProps } from '@solana/wallet-adapter-base';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { WALLET_CONFIG } from '@/config/solana';

/**
 * Hook personalizado para manejar la conexión y gestión de wallets de Solana.
 * 
 * @example
 * ```tsx
 * const { publicKey, connected, connectWallet, disconnect } = useWallet();
 * 
 * // Conectar wallet
 * await connectWallet('Phantom');
 * 
 * // Desconectar wallet
 * await disconnect();
 * ```
 * 
 * @returns {Object} Objeto con el estado y funciones de la wallet
 * @property {PublicKey | null} publicKey - Clave pública de la wallet conectada
 * @property {boolean} connected - Estado de conexión de la wallet
 * @property {boolean} connecting - Estado de conexión en proceso
 * @property {Wallet | null} wallet - Instancia de la wallet conectada
 * @property {Wallet[]} wallets - Lista de wallets disponibles
 * @property {Error | null} error - Error de conexión si existe
 * @property {Function} connectWallet - Función para conectar una wallet específica
 * @property {Function} disconnect - Función para desconectar la wallet
 * @property {boolean} isAutoConnecting - Estado de auto-conexión
 */
export const useWallet = () => {
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    wallet,
    wallets,
  } = useSolanaWallet();

  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Conecta una wallet específica
   * @param {string} walletName - Nombre de la wallet a conectar
   * @throws {Error} Si la wallet no está disponible
   */
  const connectWallet = useCallback(
    async (walletName: string) => {
      try {
        setError(null);
        const selectedWallet = wallets.find((w) => w.adapter.name === walletName);
        if (!selectedWallet) {
          throw new Error(`Wallet ${walletName} no encontrada`);
        }
        await select(selectedWallet.adapter.name);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al conectar wallet'));
      }
    },
    [select, wallets]
  );

  /**
   * Desconecta la wallet actual
   * @throws {Error} Si hay un error al desconectar
   */
  const handleDisconnect = useCallback(async () => {
    try {
      setError(null);
      await disconnect();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al desconectar wallet'));
    }
  }, [disconnect]);

  // Auto-conexión con la última wallet usada
  useEffect(() => {
    if (WALLET_CONFIG.AUTO_CONNECT && !connected && !isAutoConnecting) {
      setIsAutoConnecting(true);
      const lastWallet = localStorage.getItem('lastWallet');
      if (lastWallet) {
        connectWallet(lastWallet).finally(() => {
          setIsAutoConnecting(false);
        });
      } else {
        setIsAutoConnecting(false);
      }
    }
  }, [connected, connectWallet, isAutoConnecting]);

  // Guardar la última wallet usada
  useEffect(() => {
    if (wallet) {
      localStorage.setItem('lastWallet', wallet.adapter.name);
    }
  }, [wallet]);

  return {
    publicKey,
    connected,
    connecting,
    wallet,
    wallets,
    error,
    connectWallet,
    disconnect: handleDisconnect,
    isAutoConnecting,
  };
}; 