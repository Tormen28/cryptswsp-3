import { PublicKey } from '@solana/web3.js';
import { TOKEN_CONFIG } from '@/config/constants';
import { SecureStorage } from '../storage/SecureStorage';
import { LoggerService } from '../logging/LoggerService';

interface TransactionValidation {
  fromAmount: number;
  toAmount: number;
  slippage: number;
  priceImpact: number;
  liquidity: number;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class SecurityService {
  private static instance: SecurityService;
  private readonly MAX_SLIPPAGE: number;
  private readonly MIN_LIQUIDITY: number;
  private readonly PRICE_IMPACT_THRESHOLD: number;
  private readonly MAX_PRICE_IMPACT: number;
  private readonly storage: SecureStorage;
  private readonly logger: LoggerService;

  private constructor() {
    this.MAX_SLIPPAGE = TOKEN_CONFIG.MAX_SLIPPAGE;
    this.MIN_LIQUIDITY = TOKEN_CONFIG.MIN_LIQUIDITY;
    this.PRICE_IMPACT_THRESHOLD = TOKEN_CONFIG.PRICE_IMPACT_THRESHOLD;
    this.MAX_PRICE_IMPACT = 5; // 5%
    this.storage = SecureStorage.getInstance();
    this.logger = LoggerService.getInstance();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  validateSlippage(slippage: number): boolean {
    return slippage >= TOKEN_CONFIG.DEFAULT_SLIPPAGE && slippage <= this.MAX_SLIPPAGE;
  }

  validateLiquidity(liquidity: number): boolean {
    return liquidity >= this.MIN_LIQUIDITY;
  }

  validatePriceImpact(priceImpact: number): boolean {
    return priceImpact <= this.PRICE_IMPACT_THRESHOLD;
  }

  validateTokenAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  validateAmount(amount: number): boolean {
    return amount > 0 && !isNaN(amount) && isFinite(amount);
  }

  validateTransaction(tx: TransactionValidation): ValidationResult {
    // Validar impacto en el precio
    if (tx.priceImpact > this.MAX_PRICE_IMPACT) {
      return {
        valid: false,
        error: `Impacto en el precio demasiado alto: ${tx.priceImpact}%`
      };
    }

    // Validar liquidez
    if (tx.liquidity < this.MIN_LIQUIDITY) {
      return {
        valid: false,
        error: `Liquidez insuficiente: $${tx.liquidity}`
      };
    }

    // Validar slippage
    const actualSlippage = Math.abs(
      ((tx.toAmount - tx.fromAmount) / tx.fromAmount) * 100
    );
    if (actualSlippage > tx.slippage) {
      return {
        valid: false,
        error: `Slippage excedido: ${actualSlippage}%`
      };
    }

    return { valid: true };
  }

  validateConfig(config: any): ValidationResult {
    // TODO: Implementar validación de configuración
    return { valid: true };
  }

  async encryptData(data: string): Promise<string> {
    try {
      const encryptedData = await this.storage.encrypt(data);
      await this.logger.log(
        'security',
        'Datos encriptados exitosamente',
        'SecurityService'
      );
      return encryptedData;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al encriptar datos',
        'SecurityService',
        { error }
      );
      throw new Error('Error al encriptar datos');
    }
  }

  async decryptData(encryptedData: string): Promise<string> {
    try {
      const decryptedData = await this.storage.decrypt(encryptedData);
      await this.logger.log(
        'security',
        'Datos desencriptados exitosamente',
        'SecurityService'
      );
      return decryptedData;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al desencriptar datos',
        'SecurityService',
        { error }
      );
      throw new Error('Error al desencriptar datos');
    }
  }

  // Método para registrar eventos de seguridad
  logSecurityEvent(event: {
    type: string;
    details: any;
    timestamp: number;
  }): void {
    // TODO: Implementar logging real
    console.log('Security Event:', event);
  }
} 