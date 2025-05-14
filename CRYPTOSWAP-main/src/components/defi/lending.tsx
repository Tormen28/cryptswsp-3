'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';

interface LendingPool {
  token: string;
  supplyRate: number;
  borrowRate: number;
  totalSupply: number;
  totalBorrowed: number;
  userSupply: number;
  userBorrowed: number;
  collateralFactor: number;
}

// Asegurar que existe esta exportación
export function Lending() {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [selectedPool, setSelectedPool] = useState<LendingPool | null>(null);
  const [action, setAction] = useState<'supply' | 'borrow' | 'repay'>('supply');

  // Simulación de pools de préstamos
  const lendingPools: LendingPool[] = [
    {
      token: 'SOL',
      supplyRate: 2.5,
      borrowRate: 4.2,
      totalSupply: 5000000,
      totalBorrowed: 2000000,
      userSupply: 0,
      userBorrowed: 0,
      collateralFactor: 0.75
    },
    {
      token: 'USDC',
      supplyRate: 3.8,
      borrowRate: 5.5,
      totalSupply: 10000000,
      totalBorrowed: 4000000,
      userSupply: 0,
      userBorrowed: 0,
      collateralFactor: 0.85
    }
  ];

  const handleSupply = async () => {
    if (!publicKey || !selectedPool || !amount) return;
    
    try {
      // Aquí implementarías la lógica de suministro real
      console.log(`Supplying ${amount} ${selectedPool.token}`);
    } catch (error) {
      console.error('Error al suministrar:', error);
    }
  };

  const handleBorrow = async () => {
    if (!publicKey || !selectedPool || !amount) return;
    
    try {
      // Aquí implementarías la lógica de préstamo real
      console.log(`Borrowing ${amount} ${selectedPool.token}`);
    } catch (error) {
      console.error('Error al pedir prestado:', error);
    }
  };

  const handleRepay = async () => {
    if (!publicKey || !selectedPool || !amount) return;
    
    try {
      // Aquí implementarías la lógica de pago real
      console.log(`Repaying ${amount} ${selectedPool.token}`);
    } catch (error) {
      console.error('Error al pagar:', error);
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
        {lendingPools.map((pool) => (
          <Card 
            key={pool.token}
            className={`cursor-pointer transition-colors ${
              selectedPool?.token === pool.token ? 'border-primary' : ''
            }`}
            onClick={() => setSelectedPool(pool)}
          >
            <CardHeader>
              <CardTitle>{pool.token} Lending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tasa de Suministro: {pool.supplyRate}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Tasa de Préstamo: {pool.borrowRate}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Factor de Colateral: {pool.collateralFactor * 100}%
                </p>
                <p className="text-sm text-muted-foreground">
                  Suministrado: {pool.userSupply} {pool.token}
                </p>
                <p className="text-sm text-muted-foreground">
                  Prestado: {pool.userBorrowed} {pool.token}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPool && (
        <Card>
          <CardHeader>
            <CardTitle>Lending {selectedPool.token}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={action}
                onValueChange={(value: 'supply' | 'borrow' | 'repay') => setAction(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Seleccionar acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supply">Suministrar</SelectItem>
                  <SelectItem value="borrow">Pedir Prestado</SelectItem>
                  <SelectItem value="repay">Pagar</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={`Cantidad de ${selectedPool.token}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button 
                  onClick={
                    action === 'supply' 
                      ? handleSupply 
                      : action === 'borrow' 
                        ? handleBorrow 
                        : handleRepay
                  }
                >
                  {action === 'supply' 
                    ? 'Suministrar' 
                    : action === 'borrow' 
                      ? 'Pedir Prestado' 
                      : 'Pagar'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}