import { useCallback, useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/config/solana';
import { createContext } from 'react';

/**
 * Hook personalizado para manejar la conexión con la red Solana.
 * 
 * @example
 * ```tsx
 * const { connection, getBalance, getTokenAccounts } = useSolanaConnection();
 * 
 * // Obtener balance
 * const balance = await getBalance(publicKey);
 * 
 * // Obtener cuentas de tokens
 * const tokenAccounts = await getTokenAccounts(publicKey);
 * ```
 * 
 * @returns {Object} Objeto con el estado y funciones de conexión
 * @property {Connection | null} connection - Instancia de conexión con Solana
 * @property {boolean} isConnecting - Estado de conexión en proceso
 * @property {Error | null} error - Error de conexión si existe
 * @property {Function} getBalance - Función para obtener el balance de una cuenta
 * @property {Function} getTokenAccounts - Función para obtener las cuentas de tokens
 * @property {Function} initializeConnection - Función para inicializar la conexión
 */
export const useSolanaConnection = () => {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);

  const getNextEndpoint = useCallback((network: 'mainnet-beta' | 'testnet' | 'devnet') => {
    const endpoints = SOLANA_CONFIG.ENDPOINTS[network];
    const nextIndex = (currentEndpointIndex + 1) % endpoints.length;
    setCurrentEndpointIndex(nextIndex);
    return endpoints[nextIndex];
  }, [currentEndpointIndex]);

  /**
   * Inicializa la conexión con la red Solana
   * @throws {Error} Si hay un error al conectar con la red
   */
  const initializeConnection = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const network = SOLANA_CONFIG.TESTNET; // Usar Testnet para desarrollo
      const endpoint = SOLANA_CONFIG.ENDPOINTS[network][currentEndpointIndex];
      
      const newConnection = new Connection(
        endpoint,
        SOLANA_CONFIG.COMMITMENT
      );

      // Verificar la conexión
      await newConnection.getVersion();
      setConnection(newConnection);
    } catch (err) {
      // Intentar con el siguiente endpoint
      const nextEndpoint = getNextEndpoint(SOLANA_CONFIG.TESTNET);
      console.warn(`Error al conectar con ${SOLANA_CONFIG.ENDPOINTS[SOLANA_CONFIG.TESTNET][currentEndpointIndex]}, intentando con ${nextEndpoint}`);
      
      setError(err instanceof Error ? err : new Error('Error al conectar con Solana'));
    } finally {
      setIsConnecting(false);
    }
  }, [currentEndpointIndex, getNextEndpoint]);

  /**
   * Obtiene el balance de una cuenta
   * @param {PublicKey} publicKey - Clave pública de la cuenta
   * @returns {Promise<number>} Balance de la cuenta en lamports
   * @throws {Error} Si no hay conexión o hay un error al obtener el balance
   */
  const getBalance = useCallback(
    async (publicKey: PublicKey) => {
      if (!connection) throw new Error('No hay conexión con Solana');
      return await connection.getBalance(publicKey);
    },
    [connection]
  );

  /**
   * Obtiene las cuentas de tokens de una wallet
   * @param {PublicKey} publicKey - Clave pública de la wallet
   * @returns {Promise<ParsedAccountInfo[]>} Lista de cuentas de tokens
   * @throws {Error} Si no hay conexión o hay un error al obtener las cuentas
   */
  const getTokenAccounts = useCallback(
    async (publicKey: PublicKey) => {
      if (!connection) throw new Error('No hay conexión con Solana');
      return await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });
    },
    [connection]
  );

  // Inicializar conexión al montar el componente
  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  return {
    connection,
    isConnecting,
    error,
    getBalance,
    getTokenAccounts,
    initializeConnection,
  };
}; 