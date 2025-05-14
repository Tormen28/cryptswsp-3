'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';

interface StakingPool {
  token: string;
  apr: number;
  totalStaked: number;
  userStaked: number;
  rewards: number;
}

export function Staking() {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);

  // Simulación de pools de staking
  const stakingPools: StakingPool[] = [
    {
      token: 'SOL',
      apr: 5.2,
      totalStaked: 1000000,
      userStaked: 0,
      rewards: 0
    },
    {
      token: 'USDC',
      apr: 3.8,
      totalStaked: 500000,
      userStaked: 0,
      rewards: 0
    }
  ];

  const handleStake = async () => {
    if (!publicKey || !selectedPool || !amount) return;
    
    try {
      // Aquí implementarías la lógica de staking real
      console.log(`Staking ${amount} ${selectedPool.token}`);
    } catch (error) {
      console.error('Error al hacer stake:', error);
    }
  };

  const handleUnstake = async () => {
    if (!publicKey || !selectedPool) return;
    
    try {
      // Aquí implementarías la lógica de unstaking real
      console.log(`Unstaking from ${selectedPool.token}`);
    } catch (error) {
      console.error('Error al hacer unstake:', error);
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
        {stakingPools.map((pool) => (
          <Card 
            key={pool.token}
            className={`cursor-pointer transition-colors ${
              selectedPool?.token === pool.token ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedPool(pool)}
          >
            <CardHeader>
              <CardTitle>{pool.token} Staking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  APR: {pool.apr}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Total Staked: {pool.totalStaked.toLocaleString()} {pool.token}
                </p>
                <p className="text-sm text-muted-foreground">
                  Tu Stake: {pool.userStaked} {pool.token}
                </p>
                <p className="text-sm text-muted-foreground">
                  Recompensas: {pool.rewards} {pool.token}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPool && (
        <Card>
          <CardHeader>
            <CardTitle>Stake {selectedPool.token}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Cantidad de ${selectedPool.token}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button onClick={handleStake}>
                  Stake
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleUnstake}
                  disabled={selectedPool.userStaked <= 0}
                >
                  Unstake
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 