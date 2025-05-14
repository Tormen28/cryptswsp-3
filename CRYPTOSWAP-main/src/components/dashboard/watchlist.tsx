'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from 'lucide-react';

interface WatchlistToken {
  symbol: string;
  price: number;
  change24h: number;
}

export function Watchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistToken[]>([]);
  const [newToken, setNewToken] = useState('');

  // Simulación de datos - En producción, esto vendría de una API
  useEffect(() => {
    setWatchlist([
      { symbol: 'SOL', price: 100.50, change24h: 2.5 },
      { symbol: 'USDC', price: 1.00, change24h: 0.1 },
    ]);
  }, []);

  const addToken = () => {
    if (!newToken) return;
    
    // Aquí deberías validar el token y obtener su precio real
    setWatchlist([...watchlist, {
      symbol: newToken.toUpperCase(),
      price: 0,
      change24h: 0
    }]);
    setNewToken('');
  };

  const removeToken = (symbol: string) => {
    setWatchlist(watchlist.filter(token => token.symbol !== symbol));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Agregar token (ej: SOL)"
          value={newToken}
          onChange={(e) => setNewToken(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addToken()}
        />
        <Button onClick={addToken}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {watchlist.map((token) => (
          <Card key={token.symbol}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{token.symbol}</p>
                  <p className="text-sm text-gray-500">${token.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className={`font-semibold ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeToken(token.symbol)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 