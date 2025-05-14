import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import { JupiterService } from './JupiterService';
import { RaydiumService } from './RaydiumService';
import { LoggerService } from '../logger/LoggerService';
import { NotificationService } from '../notifications/NotificationService';
import { Token } from '@/types/token';

interface SwapRoute {
  dex: 'jupiter' | 'raydium';
  price: number;
  slippage: number;
  route: any; // Tipo específico según el DEX
}

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class SwapOptimizationService {
  private static instance: SwapOptimizationService;
  private jupiterService: JupiterService;
  private raydiumService: RaydiumService;
  private logger: LoggerService;
  private notificationService: NotificationService;
  private connection: Connection;

  private constructor(connection: Connection) {
    this.connection = connection;
    this.jupiterService = JupiterService.getInstance();
    this.raydiumService = RaydiumService.getInstance();
    this.logger = LoggerService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  public static getInstance(connection: Connection): SwapOptimizationService {
    if (!SwapOptimizationService.instance) {
      SwapOptimizationService.instance = new SwapOptimizationService(connection);
    }
    return SwapOptimizationService.instance;
  }

  public async findBestRoute(
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number
  ): Promise<SwapRoute> {
    try {
      // Obtener quotes de ambos DEXs
      const [jupiterQuote, raydiumQuote] = await Promise.all([
        this.jupiterService.getQuote(fromToken, toToken, amount, slippage),
        this.raydiumService.getQuote(fromToken, toToken, amount, slippage)
      ]);

      // Comparar precios y seleccionar la mejor ruta
      const jupiterPrice = jupiterQuote.outAmount / jupiterQuote.inAmount;
      const raydiumPrice = raydiumQuote.outAmount / raydiumQuote.inAmount;

      if (jupiterPrice > raydiumPrice) {
        return {
          dex: 'jupiter',
          price: jupiterPrice,
          slippage: jupiterQuote.priceImpact,
          route: jupiterQuote
        };
      } else {
        return {
          dex: 'raydium',
          price: raydiumPrice,
          slippage: raydiumQuote.priceImpact,
          route: raydiumQuote
        };
      }
    } catch (error) {
      this.logger.error('Error al encontrar la mejor ruta:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  public async executeSwapWithRetry(
    route: SwapRoute,
    wallet: PublicKey,
    retryConfig: RetryConfig
  ): Promise<string> {
    let lastError: Error | null = null;
    let delay = retryConfig.initialDelay;

    for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
      try {
        const transaction = await this.executeSwap(route, wallet);
        return transaction;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(`Intento ${attempt + 1} fallido:`, error instanceof Error ? error.message : String(error));

        if (attempt < retryConfig.maxRetries - 1) {
          await this.sleep(delay);
          delay = Math.min(delay * retryConfig.backoffFactor, retryConfig.maxDelay);
        }
      }
    }

    await this.notificationService.sendNotification(
      'error',
      'Error en Swap',
      `No se pudo completar el swap después de ${retryConfig.maxRetries} intentos`,
      { error: lastError?.message }
    );

    throw lastError;
  }

  private async executeSwap(route: SwapRoute, wallet: PublicKey): Promise<string> {
    try {
      let transaction: VersionedTransaction;
      
      if (route.dex === 'jupiter') {
        transaction = await this.jupiterService.executeSwap(route.route, wallet);
      } else {
        transaction = await this.raydiumService.executeSwap(route.route, wallet);
      }

      const signature = await this.connection.sendTransaction(transaction);
      await this.connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      this.logger.error('Error al ejecutar swap:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async handleNetworkError(error: Error): Promise<void> {
    this.logger.error('Error de red:', error.message);
    
    // Verificar el estado de la red
    try {
      await this.connection.getRecentBlockhash();
    } catch (networkError) {
      const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
      await this.notificationService.sendNotification(
        'error',
        'Error de Red',
        'Problemas de conectividad con la red Solana',
        { error: errorMessage }
      );
    }
  }
} 