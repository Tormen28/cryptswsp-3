import { LoggerService } from '../logging/LoggerService';
import { NotificationService } from '../notifications/NotificationService';
import { SecureStorage } from '../storage/SecureStorage';
import { Token } from '@/types/token';

interface DailyLimit {
  date: string;
  amount: number;
}

interface MonthlyLimit {
  month: string;
  amount: number;
}

export class LimitService {
  private static instance: LimitService;
  private readonly logger: LoggerService;
  private readonly notificationService: NotificationService;
  private readonly storage: SecureStorage;
  private readonly DAILY_LIMIT_KEY = 'daily_limits';
  private readonly MONTHLY_LIMIT_KEY = 'monthly_limits';

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.storage = SecureStorage.getInstance();
  }

  static getInstance(): LimitService {
    if (!LimitService.instance) {
      LimitService.instance = new LimitService();
    }
    return LimitService.instance;
  }

  async checkLimits(
    amount: number,
    token: Token,
    dailyLimit: number,
    monthlyLimit: number
  ): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7);

      const dailyLimits = await this.getDailyLimits();
      const monthlyLimits = await this.getMonthlyLimits();

      const todayLimit = dailyLimits.find(limit => limit.date === today) || { date: today, amount: 0 };
      const monthLimit = monthlyLimits.find(limit => limit.month === currentMonth) || { month: currentMonth, amount: 0 };

      if (todayLimit.amount + amount > dailyLimit) {
        await this.notificationService.sendNotification(
          'warning',
          'Límite Diario Excedido',
          `Has alcanzado el límite diario de ${dailyLimit} ${token.symbol}`
        );
        return false;
      }

      if (monthLimit.amount + amount > monthlyLimit) {
        await this.notificationService.sendNotification(
          'warning',
          'Límite Mensual Excedido',
          `Has alcanzado el límite mensual de ${monthlyLimit} ${token.symbol}`
        );
        return false;
      }

      return true;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al verificar límites',
        'LimitService',
        { error, amount, token }
      );
      throw error;
    }
  }

  async updateLimits(amount: number, token: Token): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7);

      const dailyLimits = await this.getDailyLimits();
      const monthlyLimits = await this.getMonthlyLimits();

      const todayLimitIndex = dailyLimits.findIndex(limit => limit.date === today);
      const monthLimitIndex = monthlyLimits.findIndex(limit => limit.month === currentMonth);

      if (todayLimitIndex >= 0) {
        dailyLimits[todayLimitIndex].amount += amount;
      } else {
        dailyLimits.push({ date: today, amount });
      }

      if (monthLimitIndex >= 0) {
        monthlyLimits[monthLimitIndex].amount += amount;
      } else {
        monthlyLimits.push({ month: currentMonth, amount });
      }

      await this.storage.setItem(this.DAILY_LIMIT_KEY, JSON.stringify(dailyLimits));
      await this.storage.setItem(this.MONTHLY_LIMIT_KEY, JSON.stringify(monthlyLimits));

      await this.logger.log(
        'info',
        'Límites actualizados',
        'LimitService',
        { amount, token, today, currentMonth }
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al actualizar límites',
        'LimitService',
        { error, amount, token }
      );
      throw error;
    }
  }

  private async getDailyLimits(): Promise<DailyLimit[]> {
    try {
      const limits = await this.storage.getItem(this.DAILY_LIMIT_KEY);
      return limits ? JSON.parse(limits as string) : [];
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al obtener límites diarios',
        'LimitService',
        { error }
      );
      return [];
    }
  }

  private async getMonthlyLimits(): Promise<MonthlyLimit[]> {
    try {
      const limits = await this.storage.getItem(this.MONTHLY_LIMIT_KEY);
      return limits ? JSON.parse(limits as string) : [];
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al obtener límites mensuales',
        'LimitService',
        { error }
      );
      return [];
    }
  }

  async resetLimits(): Promise<void> {
    try {
      await this.storage.removeItem(this.DAILY_LIMIT_KEY);
      await this.storage.removeItem(this.MONTHLY_LIMIT_KEY);
      
      await this.logger.log(
        'info',
        'Límites reseteados',
        'LimitService'
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al resetear límites',
        'LimitService',
        { error }
      );
      throw error;
    }
  }
} 