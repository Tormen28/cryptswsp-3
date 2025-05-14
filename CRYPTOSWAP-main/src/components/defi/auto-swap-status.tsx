import { useAutoSwap } from '@/hooks/use-auto-swap';
import { useWallet } from '@solana/wallet-adapter-react';

export function AutoSwapStatus() {
  const { publicKey } = useWallet();
  const { config, isRunning } = useAutoSwap();

  if (!publicKey) {
    return null;
  }

  if (!config) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">Cargando estado de AutoSwap...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Estado de AutoSwap</h3>
          <p className="text-sm text-gray-500">
            {config.autoSwapEnabled ? 'Activo' : 'Inactivo'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${config.autoSwapEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-500">
            {isRunning ? 'Ejecutando...' : config.autoSwapEnabled ? 'Esperando...' : 'Detenido'}
          </span>
        </div>
      </div>

      {config.autoSwapEnabled && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900">Tokens configurados</h4>
          <div className="mt-2 space-y-2">
            {config.tokens.filter(token => token.enabled).map(token => (
              <div key={token.symbol} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{token.symbol}</span>
                <span className="text-gray-900">
                  → {token.targetStablecoin} ({token.slippage}% slippage)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 