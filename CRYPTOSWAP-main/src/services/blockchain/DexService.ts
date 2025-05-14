import { Connection, PublicKey } from '@solana/web3.js';
import { Token, TokenSwap } from '@/types/token';
import { TOKEN_CONFIG } from '@/config/constants';
import { SecurityService } from '../security/SecurityService';

export type DexType = 'jupiter' | 'raydium';

export interface DexQuote {
  dex: DexType;
  fromToken: Token;
  toToken: Token;
  fromAmount: number;
  toAmount: number;
  priceImpact: number;
  fee: number;
  route: Token[];
  minOutputAmount: number;
}

export class DexService {
  private static instance: DexService;
  private connection: Connection;
  private securityService: SecurityService;
  private jupiterApiUrl: string;
  private raydiumApiUrl: string;

  private constructor(connection: Connection) {
    this.connection = connection;
    this.securityService = SecurityService.getInstance();
    this.jupiterApiUrl = 'https://quote-api.jup.ag/v6';
    this.raydiumApiUrl = 'https://api.raydium.io/v2';
  }

  static getInstance(connection: Connection): DexService {
    if (!DexService.instance) {
      DexService.instance = new DexService(connection);
    }
    return DexService.instance;
  }

  async getBestQuote(
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number = TOKEN_CONFIG.DEFAULT_SLIPPAGE
  ): Promise<DexQuote> {
    try {
      // Obtener quotes de ambos DEXs
      const [jupiterQuote, raydiumQuote] = await Promise.all([
        this.getJupiterQuote(fromToken, toToken, amount, slippage),
        this.getRaydiumQuote(fromToken, toToken, amount, slippage)
      ]);

      // Comparar y seleccionar el mejor quote
      if (jupiterQuote.toAmount > raydiumQuote.toAmount) {
        return jupiterQuote;
      }
      return raydiumQuote;
    } catch (error) {
      console.error('Error al obtener mejor quote:', error);
      throw error;
    }
  }

  private async getJupiterQuote(
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number
  ): Promise<DexQuote> {
    try {
      const response = await fetch(
        `${this.jupiterApiUrl}/quote?inputMint=${fromToken.address.toString()}&outputMint=${toToken.address.toString()}&amount=${amount}&slippageBps=${slippage * 100}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener quote de Jupiter');
      }

      const quoteData = await response.json();

      return {
        dex: 'jupiter',
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: quoteData.outAmount,
        priceImpact: quoteData.priceImpactPct,
        fee: quoteData.otherAmountThreshold,
        route: quoteData.routePlan?.map((step: any) => ({
          address: new PublicKey(step.swapInfo.ammKey),
          symbol: step.swapInfo.label,
          name: step.swapInfo.label,
          decimals: 9
        })),
        minOutputAmount: quoteData.otherAmountThreshold
      };
    } catch (error) {
      console.error('Error al obtener quote de Jupiter:', error);
      throw error;
    }
  }

  private async getRaydiumQuote(
    fromToken: Token,
    toToken: Token,
    amount: number,
    slippage: number
  ): Promise<DexQuote> {
    try {
      const response = await fetch(
        `${this.raydiumApiUrl}/main/quote?inputMint=${fromToken.address.toString()}&outputMint=${toToken.address.toString()}&amount=${amount}&slippage=${slippage}`
      );

      if (!response.ok) {
        throw new Error('Error al obtener quote de Raydium');
      }

      const quoteData = await response.json();

      return {
        dex: 'raydium',
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: quoteData.outAmount,
        priceImpact: quoteData.priceImpact,
        fee: quoteData.fee,
        route: [fromToken, toToken], // Raydium es directo
        minOutputAmount: quoteData.minOutAmount
      };
    } catch (error) {
      console.error('Error al obtener quote de Raydium:', error);
      throw error;
    }
  }

  async executeSwap(
    quote: DexQuote,
    wallet: any // TODO: Tipar correctamente
  ): Promise<string> {
    try {
      // Validar la transacción antes de ejecutarla
      const validation = this.securityService.validateTransaction({
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        slippage: TOKEN_CONFIG.DEFAULT_SLIPPAGE,
        priceImpact: quote.priceImpact,
        liquidity: quote.toAmount // Usar el monto de salida como proxy de liquidez
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      let txHash: string;

      if (quote.dex === 'jupiter') {
        txHash = await this.executeJupiterSwap(quote, wallet);
      } else {
        txHash = await this.executeRaydiumSwap(quote, wallet);
      }

      return txHash;
    } catch (error) {
      console.error('Error al ejecutar swap:', error);
      throw error;
    }
  }

  private async executeJupiterSwap(
    quote: DexQuote,
    wallet: any
  ): Promise<string> {
    const swapResponse = await fetch(`${this.jupiterApiUrl}/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toString(),
        wrapUnwrapSOL: true
      })
    });

    if (!swapResponse.ok) {
      throw new Error('Error al crear transacción de swap en Jupiter');
    }

    const swapData = await swapResponse.json();
    const signedTx = await wallet.signTransaction(swapData.swapTransaction);
    return await this.connection.sendRawTransaction(signedTx.serialize());
  }

  private async executeRaydiumSwap(
    quote: DexQuote,
    wallet: any
  ): Promise<string> {
    const swapResponse = await fetch(`${this.raydiumApiUrl}/main/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quote: quote,
        userPublicKey: wallet.publicKey.toString()
      })
    });

    if (!swapResponse.ok) {
      throw new Error('Error al crear transacción de swap en Raydium');
    }

    const swapData = await swapResponse.json();
    const signedTx = await wallet.signTransaction(swapData.transaction);
    return await this.connection.sendRawTransaction(signedTx.serialize());
  }
} 