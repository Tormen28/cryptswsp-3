import { PublicKey } from '@solana/web3.js';

export const TESTNET_CONFIG = {
  endpoint: 'https://api.testnet.solana.com',
  tokens: {
    USDC: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
    USDT: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    SOL: new PublicKey('So11111111111111111111111111111111111111112'),
    RAY: new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'),
    SRM: new PublicKey('SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt')
  },
  pools: {
    USDC_USDT: new PublicKey('HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ'),
    USDC_SOL: new PublicKey('58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2'),
    USDC_RAY: new PublicKey('6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeNbt7xWo1mXo'),
    USDC_SRM: new PublicKey('8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu')
  },
  limits: {
    minSwapAmount: 0.1,
    maxSwapAmount: 1000,
    defaultSlippage: 0.5,
    maxSlippage: 5,
    dailyLimit: 10000,
    monthlyLimit: 100000
  },
  monitoring: {
    priceUpdateInterval: 30000, // 30 segundos
    balanceCheckInterval: 60000, // 1 minuto
    transactionTimeout: 120000, // 2 minutos
    maxRetries: 3
  },
  notifications: {
    priceAlertThreshold: 5, // 5%
    lowBalanceThreshold: 10, // 10 USD
    maxNotifications: 100
  }
}; 