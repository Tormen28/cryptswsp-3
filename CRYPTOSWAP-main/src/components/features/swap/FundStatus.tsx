import React from 'react';
import {
  Card,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from 'react-i18next';
import { TokenBalance } from '@/types/token';

interface FundStatusProps {
  tokens: TokenBalance[];
  totalValue: number;
}

export const FundStatus: React.FC<FundStatusProps> = ({ tokens, totalValue }) => {
  const { t } = useTranslation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'error';
    return 'default';
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('fundStatus.title')}
      </Typography>

      <Typography variant="h4" gutterBottom>
        {formatCurrency(totalValue)}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {tokens.map((token) => (
          <Grid xs={12} md={6} key={token.token.address}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">
                {token.token.symbol}
              </Typography>
              <Typography variant="h6">
                {formatCurrency(token.value)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={token.allocation}
                sx={{ my: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatPercentage(token.allocation)} del total
              </Typography>
              <Chip
                label={`${token.change24h > 0 ? '+' : ''}${token.change24h}%`}
                color={getChangeColor(token.change24h)}
                size="small"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('fundStatus.table.token')}</TableCell>
              <TableCell align="right">{t('fundStatus.table.balance')}</TableCell>
              <TableCell align="right">{t('fundStatus.table.value')}</TableCell>
              <TableCell align="right">{t('fundStatus.table.change24h')}</TableCell>
              <TableCell align="right">{t('fundStatus.table.allocation')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.token.address}>
                <TableCell component="th" scope="row">
                  {token.token.symbol}
                </TableCell>
                <TableCell align="right">
                  {token.balance.toFixed(token.token.decimals)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(token.value)}
                </TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${token.change24h > 0 ? '+' : ''}${token.change24h}%`}
                    color={getChangeColor(token.change24h)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {formatPercentage(token.allocation)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}; 