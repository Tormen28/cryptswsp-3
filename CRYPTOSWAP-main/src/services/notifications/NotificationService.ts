import { Transaction } from '@/types/autoSwap';
import { LoggerService } from '../logging/LoggerService';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private readonly logger: LoggerService;
  private notifications: Notification[] = [];
  private readonly maxNotifications: number = 100;

  private constructor() {
    this.logger = LoggerService.getInstance();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendNotification(
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    try {
      const notification: Notification = {
        id: this.generateNotificationId(),
        type,
        title,
        message,
        timestamp: Date.now(),
        read: false,
        data
      };

      this.notifications.unshift(notification);
      
      // Mantener límite de notificaciones
      if (this.notifications.length > this.maxNotifications) {
        this.notifications = this.notifications.slice(0, this.maxNotifications);
      }

      // Enviar notificación push si está disponible
      if (this.isPushSupported()) {
        await this.sendPushNotification(notification);
      }

      await this.logger.log(
        'info',
        'Notificación enviada',
        'NotificationService',
        { notification }
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al enviar notificación',
        'NotificationService',
        { error }
      );
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        await this.logger.log(
          'info',
          'Notificación marcada como leída',
          'NotificationService',
          { notificationId }
        );
      }
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al marcar notificación como leída',
        'NotificationService',
        { error }
      );
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      this.notifications.forEach(n => n.read = true);
      await this.logger.log(
        'info',
        'Todas las notificaciones marcadas como leídas',
        'NotificationService'
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al marcar todas las notificaciones como leídas',
        'NotificationService',
        { error }
      );
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      await this.logger.log(
        'info',
        'Notificación eliminada',
        'NotificationService',
        { notificationId }
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al eliminar notificación',
        'NotificationService',
        { error }
      );
    }
  }

  async clearNotifications(): Promise<void> {
    try {
      this.notifications = [];
      await this.logger.log(
        'info',
        'Todas las notificaciones eliminadas',
        'NotificationService'
      );
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al limpiar notificaciones',
        'NotificationService',
        { error }
      );
    }
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isPushSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      if (!this.isPushSupported()) {
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return;
      }

      const serviceWorker = await navigator.serviceWorker.ready;
      await serviceWorker.showNotification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
        badge: '/badge.png',
        data: notification.data
      });
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al enviar notificación push',
        'NotificationService',
        { error }
      );
    }
  }

  // Métodos específicos para transacciones
  notifyTransactionSuccess(tx: Transaction) {
    // TODO: Implementar notificación de éxito
    console.log('Transacción exitosa:', tx);
  }

  notifyTransactionError(tx: Transaction) {
    // TODO: Implementar notificación de error
    console.error('Error en transacción:', tx);
  }

  notifyLowBalance(token: string) {
    this.sendNotification('warning', 'Saldo Bajo', `Tu saldo de ${token} está por debajo del mínimo recomendado`);
  }

  notifyPriceAlert(tokenSymbol: string, currentPrice: number, threshold: number) {
    // TODO: Implementar notificación de alerta de precio
    console.log(`Alerta de precio para ${tokenSymbol}: ${currentPrice} (umbral: ${threshold})`);
  }

  // Métodos para compatibilidad con PushNotifications
  async registerPushSubscription(): Promise<void> {
    // Aquí puedes implementar la lógica real de suscripción push
    return Promise.resolve();
  }

  async unregisterPushSubscription(): Promise<void> {
    // Aquí puedes implementar la lógica real de desuscripción push
    return Promise.resolve();
  }
} 