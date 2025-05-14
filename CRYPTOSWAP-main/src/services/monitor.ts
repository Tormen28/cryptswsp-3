import { Connection, PublicKey, VersionedTransactionResponse } from '@solana/web3.js';
import { WEBSOCKET_ENDPOINTS, getConnection } from '../lib/solana-config';

export interface TransactionCallback {
  (transaction: VersionedTransactionResponse): void;
}

export class TransactionMonitor {
  private connection: Connection;
  private subscriptionId: number | null = null;
  private network: 'mainnet' | 'devnet' | 'testnet';

  constructor(network: 'mainnet' | 'devnet' | 'testnet' = 'devnet') {
    this.network = network;
    this.connection = getConnection(network);
  }

  async startMonitoring(walletAddress: string, callback: TransactionCallback) {
    try {
      const publicKey = new PublicKey(walletAddress);
      // Monitorear cambios en la cuenta
      this.subscriptionId = this.connection.onAccountChange(
        publicKey,
        async (accountInfo: any) => {
          // Obtener las últimas transacciones
          const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit: 1 });
          if (signatures.length > 0) {
            const tx = await this.connection.getTransaction(signatures[0].signature, {
              maxSupportedTransactionVersion: 0
            });
            if (tx) {
              callback(tx);
            }
          }
        },
        'confirmed'
      );
      console.log(`Monitoreo iniciado para la wallet: ${walletAddress}`);
    } catch (error) {
      console.error('Error al iniciar el monitoreo:', error);
      throw error;
    }
  }

  stopMonitoring() {
    if (this.subscriptionId) {
      this.connection.removeAccountChangeListener(this.subscriptionId);
      this.subscriptionId = null;
      console.log('Monitoreo detenido');
    }
  }

  async getRecentTransactions(walletAddress: string, limit: number = 10) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, { limit });
      const transactions = await Promise.all(
        signatures.map(async (sig: any) => {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          return tx;
        })
      );
      return transactions.filter((tx: any) => tx !== null);
    } catch (error) {
      console.error('Error al obtener transacciones recientes:', error);
      throw error;
    }
  }
} 