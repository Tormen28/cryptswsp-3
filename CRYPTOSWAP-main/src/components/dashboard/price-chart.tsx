'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';

interface PriceData {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  symbol: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
}

export function PriceChart({ symbol, timeframe }: PriceChartProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchPriceData = async () => {
      try {
        // Aquí deberías implementar la llamada a tu API de precios
        // Este es un ejemplo con datos simulados
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (i * 3600000),
          price: 100 + Math.random() * 10
        })).reverse();
        
        setData(mockData);
      } catch (error) {
        console.error('Error fetching price data:', error);
      }
    };

    fetchPriceData();
    const interval = setInterval(fetchPriceData, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const formatXAxis = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Precio de {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatXAxis}
                stroke={theme === 'dark' ? '#fff' : '#000'}
              />
              <YAxis 
                stroke={theme === 'dark' ? '#fff' : '#000'}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 