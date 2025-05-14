import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getTokenBalance, getTransactionHistory, type SolanaTransaction } from '@/services/solana';
import { useToast } from '@/hooks/use-toast';
import { AutoSwapStatus } from './auto-swap-status';

interface TokenBalance {
  symbol: string;
  balance: number;
  value: number;
  mint: string;
}

// 1. Configuración de Usuario
interface UserConfig {
  autoSwapEnabled: boolean;
  tokens: {
    symbol: string;
    enabled: boolean;
    targetStablecoin: string;
    slippage: number;
  }[];
  limits: {
    daily: number;
    monthly: number;
  };
}

export function Dashboard() {
  const { publicKey } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [recentTransactions, setRecentTransactions] = useState<SolanaTransaction[]>([]);
  const [swapHistory, setSwapHistory] = useState<any[]>([]);

  const fetchWalletData = useCallback(async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      
      // Obtener balances
      const solBalance = await getTokenBalance(publicKey.toString(), 'SOL');
      const usdcBalance = await getTokenBalance(publicKey.toString(), 'USDC');
      
      setBalances({
        SOL: solBalance,
        USDC: usdcBalance
      });

      // Obtener transacciones recientes
      const transactions = await getTransactionHistory(publicKey.toString());
      setRecentTransactions(transactions);

      // Obtener historial de swaps
      const key = `swap_history_${publicKey.toString()}`;
      const history = localStorage.getItem(key);
      setSwapHistory(history ? JSON.parse(history) : []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de la wallet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [publicKey, toast]);

  useEffect(() => {
    if (publicKey) {
      fetchWalletData();
      // Actualizar datos cada 30 segundos
      const interval = setInterval(fetchWalletData, 30000);
      return () => clearInterval(interval);
    }
  }, [publicKey, fetchWalletData]);

  if (!publicKey) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Conecta tu wallet para ver tu dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Balance Total</h2>
          <div className="mt-2">
            <p className="text-3xl font-bold text-gray-900">
              {loading ? '...' : `${balances.USDC?.toFixed(2) || '0.00'} USDC`}
            </p>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Tokens</h2>
          <div className="mt-4 space-y-4">
            {Object.entries(balances).map(([symbol, balance]) => (
              <div key={symbol} className="flex items-center justify-between">
                <span className="text-gray-500">{symbol}</span>
                <span className="font-medium">{balance.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estado de AutoSwap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <AutoSwapStatus />
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Actividad Reciente</h2>
          <div className="mt-4 space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    tx.status === 'Success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-500">{tx.type}</span>
                </div>
                <div className="text-sm text-gray-900">
                  {tx.amount} {tx.tokenIn}
                </div>
                <a
                  href={tx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historial de Swaps */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900">Historial de Swaps (AutoSwap)</h2>
        <div className="mt-4 space-y-4">
          {swapHistory.length === 0 ? (
            <p className="text-gray-500">No hay swaps automáticos registrados.</p>
          ) : (
            swapHistory.map((swap, idx) => (
              <div key={swap.txid || idx} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-900 font-medium">
                    {swap.amount} {swap.tokenIn} → {swap.tokenOut}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(swap.timestamp).toLocaleString()}
                  </span>
                </div>
                <a
                  href={`https://solscan.io/tx/${swap.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver tx
                </a>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Botón de actualización */}
      <div className="flex justify-end">
        <button
          onClick={fetchWalletData}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
    </div>
  );
} 