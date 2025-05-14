import { Connection } from '@solana/web3.js';

export const SOLANA_RPC_ENDPOINTS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com'
};

export const WEBSOCKET_ENDPOINTS = {
  mainnet: 'wss://api.mainnet-beta.solana.com',
  devnet: 'wss://api.devnet.solana.com',
  testnet: 'wss://api.testnet.solana.com'
};

export const getConnection = (network: 'mainnet' | 'devnet' | 'testnet' = 'devnet') => {
  return new Connection(SOLANA_RPC_ENDPOINTS[network], 'confirmed');
};

export const TOKEN_CONFIGS = {
  USDC: {
    address: 'BXXkv6zrcyG9rGzjY6Kf5p1trf6uJ6hWcJb6j8b6PSeQ',
    decimals: 6,
    symbol: 'USDC'
  },
  USDT: {
    address: 'BQvGz5Qn2ATqNnSboh6vKQwQ6r5y6vKQwQ6r5y6vKQwQ',
    decimals: 6,
    symbol: 'USDT'
  },
  SOL: {
    address: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    symbol: 'SOL'
  }
}; 