import { PublicKey } from '@solana/web3.js';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

export interface TokenAmount {
  token: Token;
  amount: number;
  uiAmount: number;
}

export interface TokenSwap {
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
  route?: Token[];
  fee?: number;
}

export interface TokenPrice {
  token: Token;
  price: number;
  timestamp: number;
  change24h: number;
}

export interface TokenBalance {
  token: Token;
  balance: number;
  value: number;
  change24h: number;
  allocation: number;
} 