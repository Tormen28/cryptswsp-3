import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Slider,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Stack
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Token } from '@/types/token';
import { AutoSwapConfig as AutoSwapConfigType, PriceAlert } from '@/types/autoSwap';
import { TokenSelector } from '@/components/common/TokenSelector';

interface Props {
  config: AutoSwapConfigType;
  onConfigUpdate: (config: Partial<AutoSwapConfigType>) => Promise<void>;
  availableTokens: Token[];
  loading?: boolean;
}

export const AutoSwapConfig: React.FC<Props> = ({
  config,
  onConfigUpdate,
  availableTokens,
  loading = false
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const handleSlippageChange = (event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    if (value < 0.1 || value > 5) {
      setError(t('config.slippage.error'));
    } else {
      setError(null);
    }
  };

  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    if (value < 0) {
      setError(t('config.limit.error'));
    } else {
      setError(null);
    }
  };

  const handleTokenSelection = (tokens: Token[]) => {
    onConfigUpdate({ fromTokens: tokens }).catch(setError);
  };

  const handleTargetTokenChange = (token: Token) => {
    onConfigUpdate({ toToken: token }).catch(setError);
  };

  const handleToggleEnabled = () => {
    onConfigUpdate({ enabled: !config.enabled }).catch(setError);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {t('autoSwap.configuration')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={handleToggleEnabled}
                  disabled={loading}
                />
              }
              label={t('autoSwap.enableAutoSwap')}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography gutterBottom>
                {t('autoSwap.fromTokens')}
              </Typography>
              <TokenSelector
                tokens={availableTokens}
                selectedTokens={config.fromTokens}
                onChange={handleTokenSelection}
                multiple
                disabled={loading}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography gutterBottom>
                {t('autoSwap.toToken')}
              </Typography>
              <TokenSelector
                tokens={availableTokens}
                selectedTokens={[config.toToken]}
                onChange={(tokens: Token[]) => handleTargetTokenChange(tokens[0])}
                disabled={loading}
              />
            </Box>
          </Box>

          <Box>
            <Typography gutterBottom>
              {t('autoSwap.slippage')}
            </Typography>
            <Slider
              value={config.slippage}
              onChange={handleSlippageChange}
              min={0.1}
              max={5}
              step={0.1}
              disabled={loading}
              marks={[
                { value: 0.1, label: '0.1%' },
                { value: 1, label: '1%' },
                { value: 2, label: '2%' },
                { value: 5, label: '5%' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                label={t('autoSwap.dailyLimit')}
                type="number"
                value={config.dailyLimit}
                onChange={handleLimitChange}
                fullWidth
                disabled={loading}
                InputProps={{
                  endAdornment: <Typography variant="caption">USD</Typography>
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }}>
              <TextField
                label={t('autoSwap.monthlyLimit')}
                type="number"
                value={config.monthlyLimit}
                onChange={handleLimitChange}
                fullWidth
                disabled={loading}
                InputProps={{
                  endAdornment: <Typography variant="caption">USD</Typography>
                }}
              />
            </Box>
          </Box>

          <Box>
            <Typography gutterBottom>
              {t('autoSwap.priceAlerts')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {config.priceAlerts.map((alert: PriceAlert, index: number) => (
                <Chip
                  key={index}
                  label={`${alert.token.symbol} ${alert.condition} ${alert.price}`}
                  onDelete={() => {
                    const newAlerts = [...config.priceAlerts];
                    newAlerts.splice(index, 1);
                    onConfigUpdate({ priceAlerts: newAlerts }).catch(setError);
                  }}
                  disabled={loading}
                />
              ))}
              <Button
                variant="outlined"
                size="small"
                onClick={() => {/* TODO: Implementar diálogo de nueva alerta */}}
                disabled={loading}
              >
                {t('autoSwap.addAlert')}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              disabled={loading || !!error}
            >
              {t('autoSwap.save')}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}; 