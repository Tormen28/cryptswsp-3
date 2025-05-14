export interface PerformanceData {
  timestamp: number;
  value: number;
  type: 'profit' | 'volume' | 'price';
}

export interface PerformanceChartProps {
  data: PerformanceData[];
  type: 'profit' | 'volume' | 'price';
  timeframe: '24h' | '7d' | '30d' | '1y';
  loading: boolean;
} 