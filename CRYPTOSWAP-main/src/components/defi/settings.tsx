'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useWallet } from '@solana/wallet-adapter-react';
import { useTranslation } from 'react-i18next';

interface TokenConfig {
  symbol: string;
  mint: string;
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  autoSwap: boolean;
  targetToken: string;
}

interface DailyLimit {
  token: string;
  amount: number;
}

export function Settings() {
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const [tokenConfigs, setTokenConfigs] = useState<TokenConfig[]>([]);
  const [dailyLimits, setDailyLimits] = useState<DailyLimit[]>([]);
  const [slippage, setSlippage] = useState('1');
  const [loading, setLoading] = useState(false);

  // Cargar configuración inicial
  useEffect(() => {
    if (publicKey) {
      loadSettings();
    }
  }, [publicKey]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Aquí implementaremos la carga de configuración desde el backend
      // Por ahora usamos datos de ejemplo
      setTokenConfigs([
        {
          symbol: 'SOL',
          mint: 'So11111111111111111111111111111111111111112',
          enabled: true,
          minAmount: 0.1,
          maxAmount: 10,
          autoSwap: true,
          targetToken: 'USDC'
        },
        {
          symbol: 'USDC',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          enabled: true,
          minAmount: 1,
          maxAmount: 1000,
          autoSwap: false,
          targetToken: 'USDT'
        }
      ]);

      setDailyLimits([
        { token: 'SOL', amount: 100 },
        { token: 'USDC', amount: 10000 }
      ]);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // Aquí implementaremos el guardado de configuración en el backend
      console.log('Guardando configuración:', { tokenConfigs, dailyLimits, slippage });
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTokenConfig = (index: number, updates: Partial<TokenConfig>) => {
    const newConfigs = [...tokenConfigs];
    newConfigs[index] = { ...newConfigs[index], ...updates };
    setTokenConfigs(newConfigs);
  };

  const updateDailyLimit = (token: string, amount: number) => {
    const newLimits = dailyLimits.map(limit => 
      limit.token === token ? { ...limit, amount } : limit
    );
    setDailyLimits(newLimits);
  };

  if (!publicKey) {
    return (
      <div className="text-center p-4">
        <p>{t('defi.connectWallet')}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Auto-Swap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Configuración de Tokens */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tokens</h3>
            {tokenConfigs.map((config, index) => (
              <div key={config.symbol} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{config.symbol}</h4>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => 
                      updateTokenConfig(index, { enabled: checked })
                    }
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm">Monto Mínimo</label>
                    <Input
                      type="number"
                      value={config.minAmount}
                      onChange={(e) => 
                        updateTokenConfig(index, { minAmount: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Monto Máximo</label>
                    <Input
                      type="number"
                      value={config.maxAmount}
                      onChange={(e) => 
                        updateTokenConfig(index, { maxAmount: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.autoSwap}
                    onCheckedChange={(checked) => 
                      updateTokenConfig(index, { autoSwap: checked })
                    }
                  />
                  <label className="text-sm">Auto-Swap a {config.targetToken}</label>
                </div>
              </div>
            ))}
          </div>

          {/* Límites Diarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Límites Diarios</h3>
            {dailyLimits.map((limit) => (
              <div key={limit.token} className="space-y-2">
                <label className="text-sm">{limit.token}</label>
                <Input
                  type="number"
                  value={limit.amount}
                  onChange={(e) => 
                    updateDailyLimit(limit.token, parseFloat(e.target.value))
                  }
                />
              </div>
            ))}
          </div>

          {/* Slippage */}
          <div className="space-y-2">
            <label className="text-sm">Slippage Máximo (%)</label>
            <Input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
            />
          </div>

          <Button 
            className="w-full"
            onClick={saveSettings}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 