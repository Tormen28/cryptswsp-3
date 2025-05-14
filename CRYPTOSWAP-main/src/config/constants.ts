export const TOKEN_CONFIG = {
  MAX_SLIPPAGE: 1, // 1%
  MIN_LIQUIDITY: 1000, // $1000 USD
  PRICE_IMPACT_THRESHOLD: 5, // 5%
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  MIN_AMOUNT: 0.1, // 0.1 tokens
  MAX_AMOUNT: 1000000, // 1M tokens
  DAILY_LIMIT: 10000, // $10k USD
  MONTHLY_LIMIT: 100000 // $100k USD
};

export const NETWORK_CONFIG = {
  RPC_ENDPOINT: 'https://api.mainnet-beta.solana.com',
  COMMITMENT: 'confirmed',
  CONFIRMATION_TIMEOUT: 60000 // 60 segundos
};

export const NOTIFICATION_CONFIG = {
  AUTO_CLOSE_DELAY: 5000, // 5 segundos
  MAX_NOTIFICATIONS: 5
}; 