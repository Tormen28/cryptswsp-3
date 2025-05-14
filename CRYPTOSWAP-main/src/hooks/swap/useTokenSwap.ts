import { useCallback, useState } from 'react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useWallet } from '../wallet/useWallet';
import { useSolanaConnection } from '../solana/useSolanaConnection';
import type { WalletAdapter as SolanaWalletAdapter } from '@solana/wallet-adapter-base';
import type { SwapParams, SwapQuote, SwapResult, TokenInfo } from '@/types/swap';

/**
 * Hook personalizado para gestionar el intercambio de tokens en Solana.
 * Usa tipos centralizados y expone funciones para cotizar, preparar y ejecutar swaps.
 */
export const useTokenSwap = () => {
  const { publicKey, wallet } = useWallet();
  const { connection } = useSolanaConnection();
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [tokenInfo, setTokenInfo] = useState<Record<string, TokenInfo>>({});

  /**
   * Obtiene información de un token
   */
  const getTokenInfo = useCallback(
    async (tokenAddress: PublicKey): Promise<TokenInfo> => {
      if (!connection || !publicKey) throw new Error('No hay conexión con Solana');

      try {
        const token = new Token(
          connection,
          tokenAddress,
          TOKEN_PROGRAM_ID,
          wallet as any
        );

        const associatedAddress = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenAddress,
          publicKey
        );
        
        const account = await token.getAccountInfo(associatedAddress);
        const mintInfo = await token.getMintInfo();

        return {
          decimals: mintInfo.decimals,
          symbol: 'TOKEN', // Obtener del metadata
          balance: Number(account.amount) / Math.pow(10, mintInfo.decimals),
        };
      } catch (err) {
        throw new Error('Error al obtener información del token');
      }
    },
    [connection, publicKey, wallet]
  );

  /**
   * Verifica si hay balance suficiente
   */
  const checkBalance = useCallback(
    async (tokenAddress: PublicKey, amount: number): Promise<boolean> => {
      const info = await getTokenInfo(tokenAddress);
      return info.balance >= amount;
    },
    [getTokenInfo]
  );

  /**
   * Obtiene una cotización para el intercambio
   */
  const getQuote = useCallback(
    async ({ fromToken, toToken, amount, slippage }: SwapParams): Promise<SwapQuote> => {
      if (!connection) throw new Error('No hay conexión con Solana');
      if (!publicKey) throw new Error('Wallet no conectada');

      try {
        // Verificar balance
        const hasBalance = await checkBalance(fromToken, amount);
        if (!hasBalance) {
          throw new Error('Balance insuficiente');
        }

        // Obtener precios del DEX (ejemplo con Raydium)
        const fromInfo = await getTokenInfo(fromToken);
        const toInfo = await getTokenInfo(toToken);

        // Simulación de precio (reemplazar con llamada real al DEX)
        const currentPrice = 1.0;
        const expectedOutput = amount * currentPrice;
        const fee = expectedOutput * 0.003; // 0.3% de fee
        const minimumReceived = expectedOutput * (1 - slippage);

        return {
          expectedOutput,
          priceImpact: 0.01,
          fee,
          minimumReceived,
          route: ['Raydium'], // Ruta de intercambio
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al obtener cotización'));
        throw err;
      }
    },
    [connection, publicKey, checkBalance, getTokenInfo]
  );

  /**
   * Prepara la transacción de intercambio
   */
  const prepareSwap = useCallback(
    async (params: SwapParams): Promise<Transaction> => {
      if (!connection || !publicKey) {
        throw new Error('No hay conexión con Solana o wallet no conectada');
      }

      try {
        const transaction = new Transaction();
        const quote = await getQuote(params);

        // Aquí implementarías la lógica específica del DEX
        // Por ejemplo, usando Raydium o Serum

        // Simulación de instrucciones
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey('poolAddress'),
            lamports: params.amount * LAMPORTS_PER_SOL,
          })
        );

        return transaction;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al preparar el swap'));
        throw err;
      }
    },
    [connection, publicKey, getQuote]
  );

  /**
   * Ejecuta el intercambio de tokens
   */
  const executeSwap = useCallback(
    async (params: SwapParams): Promise<SwapResult> => {
      if (!wallet) throw new Error('Wallet no conectada');
      
      try {
        setIsSwapping(true);
        setError(null);

        const transaction = await prepareSwap(params);
        const quote = await getQuote(params);

        if (!connection) {
          throw new Error('No hay conexión con Solana');
        }

        // Enviar la transacción con timeout
        const signature = await Promise.race([
          (wallet as unknown as SolanaWalletAdapter).sendTransaction(
            transaction,
            connection
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout al enviar transacción')), 30000)
          ),
        ]) as string;

        // Esperar confirmación con timeout
        await Promise.race([
          connection.confirmTransaction(signature),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout al confirmar transacción')), 60000)
          ),
        ]);

        return {
          signature,
          fromAmount: params.amount,
          toAmount: quote.expectedOutput,
          fee: quote.fee,
          timestamp: Date.now(),
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al ejecutar el swap'));
        throw err;
      } finally {
        setIsSwapping(false);
      }
    },
    [wallet, connection, prepareSwap, getQuote]
  );

  /**
   * Obtiene el historial de swaps
   */
  const getSwapHistory = useCallback(
    async (address: PublicKey, page = 1, limit = 10) => {
      if (!connection) throw new Error('No hay conexión con Solana');

      try {
        // Aquí implementarías la lógica para obtener el historial
        // Por ejemplo, consultando las transacciones del usuario
        return [];
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al obtener historial'));
        throw err;
      }
    },
    [connection]
  );

  /**
   * Obtiene el precio actual de un token en USD
   */
  const getTokenPrice = useCallback(
    async (tokenAddress: PublicKey): Promise<number> => {
      if (!connection) throw new Error('No hay conexión con Solana');

      try {
        // Aquí implementarías la lógica para obtener el precio real
        // Por ejemplo, usando una API como CoinGecko o similar
        return 1.0; // Precio simulado
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al obtener precio'));
        throw err;
      }
    },
    [connection]
  );

  return {
    isSwapping,
    error,
    getTokenInfo,
    checkBalance,
    getQuote,
    prepareSwap,
    executeSwap,
    getSwapHistory,
    getTokenPrice,
  };
}; 