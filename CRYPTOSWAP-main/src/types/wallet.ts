import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface Wallet {
  publicKey: PublicKey | null;
  connected: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  signVersionedTransaction: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
  disconnect: () => Promise<void>;
} 