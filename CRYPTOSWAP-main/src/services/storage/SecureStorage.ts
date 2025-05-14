import { Buffer } from 'buffer';
import { TOKEN_CONFIG } from '@/config/constants';

export class SecureStorage {
  private static instance: SecureStorage;
  private readonly encryptionKey: string;

  private constructor() {
    // En producción, esto debería venir de variables de entorno
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  async encrypt(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const keyBuffer = encoder.encode(this.encryptionKey);
      
      // Usar Web Crypto API para encriptación
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        cryptoKey,
        dataBuffer
      );

      // Combinar IV y datos encriptados
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encryptedBuffer), iv.length);

      return Buffer.from(result).toString('base64');
    } catch (error) {
      console.error('Error al encriptar datos:', error);
      throw new Error('Error al encriptar datos');
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const dataBuffer = Buffer.from(encryptedData, 'base64');
      const iv = dataBuffer.slice(0, 12);
      const encryptedBuffer = dataBuffer.slice(12);

      const encoder = new TextEncoder();
      const keyBuffer = encoder.encode(this.encryptionKey);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv)
        },
        cryptoKey,
        new Uint8Array(encryptedBuffer)
      );

      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Error al desencriptar datos:', error);
      throw new Error('Error al desencriptar datos');
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    try {
      const encryptedValue = await this.encrypt(JSON.stringify(value));
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Error al guardar datos:', error);
      throw new Error('Error al guardar datos');
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;

      const decryptedValue = await this.decrypt(encryptedValue);
      return JSON.parse(decryptedValue) as T;
    } catch (error) {
      console.error('Error al recuperar datos:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar datos:', error);
      throw new Error('Error al eliminar datos');
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar almacenamiento:', error);
      throw new Error('Error al limpiar almacenamiento');
    }
  }
} 