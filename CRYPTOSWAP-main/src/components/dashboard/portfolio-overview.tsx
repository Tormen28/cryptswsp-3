'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';

interface TokenBalance {
  symbol: string;
  balance: number;
  value: number;
}

export function PortfolioOverview() {
  const { publicKey } = useWallet();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);

  useEffect(() => {
    if (!publicKey) return;

    const fetchBalances = async () => {
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const balance = await connection.getBalance(publicKey);
        
        // Aquí deberías implementar la lógica para obtener los balances de tokens
        // Este es un ejemplo simplificado
        setBalances([
          {
            symbol: 'SOL',
            balance: balance / 1e9,
            value: (balance / 1e9) * 100 // Precio ejemplo
          }
        ]);

        setTotalValue(balances.reduce((acc, token) => acc + token.value, 0));
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    fetchBalances();
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="text-center p-4">
        <p>Conecta tu wallet para ver tu portafolio</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Valor Total</h3>
            <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Tokens</h3>
        <div className="space-y-2">
          {balances.map((token) => (
            <Card key={token.symbol}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-sm text-gray-500">{token.balance.toFixed(4)}</p>
                  </div>
                  <p className="font-semibold">${token.value.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 