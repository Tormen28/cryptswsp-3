import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { LoggerService } from '../logging/LoggerService';
import { NotificationService } from '../notifications/NotificationService';
import { Token } from '@/types/token';
import { Quote } from './JupiterService';

export class RaydiumService {
  private static instance: RaydiumService;
  private readonly logger: LoggerService;
  private readonly notificationService: NotificationService;
  private readonly connection: Connection;
  private readonly raydiumApiUrl: string;

  private constructor(endpoint: string) {
    this.logger = LoggerService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.connection = new Connection(endpoint, 'confirmed');
    this.raydiumApiUrl = process.env.RAYDIUM_API_URL || 'https://api.raydium.io/v2';
  }

  static getInstance(endpoint: string): RaydiumService {
    if (!RaydiumService.instance) {
      RaydiumService.instance = new RaydiumService(endpoint);
    }
    return RaydiumService.instance;
  }

  async getQuote(
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number
  ): Promise<Quote> {
    try {
      const response = await fetch(
        `${this.raydiumApiUrl}/quote?` +
        `inputMint=${fromToken.address}&` +
        `outputMint=${toToken.address}&` +
        `amount=${amount}&` +
        `slippage=${slippage}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener quote de Raydium');
      }

      const quote = await response.json();

      await this.logger.log(
        'info',
        'Quote obtenido exitosamente',
        'RaydiumService',
        { fromToken, toToken, amount, quote }
      );

      return {
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        priceImpact: quote.priceImpact,
        route: quote.route,
        slippage
      };
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al obtener quote',
        'RaydiumService',
        { error }
      );
      throw error;
    }
  }

  async executeSwap(
    quote: Quote,
    walletPublicKey: PublicKey
  ): Promise<Transaction> {
    try {
      const response = await fetch(`${this.raydiumApiUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quote: quote.route,
          userPublicKey: walletPublicKey.toString(),
          wrapUnwrapSOL: true
        })
      });

      if (!response.ok) {
        throw new Error('Error al ejecutar swap en Raydium');
      }

      const swapResult = await response.json();
      const transaction = Transaction.from(
        Buffer.from(swapResult.swapTransaction, 'base64')
      );

      await this.logger.log(
        'info',
        'Swap preparado exitosamente',
        'RaydiumService',
        { quote, transaction }
      );

      await this.notificationService.sendNotification(
        'info',
        'Swap Preparado',
        'La transacción está lista para ser firmada',
        { quote, transaction }
      );

      return transaction;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al ejecutar swap',
        'RaydiumService',
        { error }
      );

      await this.notificationService.sendNotification(
        'error',
        'Error en Swap',
        'No se pudo preparar la transacción',
        { error }
      );

      throw error;
    }
  }

  async getTokenList(): Promise<Token[]> {
    try {
      const response = await fetch(`${this.raydiumApiUrl}/tokens`);
      if (!response.ok) {
        throw new Error('Error al obtener lista de tokens');
      }

      const tokens = await response.json();
      return tokens.map((token: any) => ({
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoURI: token.logoURI
      }));
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al obtener lista de tokens',
        'RaydiumService',
        { error }
      );
      throw error;
    }
  }

  async getPoolInfo(tokenA: Token, tokenB: Token): Promise<any> {
    try {
      const response = await fetch(
        `${this.raydiumApiUrl}/pool?` +
        `tokenA=${tokenA.address}&` +
        `tokenB=${tokenB.address}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener información del pool');
      }

      const poolInfo = await response.json();

      await this.logger.log(
        'info',
        'Información del pool obtenida exitosamente',
        'RaydiumService',
        { tokenA, tokenB, poolInfo }
      );

      return poolInfo;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al obtener información del pool',
        'RaydiumService',
        { error }
      );
      throw error;
    }
  }
} 