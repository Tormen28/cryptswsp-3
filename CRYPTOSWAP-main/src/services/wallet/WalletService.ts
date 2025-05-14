import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { LoggerService } from '../logging/LoggerService';
import { NetworkMonitor } from '../network/NetworkMonitor';

export type WalletType = 'phantom' | 'solflare' | 'solana-mobile';

export interface WalletInfo {
  publicKey: PublicKey;
  connected: boolean;
  type: WalletType;
}

export class WalletService {
  private static instance: WalletService;
  private readonly logger: LoggerService;
  private readonly networkMonitor: NetworkMonitor;
  private currentWallet: WalletInfo | null = null;
  private connection: Connection;
  private transferSubscription: number | null = null;

  private constructor(endpoint: string) {
    this.logger = LoggerService.getInstance();
    this.networkMonitor = NetworkMonitor.getInstance(endpoint);
    this.connection = new Connection(endpoint, 'confirmed');
  }

  static getInstance(endpoint: string): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService(endpoint);
    }
    return WalletService.instance;
  }

  async connectWallet(type: WalletType): Promise<WalletInfo> {
    try {
      let wallet: any;

      switch (type) {
        case 'phantom':
          wallet = window?.solana;
          break;
        case 'solflare':
          wallet = window?.solflare;
          break;
        case 'solana-mobile':
          // Implementar integración con Solana Mobile Stack
          throw new Error('Solana Mobile Stack no implementado aún');
        default:
          throw new Error('Tipo de wallet no soportado');
      }

      if (!wallet) {
        throw new Error(`Wallet ${type} no encontrada`);
      }

      const response = await wallet.connect();
      const publicKey = new PublicKey(response.publicKey);

      this.currentWallet = {
        publicKey,
        connected: true,
        type
      };

      await this.logger.log(
        'info',
        'Wallet conectada exitosamente',
        'WalletService',
        { type, publicKey: publicKey.toString() }
      );

      // Iniciar monitoreo de transferencias
      await this.startTransferMonitoring();

      console.log('wallet:', wallet);
      console.log('signTransaction:', response.signTransaction);

      return this.currentWallet;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al conectar wallet',
        'WalletService',
        { type, error }
      );
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    try {
      if (!this.currentWallet) {
        return;
      }

      const wallet = this.getWalletInstance();
      await wallet.disconnect();

      // Detener monitoreo de transferencias
      await this.stopTransferMonitoring();

      this.currentWallet = null;

      await this.logger.log(
        'info',
        'Wallet desconectada exitosamente',
        'WalletService'
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al desconectar wallet',
        'WalletService',
        { error }
      );
      throw error;
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      if (!this.currentWallet) {
        throw new Error('No hay wallet conectada');
      }

      const wallet = this.getWalletInstance();
      const signedTransaction = await wallet.signTransaction(transaction);

      await this.logger.log(
        'info',
        'Transacción firmada exitosamente',
        'WalletService',
        { transactionId: transaction.signature?.toString() }
      );

      return signedTransaction;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al firmar transacción',
        'WalletService',
        { error }
      );
      throw error;
    }
  }

  private getWalletInstance(): any {
    if (!this.currentWallet) {
      throw new Error('No hay wallet conectada');
    }

    switch (this.currentWallet.type) {
      case 'phantom':
        return window?.solana;
      case 'solflare':
        return window?.solflare;
      default:
        throw new Error('Tipo de wallet no soportado');
    }
  }

  private async startTransferMonitoring(): Promise<void> {
    if (!this.currentWallet || this.transferSubscription) {
      return;
    }

    try {
      this.transferSubscription = this.connection.onAccountChange(
        this.currentWallet.publicKey,
        async (accountInfo) => {
          // Implementar lógica de monitoreo de transferencias
          await this.handleTransfer(accountInfo);
        },
        'confirmed'
      );

      await this.logger.log(
        'info',
        'Monitoreo de transferencias iniciado',
        'WalletService',
        { publicKey: this.currentWallet.publicKey.toString() }
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al iniciar monitoreo de transferencias',
        'WalletService',
        { error }
      );
    }
  }

  private async stopTransferMonitoring(): Promise<void> {
    if (this.transferSubscription) {
      try {
        await this.connection.removeAccountChangeListener(this.transferSubscription);
        this.transferSubscription = null;

        await this.logger.log(
          'info',
          'Monitoreo de transferencias detenido',
          'WalletService'
        );
      } catch (error) {
        await this.logger.log(
          'error',
          'Error al detener monitoreo de transferencias',
          'WalletService',
          { error }
        );
      }
    }
  }

  private async handleTransfer(accountInfo: any): Promise<void> {
    // TODO: Implementar lógica de manejo de transferencias
    // 1. Verificar si es una transferencia de tokens configurados
    // 2. Calcular monto y token
    // 3. Notificar al sistema de auto-swap
    console.log('Nueva transferencia detectada:', accountInfo);
  }

  getCurrentWallet(): WalletInfo | null {
    return this.currentWallet;
  }

  isConnected(): boolean {
    return this.currentWallet?.connected || false;
  }
} 