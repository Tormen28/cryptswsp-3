import { PublicKey } from '@solana/web3.js';
import { Token } from './token';

export interface PriceAlert {
  token: Token;
  price: number;
  condition: 'above' | 'below';
}

export interface AutoSwapConfig {
  enabled: boolean;
  fromTokens: Token[];
  toToken: Token;
  slippage: number;
  dailyLimit: number;
  monthlyLimit: number;
  minAmount: number;
  maxAmount: number;
  priceAlerts: PriceAlert[];
}

export interface Transaction {
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
  txHash?: string;
  error?: string;
} 