import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, ButtonProps } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

const TOKENS = [
  { symbol: 'SOL', label: 'Solana' },
  { symbol: 'BONK', label: 'Bonk' },
  { symbol: 'USDT', label: 'Tether' },
];

const STABLECOINS = [
  { symbol: 'USDC', label: 'USD Coin' },
  { symbol: 'USDT', label: 'Tether' },
];

export function AutoSwap() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedTokens, setSelectedTokens] = useState<string[]>(['SOL']);
  const [destination, setDestination] = useState<string>('USDC');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [saving, setSaving] = useState<boolean>(false);

  const handleTokenChange = (token: string) => {
    setSelectedTokens((prev) =>
      prev.includes(token)
        ? prev.filter((t) => t !== token)
        : [...prev, token]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // Aquí guardarías la configuración en backend o localStorage
    setTimeout(() => setSaving(false), 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Swap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="font-medium">{t('auto_swap')}</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('tokens_to_convert')}</label>
          <div className="flex gap-2 flex-wrap">
            {TOKENS.map((token) => (
              <Button
                key={token.symbol}
                onClick={() => handleTokenChange(token.symbol)}
                className={
                  (selectedTokens.includes(token.symbol)
                    ? 'bg-primary text-white border border-primary'
                    : 'bg-background text-foreground border border-input') +
                  ' h-9 px-3 text-sm'
                }
              >
                {token.symbol}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('destination_stablecoin')}</label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STABLECOINS.map((coin) => (
                <SelectItem key={coin.symbol} value={coin.symbol}>
                  {coin.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('slippage')}</label>
          <Input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            min={0.1}
            max={100}
            step={0.1}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground ml-2">%</span>
        </div>
        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? t('saving') : t('save')}
        </Button>
      </CardContent>
    </Card>
  );
} 