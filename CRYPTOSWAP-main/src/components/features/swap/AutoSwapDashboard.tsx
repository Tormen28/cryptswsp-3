import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Tab, Tabs } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useTranslation } from 'react-i18next';
import { AutoSwapConfig } from './AutoSwapConfig';
import { PerformanceChart } from './PerformanceChart';
import { FundStatus } from './FundStatus';
import { PushNotifications } from '../notifications/PushNotifications';
import { Token } from '@/types/token';
import { PerformanceData, PerformanceChartProps } from '@/types/performance';
import { AutoSwapConfig as AutoSwapConfigType } from '@/types/autoSwap';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const AutoSwapDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [fundData, setFundData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar tokens disponibles
        const tokens = await fetchAvailableTokens();
        setAvailableTokens(tokens);

        // Cargar datos de rendimiento
        const perfData = await fetchPerformanceData();
        setPerformanceData(perfData);

        // Cargar datos del fondo
        const fund = await fetchFundData();
        setFundData(fund);

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const chartProps: Omit<PerformanceChartProps, 'type'> = {
    data: performanceData,
    timeframe: '7d',
    loading
  };

  const defaultConfig: AutoSwapConfigType = {
    enabled: true,
    fromTokens: [],
    toToken: availableTokens[0] || {
      address: '',
      symbol: '',
      name: '',
      decimals: 0
    },
    slippage: 0.5,
    dailyLimit: 1000,
    monthlyLimit: 10000,
    minAmount: 10,
    maxAmount: 100,
    priceAlerts: []
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('autoSwap.dashboard.title')}
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={t('autoSwap.dashboard.tabs.overview')} />
            <Tab label={t('autoSwap.dashboard.tabs.config')} />
            <Tab label={t('autoSwap.dashboard.tabs.performance')} />
            <Tab label={t('autoSwap.dashboard.tabs.funds')} />
            <Tab label={t('autoSwap.dashboard.tabs.notifications')} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <PerformanceChart
                {...chartProps}
                type="profit"
              />
            </Grid>
            <Grid xs={12} md={6}>
              <FundStatus
                tokens={fundData}
                totalValue={fundData.reduce((acc, token) => acc + token.value, 0)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <AutoSwapConfig
            config={defaultConfig}
            availableTokens={availableTokens}
            loading={loading}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid xs={12}>
              <PerformanceChart
                {...chartProps}
                type="volume"
              />
            </Grid>
            <Grid xs={12}>
              <PerformanceChart
                {...chartProps}
                type="price"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <FundStatus
            tokens={fundData}
            totalValue={fundData.reduce((acc, token) => acc + token.value, 0)}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <PushNotifications />
        </TabPanel>
      </Box>
    </Container>
  );
};

// Funciones auxiliares para cargar datos
async function fetchAvailableTokens(): Promise<Token[]> {
  // Implementar lógica para cargar tokens
  return [];
}

async function fetchPerformanceData(): Promise<PerformanceData[]> {
  // Implementar lógica para cargar datos de rendimiento
  return [];
}

async function fetchFundData(): Promise<any[]> {
  // Implementar lógica para cargar datos del fondo
  return [];
} 