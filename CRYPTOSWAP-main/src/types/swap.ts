import { PublicKey } from '@solana/web3.js';

export interface SwapParams {
  fromToken: PublicKey;
  toToken: PublicKey;
  amount: number;
  slippage: number;
}

export interface SwapQuote {
  expectedOutput: number;
  priceImpact: number;
  fee: number;
  minimumReceived: number;
  route: string[];
}

export interface SwapResult {
  signature: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  timestamp: number;
}

export interface TokenInfo {
  decimals: number;
  symbol: string;
  balance: number;
} 