/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="node" />

declare module '@solana/wallet-adapter-react' {
  export interface WalletContextState {
    publicKey: PublicKey | null;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  }

  export function useWallet(): WalletContextState;
}

declare module '@solana/spl-token' {
  export const TOKEN_PROGRAM_ID: PublicKey;
}

declare module 'react-i18next' {
  export function useTranslation(): {
    t: (key: string) => string;
  };
}

declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SOLANA_RPC_ENDPOINT?: string;
  }
}

/**
 * Tipos globales de la aplicación
 */

// Tipos de red
export type Network = 'mainnet-beta' | 'testnet' | 'devnet';

// Tipos de token
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

// Tipos de wallet
export interface WalletInfo {
  address: string;
  balance: number;
  tokens: Token[];
  network: Network;
}

// Tipos de transacción
export interface TransactionInfo {
  hash: string;
  from: string;
  to: string;
  amount: number;
  token: Token;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

// Tipos de configuración
export interface AppConfig {
  network: Network;
  rpcEndpoint: string;
  defaultToken: Token;
  language: string;
  theme: 'light' | 'dark';
}

declare global {
  interface Window {
    solflare?: any;
    solana?: any;
    // Agrega aquí otras wallets si las usas
  }
}

export {}; 