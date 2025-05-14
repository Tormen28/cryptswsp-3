import { Wallet } from '@/types/wallet';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { LoggerService } from '../logger/LoggerService';

export class WalletAdapterService {
  private static instance: WalletAdapterService;
  private adapters: Map<string, any>;
  private logger: LoggerService;

  private constructor() {
    this.adapters = new Map();
    this.logger = LoggerService.getInstance();
    this.initializeAdapters();
  }

  public static getInstance(): WalletAdapterService {
    if (!WalletAdapterService.instance) {
      WalletAdapterService.instance = new WalletAdapterService();
    }
    return WalletAdapterService.instance;
  }

  private initializeAdapters() {
    // Inicializar adaptadores
    this.adapters.set('phantom', new PhantomWalletAdapter());
    this.adapters.set('solflare', new SolflareWalletAdapter());
  }

  public async connectWallet(walletType: string): Promise<Wallet> {
    try {
      const adapter = this.adapters.get(walletType);
      if (!adapter) {
        throw new Error(`Wallet ${walletType} no soportada`);
      }

      await adapter.connect();
      this.logger.info(`Wallet ${walletType} conectada exitosamente`);

      return {
        publicKey: adapter.publicKey,
        connected: adapter.connected,
        signTransaction: adapter.signTransaction.bind(adapter),
        signAllTransactions: adapter.signAllTransactions.bind(adapter),
        signMessage: adapter.signMessage.bind(adapter),
        signVersionedTransaction: adapter.signVersionedTransaction.bind(adapter),
        disconnect: adapter.disconnect.bind(adapter)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al conectar wallet ${walletType}: ${errorMessage}`);
      throw error;
    }
  }

  public async disconnectWallet(walletType: string): Promise<void> {
    try {
      const adapter = this.adapters.get(walletType);
      if (adapter) {
        await adapter.disconnect();
        this.logger.info(`Wallet ${walletType} desconectada exitosamente`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al desconectar wallet ${walletType}: ${errorMessage}`);
      throw error;
    }
  }

  public getAvailableWallets(): string[] {
    return Array.from(this.adapters.keys());
  }
} 