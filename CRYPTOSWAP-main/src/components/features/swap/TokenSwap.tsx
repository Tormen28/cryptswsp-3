import React, { useState, useCallback, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useTokenSwap } from '@/hooks/useTokenSwap';
import { useWallet } from '@/hooks/useWallet';

interface Token {
  address: PublicKey;
  symbol: string;
  decimals: number;
  balance: number;
}

interface TokenSwapProps {
  onSwapComplete?: (result: any) => void;
}

export const TokenSwap: React.FC<TokenSwapProps> = ({ onSwapComplete }) => {
  const { publicKey } = useWallet();
  const { isSwapping, error, getQuote, executeSwap, getTokenInfo } = useTokenSwap();
  const [amount, setAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [quote, setQuote] = useState<any>(null);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Cargar tokens disponibles
  useEffect(() => {
    const loadTokens = async () => {
      if (!publicKey) return;

      try {
        // Aquí cargarías la lista de tokens disponibles
        // Por ejemplo, desde un archivo de configuración o API
        const tokens: Token[] = [
          {
            address: new PublicKey('token1'),
            symbol: 'SOL',
            decimals: 9,
            balance: 0,
          },
          {
            address: new PublicKey('token2'),
            symbol: 'USDC',
            decimals: 6,
            balance: 0,
          },
        ];

        // Cargar balances
        for (const token of tokens) {
          const info = await getTokenInfo(token.address);
          token.balance = info.balance;
        }

        setAvailableTokens(tokens);
      } catch (err) {
        console.error('Error al cargar tokens:', err);
      }
    };

    loadTokens();
  }, [publicKey, getTokenInfo]);

  const handleAmountChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setAmount(value);

      if (value && fromToken && toToken && publicKey) {
        try {
          const quoteResult = await getQuote({
            fromToken: fromToken.address,
            toToken: toToken.address,
            amount: parseFloat(value),
            slippage: slippage / 100,
          });
          setQuote(quoteResult);
        } catch (err) {
          console.error('Error al obtener cotización:', err);
        }
      } else {
        setQuote(null);
      }
    },
    [fromToken, toToken, publicKey, getQuote, slippage]
  );

  const handleSlippageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setSlippage(value);
    },
    []
  );

  const handleTokenSelect = useCallback(
    (token: Token, isFrom: boolean) => {
      if (isFrom) {
        setFromToken(token);
        if (toToken?.address.equals(token.address)) {
          setToToken(null);
        }
      } else {
        setToToken(token);
      }
      setQuote(null);
    },
    [toToken]
  );

  const handleSwap = useCallback(async () => {
    if (!amount || !publicKey || !fromToken || !toToken) return;

    try {
      setIsConfirming(true);
      const result = await executeSwap({
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: parseFloat(amount),
        slippage: slippage / 100,
      });

      onSwapComplete?.(result);
      setAmount('');
      setQuote(null);
    } catch (err) {
      console.error('Error al ejecutar swap:', err);
    } finally {
      setIsConfirming(false);
    }
  }, [amount, fromToken, toToken, publicKey, slippage, executeSwap, onSwapComplete]);

  return (
    <div className="p-6 bg-slate-800 text-slate-100 rounded-lg shadow-lg border border-slate-700 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-100">Intercambiar Tokens</h2>

      {/* Selección de tokens */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            De
          </label>
          <select
            value={fromToken?.address.toString()}
            onChange={(e) => {
              const token = availableTokens.find(
                (t) => t.address.toString() === e.target.value
              );
              if (token) handleTokenSelect(token, true);
            }}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-in-out"
          >
            <option value="">Seleccionar token</option>
            {availableTokens.map((token) => (
              <option key={token.address.toString()} value={token.address.toString()}>
                {token.symbol} ({token.balance.toFixed(6)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            A
          </label>
          <select
            value={toToken?.address.toString()}
            onChange={(e) => {
              const token = availableTokens.find(
                (t) => t.address.toString() === e.target.value
              );
              if (token) handleTokenSelect(token, false);
            }}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-in-out"
          >
            <option value="">Seleccionar token</option>
            {availableTokens.map((token) => (
              <option
                key={token.address.toString()}
                value={token.address.toString()}
                disabled={fromToken?.address.equals(token.address)}
              >
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input de cantidad */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Cantidad
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-in-out"
            placeholder="0.0"
            min="0"
            step="0.000001"
          />
          {fromToken && (
            <button
              onClick={() => setAmount(fromToken.balance.toString())}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-300"
            >
              MAX
            </button>
          )}
        </div>
        {fromToken && (
          <p className="text-sm text-slate-400 mt-1">
            Balance: {fromToken.balance.toFixed(6)} {fromToken.symbol}
          </p>
        )}
      </div>

      {/* Slippage */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Slippage ({slippage}%)
        </label>
        <input
          type="range"
          value={slippage}
          onChange={handleSlippageChange}
          min="0.1"
          max="5"
          step="0.1"
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* Cotización */}
      {quote && (
        <div className="mb-6 p-4 bg-slate-700 rounded-lg">
          <h3 className="font-medium text-slate-100 mb-2">Cotización</h3>
          <div className="space-y-1 text-sm text-slate-300">
            <p>Recibirás (aprox.): <span className="font-semibold text-slate-100">{quote.expectedOutput.toFixed(6)} {toToken?.symbol}</span></p>
            <p>Impacto en precio: <span className="font-semibold text-slate-100">{quote.priceImpact}%</span></p>
            <p>Fee: <span className="font-semibold text-slate-100">{quote.fee.toFixed(6)} {toToken?.symbol}</span></p>
            <p>Mínimo recibido: <span className="font-semibold text-slate-100">{quote.minimumReceived.toFixed(6)} {toToken?.symbol}</span></p>
            <p>Ruta: <span className="font-semibold text-slate-100">{quote.route.join(' → ')}</span></p>
          </div>
        </div>
      )}

      {/* Botón de swap */}
      <button
        onClick={handleSwap}
        disabled={isSwapping || !amount || !publicKey || !fromToken || !toToken || isConfirming}
        className={`w-full py-3 px-4 rounded-md text-white font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500
          ${isSwapping || !amount || !publicKey || !fromToken || !toToken || isConfirming
            ? 'bg-slate-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
        }`}
      >
        {isSwapping ? 'Procesando...' : isConfirming ? 'Confirmando...' : 'Intercambiar'}
      </button>

      {/* Mensaje de error */}
      {error && (
        <div className="mt-4 p-3 bg-red-700 bg-opacity-30 text-red-300 border border-red-500 border-opacity-50 rounded-md text-sm">
          {error.message}
        </div>
      )}
    </div>
  );
};