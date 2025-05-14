import { LoggerService } from '../logging/LoggerService';
import { NotificationService } from '../notifications/NotificationService';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export class RetryService {
  private static instance: RetryService;
  private readonly logger: LoggerService;
  private readonly notificationService: NotificationService;
  private readonly defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          await this.logger.log(
            'info',
            `Operación exitosa después de ${attempt} intentos`,
            'RetryService',
            { operationName, attempt }
          );
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        const delay = this.calculateDelay(attempt, finalConfig);

        await this.logger.log(
          'warning',
          `Intento ${attempt} fallido, reintentando en ${delay}ms`,
          'RetryService',
          { operationName, error, attempt }
        );

        if (attempt < finalConfig.maxRetries) {
          await this.notificationService.sendNotification(
            'warning',
            'Reintentando Operación',
            `El intento ${attempt} de ${operationName} falló, reintentando...`,
            { error: lastError.message }
          );
          await this.sleep(delay);
        }
      }
    }

    await this.notificationService.sendNotification(
      'error',
      'Operación Fallida',
      `La operación ${operationName} falló después de ${finalConfig.maxRetries} intentos`,
      { error: lastError?.message }
    );

    throw new Error(
      `La operación ${operationName} falló después de ${finalConfig.maxRetries} intentos: ${lastError?.message}`
    );
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffFactor, attempt - 1),
      config.maxDelay
    );
    return delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async handleError(error: Error, context: string): Promise<void> {
    await this.logger.log(
      'error',
      `Error en ${context}`,
      'RetryService',
      { error }
    );

    await this.notificationService.sendNotification(
      'error',
      'Error',
      `Ha ocurrido un error en ${context}`,
      { error: error.message }
    );
  }
} 