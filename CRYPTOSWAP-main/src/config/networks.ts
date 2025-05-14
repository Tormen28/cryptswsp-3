import { Cluster } from '@solana/web3.js';

export interface NetworkConfig {
  name: string;
  endpoint: string;
  cluster: Cluster;
  explorer: string;
  rpcEndpoint: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  'mainnet-beta': {
    name: 'Mainnet Beta',
    endpoint: 'https://api.mainnet-beta.solana.com',
    cluster: 'mainnet-beta',
    explorer: 'https://explorer.solana.com',
    rpcEndpoint: 'https://api.mainnet-beta.solana.com'
  },
  'testnet': {
    name: 'Testnet',
    endpoint: 'https://api.testnet.solana.com',
    cluster: 'testnet',
    explorer: 'https://explorer.solana.com/?cluster=testnet',
    rpcEndpoint: 'https://api.testnet.solana.com'
  },
  'devnet': {
    name: 'Devnet',
    endpoint: 'https://api.devnet.solana.com',
    cluster: 'devnet',
    explorer: 'https://explorer.solana.com/?cluster=devnet',
    rpcEndpoint: 'https://api.devnet.solana.com'
  }
} as const;

export const DEFAULT_NETWORK = 'devnet'; 