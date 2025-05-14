import { Connection, PublicKey } from '@solana/web3.js';
import { LoggerService } from '../logging/LoggerService';

export interface NetworkStatus {
  isOnline: boolean;
  latency: number;
  lastBlockHeight: number;
  lastUpdate: number;
}

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private readonly connection: Connection;
  private readonly logger: LoggerService;
  private status: NetworkStatus;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly checkIntervalMs: number = 30000; // 30 segundos

  private constructor(endpoint: string) {
    this.connection = new Connection(endpoint, 'confirmed');
    this.logger = LoggerService.getInstance();
    this.status = {
      isOnline: false,
      latency: 0,
      lastBlockHeight: 0,
      lastUpdate: 0
    };
  }

  static getInstance(endpoint: string): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor(endpoint);
    }
    return NetworkMonitor.instance;
  }

  async startMonitoring(): Promise<void> {
    if (this.checkInterval) {
      return;
    }

    await this.checkNetworkStatus();
    this.checkInterval = setInterval(
      () => this.checkNetworkStatus(),
      this.checkIntervalMs
    );
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async checkNetworkStatus(): Promise<void> {
    try {
      const startTime = Date.now();
      const blockHeight = await this.connection.getBlockHeight();
      const latency = Date.now() - startTime;

      const newStatus: NetworkStatus = {
        isOnline: true,
        latency,
        lastBlockHeight: blockHeight,
        lastUpdate: Date.now()
      };

      // Validar cambios significativos
      if (this.hasSignificantChanges(newStatus)) {
        await this.logger.log(
          'warning',
          'Cambios significativos en el estado de la red',
          'NetworkMonitor',
          { oldStatus: this.status, newStatus }
        );
      }

      this.status = newStatus;
    } catch (error) {
      this.status.isOnline = false;
      await this.logger.log(
        'error',
        'Error al verificar estado de la red',
        'NetworkMonitor',
        { error }
      );
    }
  }

  private hasSignificantChanges(newStatus: NetworkStatus): boolean {
    const latencyThreshold = 1000; // 1 segundo
    const blockHeightThreshold = 5;

    return (
      Math.abs(newStatus.latency - this.status.latency) > latencyThreshold ||
      Math.abs(newStatus.lastBlockHeight - this.status.lastBlockHeight) > blockHeightThreshold
    );
  }

  async validateTransaction(transactionId: string): Promise<boolean> {
    try {
      const signature = new PublicKey(transactionId);
      const status = await this.connection.getSignatureStatus(signature.toString());
      
      if (!status.value) {
        await this.logger.log(
          'warning',
          'Transacción no encontrada',
          'NetworkMonitor',
          { transactionId }
        );
        return false;
      }

      if (status.value.err) {
        await this.logger.log(
          'error',
          'Transacción fallida',
          'NetworkMonitor',
          { transactionId, error: status.value.err }
        );
        return false;
      }

      return true;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al validar transacción',
        'NetworkMonitor',
        { transactionId, error }
      );
      return false;
    }
  }

  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  async checkEndpointHealth(): Promise<boolean> {
    try {
      await this.connection.getVersion();
      return true;
    } catch (error) {
      await this.logger.log(
        'error',
        'Endpoint no responde',
        'NetworkMonitor',
        { error }
      );
      return false;
    }
  }
} 