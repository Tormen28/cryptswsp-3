import { PublicKey } from '@solana/web3.js';
import { Token } from './token';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  hash: string;
  status: TransactionStatus;
  timestamp: number;
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
  fee: number;
  route?: Token[];
  error?: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TransactionFilter {
  status?: TransactionStatus;
  fromToken?: PublicKey;
  toToken?: PublicKey;
  startDate?: number;
  endDate?: number;
  page?: number;
  pageSize?: number;
} 