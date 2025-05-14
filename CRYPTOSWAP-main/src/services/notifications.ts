import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: number;
}

class NotificationService {
  private connection: Connection;
  private listeners: Map<string, (notification: Notification) => void>;
  private notifications: Notification[];

  constructor(endpoint: string) {
    this.connection = new Connection(endpoint);
    this.listeners = new Map();
    this.notifications = [];
  }

  // Suscribirse a notificaciones
  subscribe(callback: (notification: Notification) => void): string {
    const id = Math.random().toString(36).substring(7);
    this.listeners.set(id, callback);
    return id;
  }

  // Cancelar suscripción
  unsubscribe(id: string): void {
    this.listeners.delete(id);
  }

  // Enviar notificación
  notify(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const fullNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now()
    };

    this.notifications.push(fullNotification);
    this.listeners.forEach(callback => callback(fullNotification));
  }

  // Obtener historial de notificaciones
  getHistory(): Notification[] {
    return [...this.notifications];
  }

  // Monitorear transacciones de una wallet
  async monitorWallet(walletAddress: string): Promise<void> {
    try {
      const publicKey = new PublicKey(walletAddress);
      
      // Suscribirse a eventos de la cuenta
      this.connection.onAccountChange(
        publicKey,
        (accountInfo) => {
          // Aquí implementaremos la lógica para detectar cambios en el balance
          this.notify({
            type: 'info',
            message: 'Cambio detectado en el balance de la wallet'
          });
        },
        'confirmed'
      );

      // Suscribirse a eventos de tokens
      this.connection.onProgramAccountChange(
        TOKEN_PROGRAM_ID,
        (accountInfo) => {
          // Aquí implementaremos la lógica para detectar transferencias de tokens
          this.notify({
            type: 'info',
            message: 'Transferencia de tokens detectada'
          });
        },
        'confirmed'
      );
    } catch (error) {
      console.error('Error al monitorear wallet:', error);
      this.notify({
        type: 'error',
        message: 'Error al monitorear la wallet'
      });
    }
  }

  // Monitorear un token específico
  async monitorToken(tokenMint: string): Promise<void> {
    try {
      const mintPublicKey = new PublicKey(tokenMint);
      
      this.connection.onProgramAccountChange(
        TOKEN_PROGRAM_ID,
        (accountInfo) => {
          // Aquí implementaremos la lógica para detectar cambios en el token
          this.notify({
            type: 'info',
            message: 'Cambio detectado en el token'
          });
        },
        'confirmed'
      );
    } catch (error) {
      console.error('Error al monitorear token:', error);
      this.notify({
        type: 'error',
        message: 'Error al monitorear el token'
      });
    }
  }
}

// Exportar una instancia singleton
export const notificationService = new NotificationService(
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com'
); 