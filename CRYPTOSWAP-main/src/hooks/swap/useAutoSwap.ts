import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../wallet/useWallet';
import { WalletAdapterService } from '@/services/wallet/WalletAdapterService';
import { SwapOptimizationService } from '@/services/swap/SwapOptimizationService';
import { AutoSwapConfig } from '@/types/autoSwap';
import { Token } from '@/types/token';
import { NotificationService } from '@/services/notifications/NotificationService';

export const useAutoSwap = () => {
  const { wallet, connection } = useWallet();
  const [config, setConfig] = useState<AutoSwapConfig | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletAdapterService = WalletAdapterService.getInstance();
  const swapOptimizationService = connection ? SwapOptimizationService.getInstance(connection) : null;
  const notificationService = NotificationService.getInstance();

  // Configuración de reintentos
  const retryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffFactor: 2
  };

  const connectWallet = useCallback(async (walletType: string) => {
    try {
      setLoading(true);
      const connectedWallet = await walletAdapterService.connectWallet(walletType);
      setIsActive(true);
      return connectedWallet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeSwap = useCallback(async (
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number
  ) => {
    if (!wallet?.publicKey) {
      throw new Error('Wallet no conectada');
    }

    if (!swapOptimizationService) {
      throw new Error('Servicio de optimización no disponible');
    }

    try {
      setLoading(true);
      setError(null);

      // Encontrar la mejor ruta
      const bestRoute = await swapOptimizationService.findBestRoute(
        fromToken,
        toToken,
        amount,
        slippage
      );

      // Ejecutar swap con reintentos
      const signature = await swapOptimizationService.executeSwapWithRetry(
        bestRoute,
        wallet.publicKey,
        retryConfig
      );

      await notificationService.sendNotification(
        'success',
        'Swap Exitoso',
        'La transacción se ha completado correctamente',
        {
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          amount,
          signature
        }
      );

      return signature;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      await notificationService.sendNotification(
        'error',
        'Error en Swap',
        errorMessage,
        {
          fromToken: fromToken.symbol,
          toToken: toToken.symbol,
          amount
        }
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, [wallet, retryConfig, swapOptimizationService]);

  const updateConfig = useCallback(async (newConfig: Partial<AutoSwapConfig>) => {
    try {
      setLoading(true);
      setError(null);

      // Validar configuración
      if (newConfig.slippage && (newConfig.slippage < 0 || newConfig.slippage > 100)) {
        throw new Error('Slippage debe estar entre 0 y 100');
      }

      if (newConfig.dailyLimit && newConfig.dailyLimit < 0) {
        throw new Error('Límite diario no puede ser negativo');
      }

      if (newConfig.monthlyLimit && newConfig.monthlyLimit < 0) {
        throw new Error('Límite mensual no puede ser negativo');
      }

      setConfig(prev => prev ? { ...prev, ...newConfig } : null);
      
      await notificationService.sendNotification(
        'success',
        'Configuración Actualizada',
        'La configuración se ha actualizado correctamente'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar configuración';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    config,
    isActive,
    loading,
    error,
    connectWallet,
    executeSwap,
    updateConfig
  };
}; 