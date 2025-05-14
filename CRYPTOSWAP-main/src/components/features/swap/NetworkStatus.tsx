import React, { useState, useEffect } from 'react';
import { useSolanaConnection } from '@/hooks/useSolanaConnection';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

interface NetworkStatusProps {
  onError?: (error: Error) => void;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ onError }) => {
  const { connection } = useSolanaConnection();
  const [isOnline, setIsOnline] = useState(true);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [tokenPrices, setTokenPrices] = useState<TokenPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkNetworkStatus = async () => {
      if (!connection) {
        setIsOnline(false);
        onError?.(new Error('No hay conexión a la red'));
        return;
      }

      try {
        const height = await connection.getBlockHeight();
        setBlockHeight(height);
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
        onError?.(err instanceof Error ? err : new Error('Error de conexión'));
      }
    };

    const loadTokenPrices = async () => {
      try {
        // Aquí cargarías los precios reales desde una API
        // Por ejemplo, CoinGecko o similar
        const prices: TokenPrice[] = [
          {
            symbol: 'SOL',
            price: 100.50,
            change24h: 2.5,
          },
          {
            symbol: 'USDC',
            price: 1.00,
            change24h: 0.1,
          },
        ];
        setTokenPrices(prices);
      } catch (err) {
        console.error('Error al cargar precios:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkNetworkStatus();
    loadTokenPrices();

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      checkNetworkStatus();
      loadTokenPrices();
    }, 30000);

    return () => clearInterval(interval);
  }, [connection, onError]);

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="p-6 bg-slate-800 text-slate-100 rounded-lg shadow-lg border border-slate-700 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-100">Estado de la Red</h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-4 h-4 rounded-full ${
              isOnline ? 'bg-green-500 animate-custom-pulse' : 'bg-red-500'
            }`}
          />
          <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
            {isOnline ? 'En línea' : 'Desconectado'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estado de la Red */}
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-700/30">
          <h3 className="text-lg font-medium text-slate-200 mb-4">Información de la Red</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Altura del Bloque</span>
              <span className="font-mono text-slate-200">
                {blockHeight?.toLocaleString() ?? 'Cargando...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estado</span>
              <span
                className={`font-medium ${
                  isOnline ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {isOnline ? 'Operativo' : 'No disponible'}
              </span>
            </div>
          </div>
        </div>

        {/* Precios de Tokens */}
        <div className="p-4 border border-slate-700 rounded-lg bg-slate-700/30">
          <h3 className="text-lg font-medium text-slate-200 mb-4">Precios de Tokens</h3>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {tokenPrices.map((token) => (
                <div key={token.symbol} className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-slate-200">{token.symbol}</span>
                    <p className="text-sm text-slate-400">
                      ${token.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-medium text-sm ${getChangeColor(token.change24h)}`}
                  >
                    {token.change24h > 0 ? '+' : ''}
                    {token.change24h.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};