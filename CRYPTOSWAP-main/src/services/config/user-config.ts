import { Connection, PublicKey } from '@solana/web3.js';

export interface TokenConfig {
  symbol: string;
  mint: string;
  enabled: boolean;
  targetStablecoin: string;
  slippage: number;
  minAmount: number;
  maxAmount: number;
}

export interface UserConfig {
  autoSwapEnabled: boolean;
  tokens: TokenConfig[];
  limits: {
    daily: number;
    monthly: number;
  };
}

export class UserConfigService {
  private connection: Connection;
  private static readonly CONFIG_PREFIX = 'autoswap_config_';

  constructor(connection: Connection) {
    this.connection = connection;
  }

  private getStorageKey(walletAddress: string): string {
    return `${UserConfigService.CONFIG_PREFIX}${walletAddress}`;
  }

  async saveConfig(walletAddress: string, config: UserConfig): Promise<void> {
    try {
      // En una implementación real, esto podría guardarse en:
      // 1. LocalStorage (solo para desarrollo)
      // 2. Base de datos centralizada
      // 3. Smart Contract en Solana
      // 4. IPFS
      
      // Por ahora, usamos localStorage para desarrollo
      const key = this.getStorageKey(walletAddress);
      localStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      throw new Error('No se pudo guardar la configuración');
    }
  }

  async loadConfig(walletAddress: string): Promise<UserConfig | null> {
    try {
      const key = this.getStorageKey(walletAddress);
      const config = localStorage.getItem(key);
      
      if (!config) {
        // Configuración por defecto
        return {
          autoSwapEnabled: false,
          tokens: [
            {
              symbol: 'SOL',
              mint: 'So11111111111111111111111111111111111111112',
              enabled: true,
              targetStablecoin: 'USDC',
              slippage: 1,
              minAmount: 0.1,
              maxAmount: 10
            }
          ],
          limits: {
            daily: 1000,
            monthly: 10000
          }
        };
      }

      return JSON.parse(config);
    } catch (error) {
      console.error('Error al cargar la configuración:', error);
      throw new Error('No se pudo cargar la configuración');
    }
  }

  async validateConfig(config: UserConfig): Promise<boolean> {
    // Validar que la configuración sea válida
    for (const token of config.tokens) {
      if (token.slippage < 0.1 || token.slippage > 5) {
        throw new Error(`El slippage para ${token.symbol} debe estar entre 0.1% y 5%`);
      }

      if (token.minAmount < 0 || token.maxAmount < 0) {
        throw new Error(`Las cantidades para ${token.symbol} deben ser mayores a 0`);
      }

      if (token.minAmount > token.maxAmount) {
        throw new Error(`La cantidad mínima de ${token.symbol} no puede ser mayor a la máxima`);
      }
    }

    if (config.limits.daily <= 0 || config.limits.monthly <= 0) {
      throw new Error('Los límites deben ser mayores a 0');
    }

    if (config.limits.daily > config.limits.monthly) {
      throw new Error('El límite diario no puede ser mayor al límite mensual');
    }

    return true;
  }
} 