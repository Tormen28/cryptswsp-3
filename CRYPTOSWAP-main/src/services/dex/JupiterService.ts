import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { LoggerService } from '../logging/LoggerService';
import { NotificationService } from '../notifications/NotificationService';
import { Token } from '@/types/token';

export interface Quote {
  inAmount: number;
  outAmount: number;
  priceImpact: number;
  route: any; // TODO: Definir tipo específico para la ruta
  slippage: number;
}

export class JupiterService {
  private static instance: JupiterService;
  private readonly logger: LoggerService;
  private readonly notificationService: NotificationService;
  private readonly connection: Connection;
  private readonly jupiterApiUrl: string;

  private constructor(endpoint: string) {
    this.logger = LoggerService.getInstance();
    this.notificationService = NotificationService.getInstance();
    this.connection = new Connection(endpoint, 'confirmed');
    this.jupiterApiUrl = process.env.JUPITER_API_URL || 'https://quote-api.jup.ag/v6';
  }

  static getInstance(endpoint: string): JupiterService {
    if (!JupiterService.instance) {
      JupiterService.instance = new JupiterService(endpoint);
    }
    return JupiterService.instance;
  }

  async getQuote(
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number
  ): Promise<Quote> {
    try {
      const response = await fetch(
        `${this.jupiterApiUrl}/quote?` +
        `inputMint=${fromToken.address}&` +
        `outputMint=${toToken.address}&` +
        `amount=${amount}&` +
        `slippageBps=${slippage * 100}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener quote de Jupiter');
      }

      const quote = await response.json();

      await this.logger.log(
        'info',
        'Quote obtenido exitosamente',
        'JupiterService',
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
        'JupiterService',
        { error }
      );
      throw error;
    }
  }

  async getBestRoute(
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number
  ): Promise<Quote> {
    try {
      const quotes = await Promise.all([
        this.getQuote(fromToken, toToken, amount, slippage),
        // TODO: Agregar más DEXs para comparación
      ]);

      const bestQuote = quotes.reduce((best, current) => {
        return current.outAmount > best.outAmount ? current : best;
      });

      await this.logger.log(
        'info',
        'Mejor ruta encontrada',
        'JupiterService',
        { fromToken, toToken, amount, bestQuote }
      );

      return bestQuote;
    } catch (error) {
      await this.logger.log(
        'error',
        'Error al obtener mejor ruta',
        'JupiterService',
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
      const response = await fetch(`${this.jupiterApiUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: quote.route,
          userPublicKey: walletPublicKey.toString(),
          wrapUnwrapSOL: true
        })
      });

      if (!response.ok) {
        throw new Error('Error al ejecutar swap en Jupiter');
      }

      const swapResult = await response.json();
      const transaction = Transaction.from(
        Buffer.from(swapResult.swapTransaction, 'base64')
      );

      await this.logger.log(
        'info',
        'Swap preparado exitosamente',
        'JupiterService',
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
        'JupiterService',
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
      const response = await fetch(`${this.jupiterApiUrl}/tokens`);
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
        'JupiterService',
        { error }
      );
      throw error;
    }
  }
} 