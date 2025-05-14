import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@/hooks/useWallet';
import { useTokenSwap } from '@/hooks/useTokenSwap';

interface SwapTransaction {
  id: string;
  timestamp: number;
  fromToken: {
    address: PublicKey;
    symbol: string;
    amount: number;
  };
  toToken: {
    address: PublicKey;
    symbol: string;
    amount: number;
  };
  status: 'completed' | 'failed' | 'pending';
  txHash: string;
  priceImpact: number;
  fee: number;
}

interface SwapHistoryProps {
  maxItems?: number;
  onTransactionClick?: (tx: SwapTransaction) => void;
}

export const SwapHistory: React.FC<SwapHistoryProps> = ({
  maxItems = 10,
  onTransactionClick,
}) => {
  const { publicKey } = useWallet();
  const { getSwapHistory } = useTokenSwap();
  const [transactions, setTransactions] = useState<SwapTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');

  useEffect(() => {
    const loadHistory = async () => {
      if (!publicKey) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const history = await getSwapHistory(publicKey);
        setTransactions(history.slice(0, maxItems));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar historial'));
        console.error('Error al cargar historial:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadHistory, 30000);
    return () => clearInterval(interval);
  }, [publicKey, maxItems, getSwapHistory]);

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.status === filter;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: SwapTransaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: SwapTransaction['status']) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  if (!publicKey) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Historial de Swaps</h2>
        <p className="text-gray-500">Conecta tu wallet para ver el historial</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Historial de Swaps</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-md ${
              filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100'
            }`}
          >
            Completados
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1 rounded-md ${
              filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100'
            }`}
          >
            Fallidos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md ${
              filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100'
            }`}
          >
            Pendientes
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error.message}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay transacciones para mostrar</p>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onTransactionClick?.(tx)}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">
                    {tx.fromToken.amount} {tx.fromToken.symbol} → {tx.toToken.amount}{' '}
                    {tx.toToken.symbol}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(tx.timestamp)}</p>
                </div>
                <span className={`font-medium ${getStatusColor(tx.status)}`}>
                  {getStatusText(tx.status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Impacto en precio</p>
                  <p className="font-medium">{tx.priceImpact}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Fee</p>
                  <p className="font-medium">
                    {tx.fee} {tx.toToken.symbol}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm text-gray-500">TX Hash</p>
                <p className="font-mono text-sm truncate">{tx.txHash}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 