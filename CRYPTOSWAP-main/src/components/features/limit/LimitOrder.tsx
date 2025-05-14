import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { ClientOnly } from '@/components/ClientOnly';

interface Token {
  symbol: string;
  mint: string;
  name: string;
}

// Lista de tokens populares para mostrar primero
const POPULAR_SYMBOLS = ['SOL', 'USDC', 'USDT', 'BTC', 'ETH', 'SRM', 'RAY', 'BONK', 'JUP', 'PYTH', 'mSOL', 'stSOL'];

// Lista local mínima de tokens populares como fallback
const LOCAL_TOKENS: Token[] = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', name: 'Solana' },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'USD Coin' },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', name: 'Tether USD' },
  { symbol: 'BTC', mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E', name: 'Bitcoin' },
  { symbol: 'ETH', mint: '2ndtZrQwQpQnH3UX77DpDhmn7YQ6QpQnH3UX77DpDhmn', name: 'Ethereum' },
];

export function LimitOrder() {
  const { t } = useTranslation();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [baseToken, setBaseToken] = useState<Token | null>(null);
  const [quoteToken, setQuoteToken] = useState<Token | null>(null);
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]); // Lista de órdenes creadas
  const [showWalletPermission, setShowWalletPermission] = useState(false); // Simula pedir permiso a la wallet
  const [isClient, setIsClient] = useState(false); // Para evitar hydration error
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función para cargar tokens (remota o local)
  const loadTokens = () => {
    setLoadingTokens(true);
    setErrorMsg(null);
    fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json')
      .then(res => {
        if (!res.ok) throw new Error('No se pudo obtener la lista de tokens');
        return res.json();
      })
      .then(data => {
        let tokenList: Token[] = data.tokens.map((tk: any) => ({
          symbol: tk.symbol.replace(/_/g, ''),
          mint: tk.address,
          name: tk.name.replace(/_/g, ' '),
        }));
        tokenList = tokenList.filter((tk, idx, arr) => tk.symbol && arr.findIndex(t2 => t2.symbol === tk.symbol) === idx);
        const popular = tokenList.filter(tk => POPULAR_SYMBOLS.includes(tk.symbol));
        const rest = tokenList.filter(tk => !POPULAR_SYMBOLS.includes(tk.symbol));
        const finalList = [...popular, ...rest];
        setTokens(finalList);
        setBaseToken(finalList.find(tk => tk.symbol === 'SOL') || finalList[0]);
        setQuoteToken(finalList.find(tk => tk.symbol === 'USDC') || finalList[1]);
        setLoadingTokens(false);
      })
      .catch(() => {
        setTokens(LOCAL_TOKENS);
        setBaseToken(LOCAL_TOKENS[0]);
        setQuoteToken(LOCAL_TOKENS[1]);
        setErrorMsg('No se pudo obtener la lista de tokens en línea. Usando lista local.');
        setLoadingTokens(false);
      });
  };

  useEffect(() => {
    setIsClient(true);
    loadTokens();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  // Evitar que ambos tokens sean iguales
  const handleBaseTokenChange = (symbol: string) => {
    const found = tokens.find(tk => tk.symbol === symbol);
    if (found) {
      setBaseToken(found);
      if (quoteToken && found.symbol === quoteToken.symbol) {
        const other = tokens.find(tk => tk.symbol !== symbol);
        if (other) setQuoteToken(other);
      }
    }
  };
  const handleQuoteTokenChange = (symbol: string) => {
    const found = tokens.find(tk => tk.symbol === symbol);
    if (found) {
      setQuoteToken(found);
      if (baseToken && found.symbol === baseToken.symbol) {
        const other = tokens.find(tk => tk.symbol !== symbol);
        if (other) setBaseToken(other);
      }
    }
  };

  const handleCreateOrder = () => {
    setErrorMsg(null);
    if (!baseToken || !quoteToken) return;
    if (baseToken.symbol === quoteToken.symbol) {
      setErrorMsg('Selecciona tokens diferentes.');
      return;
    }
    // Validaciones de precio y monto
    const priceNum = Number(price);
    const amountNum = Number(amount);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMsg('El precio debe ser un número mayor a cero.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('El monto debe ser un número mayor a cero.');
      return;
    }
    setMessage(null);
    // Simular pedir permiso a la wallet
    setShowWalletPermission(true);
    setTimeout(() => {
      setShowWalletPermission(false);
      setMessage('¡Orden creada exitosamente!');
      setOrders(prev => [
        ...prev,
        {
          id: Date.now(),
          type: orderType,
          base: baseToken.symbol,
          quote: quoteToken.symbol,
          price,
          amount
        }
      ]);
      setPrice('');
      setAmount('');
    }, 1200);
  };

  const handleCancelOrder = (id: number) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  if (!isClient) return null; // Evita errores de hydration

  if (loadingTokens) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-muted-foreground">Cargando tokens...</span>
      </div>
    );
  }
  if (!baseToken || !quoteToken) {
    return <div className="text-center text-muted-foreground">Cargando tokens...</div>;
  }

  return (
    <ClientOnly>
      <Card className="max-w-xl mx-auto shadow-lg border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center mb-2">Órdenes Límite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {showWalletPermission && (
            <div className="text-blue-600 text-center font-semibold">
              Solicitando permiso a la wallet...
            </div>
          )}
          {message && <div className="text-green-600 text-center font-semibold">{message}</div>}
          {errorMsg && (
            <div className="text-red-500 text-center text-sm mb-2 flex flex-col items-center">
              {errorMsg}
              <Button variant="outline" size="sm" className="mt-2" onClick={loadTokens}>
                Reintentar
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-center justify-center">
            <Select value={orderType} onValueChange={v => setOrderType(v as 'buy' | 'sell')}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buy">Comprar</SelectItem>
                <SelectItem value="sell">Vender</SelectItem>
              </SelectContent>
            </Select>
            <Select value={baseToken.symbol} onValueChange={handleBaseTokenChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.filter(tk => quoteToken && tk.symbol !== quoteToken.symbol).slice(0, 50).map(tk => (
                  <SelectItem key={tk.symbol} value={tk.symbol}>{tk.symbol} - {tk.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="self-center text-lg font-bold">/</span>
            <Select value={quoteToken.symbol} onValueChange={handleQuoteTokenChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tokens.filter(tk => baseToken && tk.symbol !== baseToken.symbol).slice(0, 50).map(tk => (
                  <SelectItem key={tk.symbol} value={tk.symbol}>{tk.symbol} - {tk.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder={orderType === 'buy' ? 'Precio de compra' : 'Precio de venta'}
              value={price}
              onChange={e => setPrice(e.target.value)}
              min="0"
              className="flex-1"
            />
            <Input
              type="number"
              placeholder={orderType === 'buy' ? 'Monto a comprar' : 'Monto a vender'}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min="0"
              className="flex-1"
            />
          </div>
          <Button
            className="w-full text-lg font-semibold"
            onClick={handleCreateOrder}
            disabled={!price || !amount || showWalletPermission}
          >
            {showWalletPermission ? 'Creando orden...' : 'Crear orden'}
          </Button>

          {/* Lista de órdenes creadas */}
          {orders.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-2 text-center">Órdenes creadas</h3>
              <ul className="space-y-2">
                {orders.map(order => (
                  <li key={order.id} className="flex items-center justify-between bg-muted px-4 py-2 rounded">
                    <span>
                      <b>{order.type === 'buy' ? 'Comprar' : 'Vender'}</b> {order.amount} {order.base} a {order.price} {order.quote}
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)}>
                      Cancelar
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </ClientOnly>
  );
} 