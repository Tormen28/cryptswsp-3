'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';

interface FarmPool {
  pair: string;
  apr: number;
  tvl: number;
  userLiquidity: number;
  rewards: {
    token: string;
    amount: number;
  }[];
}

export function Farming() {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [selectedPool, setSelectedPool] = useState<FarmPool | null>(null);

  // Simulación de pools de farming
  const farmPools: FarmPool[] = [
    {
      pair: 'SOL-USDC',
      apr: 12.5,
      tvl: 2500000,
      userLiquidity: 0,
      rewards: [
        { token: 'SOL', amount: 0 },
        { token: 'USDC', amount: 0 }
      ]
    },
    {
      pair: 'RAY-SOL',
      apr: 18.2,
      tvl: 1500000,
      userLiquidity: 0,
      rewards: [
        { token: 'RAY', amount: 0 },
        { token: 'SOL', amount: 0 }
      ]
    }
  ];

  const handleDeposit = async () => {
    if (!publicKey || !selectedPool || !amount) return;
    
    try {
      // Aquí implementarías la lógica de depósito real
      console.log(`Depositing ${amount} to ${selectedPool.pair}`);
    } catch (error) {
      console.error('Error al depositar:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey || !selectedPool) return;
    
    try {
      // Aquí implementarías la lógica de retiro real
      console.log(`Withdrawing from ${selectedPool.pair}`);
    } catch (error) {
      console.error('Error al retirar:', error);
    }
  };

  const handleHarvest = async () => {
    if (!publicKey || !selectedPool) return;
    
    try {
      // Aquí implementarías la lógica de cosecha de recompensas
      console.log(`Harvesting rewards from ${selectedPool.pair}`);
    } catch (error) {
      console.error('Error al cosechar recompensas:', error);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center p-4">
        <p>{t('defi.connectWallet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {farmPools.map((pool) => (
          <Card 
            key={pool.pair}
            className={`cursor-pointer transition-colors ${
              selectedPool?.pair === pool.pair ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedPool(pool)}
          >
            <CardHeader>
              <CardTitle>{pool.pair} Farm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  APR: {pool.apr}%
                </p>
                <p className="text-sm text-muted-foreground">
                  TVL: ${pool.tvl.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tu Liquidez: ${pool.userLiquidity.toLocaleString()}
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recompensas:</p>
                  {pool.rewards.map((reward) => (
                    <p key={reward.token} className="text-sm text-muted-foreground">
                      {reward.amount} {reward.token}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPool && (
        <Card>
          <CardHeader>
            <CardTitle>Farming {selectedPool.pair}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Cantidad de LP tokens"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button onClick={handleDeposit}>
                  Depositar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleWithdraw}
                  disabled={selectedPool.userLiquidity <= 0}
                >
                  Retirar
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handleHarvest}
                  disabled={!selectedPool.rewards.some(r => r.amount > 0)}
                >
                  Cosechar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 