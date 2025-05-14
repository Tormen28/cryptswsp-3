import React, { useState } from 'react';
import {
  Card,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { PerformanceData, PerformanceChartProps } from '@/types/performance';

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  type,
  timeframe,
  loading
}) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState(timeframe);

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newTimeRange: string
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange as typeof timeframe);
    }
  };

  const formatValue = (value: number) => {
    switch (type) {
      case 'profit':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'volume':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact'
        }).format(value);
      case 'price':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        }).format(value);
      default:
        return value.toString();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case '24h':
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      case '7d':
        return date.toLocaleDateString('es-ES', {
          weekday: 'short',
          hour: '2-digit'
        });
      case '30d':
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short'
        });
      case '1y':
        return date.toLocaleDateString('es-ES', {
          month: 'short',
          year: '2-digit'
        });
      default:
        return date.toLocaleDateString('es-ES');
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case 'profit':
        return t('performance.profit.title');
      case 'volume':
        return t('performance.volume.title');
      case 'price':
        return t('performance.price.title');
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {getChartTitle()}
        </Typography>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
        >
          <ToggleButton value="24h">24h</ToggleButton>
          <ToggleButton value="7d">7d</ToggleButton>
          <ToggleButton value="30d">30d</ToggleButton>
          <ToggleButton value="1y">1y</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatValue}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [formatValue(value), t(`performance.${type}.label`)]}
              labelFormatter={formatTimestamp}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
}; 