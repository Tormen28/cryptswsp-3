export class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public async log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: string,
    data?: any
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context,
      data
    };

    switch (level) {
      case 'info':
        console.info(logEntry);
        break;
      case 'warn':
        console.warn(logEntry);
        break;
      case 'error':
        console.error(logEntry);
        break;
      case 'debug':
        console.debug(logEntry);
        break;
    }
  }

  public info(message: string, context?: string, data?: any): Promise<void> {
    return this.log('info', message, context, data);
  }

  public warn(message: string, context?: string, data?: any): Promise<void> {
    return this.log('warn', message, context, data);
  }

  public error(message: string, context?: string, data?: any): Promise<void> {
    return this.log('error', message, context, data);
  }

  public debug(message: string, context?: string, data?: any): Promise<void> {
    return this.log('debug', message, context, data);
  }
} 