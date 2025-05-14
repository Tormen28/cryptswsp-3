import { Connection, PublicKey } from '@solana/web3.js';
import { Transaction } from '@/types/autoSwap';

export class TransactionMonitor {
  private connection: Connection;
  private callback: (tx: Transaction) => void;
  private subscriptionId: number | null = null;

  constructor(rpcEndpoint: string, callback: (tx: Transaction) => void) {
    this.connection = new Connection(rpcEndpoint);
    this.callback = callback;
  }

  async startMonitoring(walletAddress: PublicKey) {
    if (this.subscriptionId !== null) {
      return;
    }

    try {
      this.subscriptionId = this.connection.onAccountChange(
        walletAddress,
        async (accountInfo) => {
          // TODO: Implementar lógica para detectar transacciones entrantes
          // y convertirlas en objetos Transaction
          const tx: Transaction = {
            fromToken: {
              address: new PublicKey(''),
              symbol: '',
              decimals: 0
            },
            toToken: {
              address: new PublicKey(''),
              symbol: '',
              decimals: 0
            },
            fromAmount: 0,
            toAmount: 0,
            priceImpact: 0
          };
          this.callback(tx);
        },
        'confirmed'
      );
    } catch (error) {
      console.error('Error al iniciar monitoreo:', error);
      throw error;
    }
  }

  stopMonitoring() {
    if (this.subscriptionId !== null) {
      this.connection.removeAccountChangeListener(this.subscriptionId);
      this.subscriptionId = null;
    }
  }
} 