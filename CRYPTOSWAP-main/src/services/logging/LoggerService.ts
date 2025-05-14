import { SecureStorage } from '../storage/SecureStorage';

export type LogLevel = 'info' | 'warning' | 'error' | 'security';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  details?: any;
  source: string;
}

export class LoggerService {
  private static instance: LoggerService;
  private readonly storage: SecureStorage;
  private readonly rateLimits: Map<string, { count: number; timestamp: number }>;
  private readonly maxLogs: number = 1000;
  private readonly rateLimitWindow: number = 60000; // 1 minuto
  private readonly maxRequestsPerWindow: number = 100;

  private constructor() {
    this.storage = SecureStorage.getInstance();
    this.rateLimits = new Map();
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private async checkRateLimit(source: string): Promise<boolean> {
    const now = Date.now();
    const limit = this.rateLimits.get(source);

    if (!limit) {
      this.rateLimits.set(source, { count: 1, timestamp: now });
      return true;
    }

    if (now - limit.timestamp > this.rateLimitWindow) {
      this.rateLimits.set(source, { count: 1, timestamp: now });
      return true;
    }

    if (limit.count >= this.maxRequestsPerWindow) {
      return false;
    }

    limit.count++;
    return true;
  }

  private async rotateLogs(): Promise<void> {
    try {
      const logs = await this.storage.getItem<LogEntry[]>('logs') || [];
      if (logs.length > this.maxLogs) {
        const newLogs = logs.slice(-this.maxLogs);
        await this.storage.setItem('logs', newLogs);
      }
    } catch (error) {
      console.error('Error al rotar logs:', error);
    }
  }

  async log(level: LogLevel, message: string, source: string, details?: any): Promise<void> {
    try {
      if (!await this.checkRateLimit(source)) {
        console.warn(`Rate limit excedido para ${source}`);
        return;
      }

      const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        message,
        details,
        source
      };

      const logs = await this.storage.getItem<LogEntry[]>('logs') || [];
      logs.push(entry);
      await this.storage.setItem('logs', logs);
      await this.rotateLogs();

      // Enviar a servicio de monitoreo en producción
      if (process.env.NODE_ENV === 'production') {
        await this.sendToMonitoring(entry);
      }
    } catch (error) {
      console.error('Error al registrar log:', error);
    }
  }

  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    // TODO: Implementar envío a servicio de monitoreo
    console.log('Enviando a monitoreo:', entry);
  }

  async getLogs(
    level?: LogLevel,
    source?: string,
    startTime?: number,
    endTime?: number
  ): Promise<LogEntry[]> {
    try {
      const logs = await this.storage.getItem<LogEntry[]>('logs') || [];
      return logs.filter(log => {
        if (level && log.level !== level) return false;
        if (source && log.source !== source) return false;
        if (startTime && log.timestamp < startTime) return false;
        if (endTime && log.timestamp > endTime) return false;
        return true;
      });
    } catch (error) {
      console.error('Error al obtener logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      await this.storage.setItem('logs', []);
    } catch (error) {
      console.error('Error al limpiar logs:', error);
    }
  }
} 