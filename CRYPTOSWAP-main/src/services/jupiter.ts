import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface JupiterQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: number;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }[];
  contextSlot: number;
  timeTaken: number;
}

export interface JupiterSwap {
  swapTransaction: string;
}

export interface JupiterPrice {
  [mint: string]: {
    id: string;
    mintSymbol: string;
    vsToken: string;
    vsTokenSymbol: string;
    price: number;
  };
}

export interface RouteInfo {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: {
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
  }[];
}

export class JupiterError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'JupiterError';
  }
}

export class JupiterService {
  private connection: Connection;
  private baseUrl: string;
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private priceSubscribers: Map<string, Set<(price: number) => void>> = new Map();

  constructor(endpoint: string) {
    this.connection = new Connection(endpoint);
    this.baseUrl = 'https://quote-api.jup.ag/v6';
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50
  ): Promise<JupiterQuote> {
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new JupiterError(
          error.message || 'Error al obtener quote de Jupiter',
          error.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof JupiterError) {
        throw error;
      }
      throw new JupiterError('Error al obtener quote de Jupiter');
    }
  }

  async getSwapTransaction(
    quote: JupiterQuote,
    userPublicKey: string,
    wrapUnwrapSOL: boolean = true
  ): Promise<JupiterSwap> {
    try {
      const response = await fetch(`${this.baseUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          wrapUnwrapSOL,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new JupiterError(
          error.message || 'Error al obtener transacción de swap',
          error.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof JupiterError) {
        throw error;
      }
      throw new JupiterError('Error al obtener transacción de swap');
    }
  }

  async executeSwap(
    swapTransaction: string,
    signTransaction: (transaction: Transaction) => Promise<Transaction>
  ): Promise<string> {
    try {
      const transaction = Transaction.from(
        Buffer.from(swapTransaction, 'base64')
      );

      const signedTransaction = await signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      throw new JupiterError('Error al ejecutar swap');
    }
  }

  async getTokenPrice(tokenMint: string): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseUrl}/price?ids=${tokenMint}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new JupiterError(
          error.message || 'Error al obtener precio del token',
          error.code
        );
      }

      const data: JupiterPrice = await response.json();
      return data[tokenMint]?.price || 0;
    } catch (error) {
      if (error instanceof JupiterError) {
        throw error;
      }
      throw new JupiterError('Error al obtener precio del token');
    }
  }

  async getTokenPrices(tokenMints: string[]): Promise<JupiterPrice> {
    try {
      const response = await fetch(
        `${this.baseUrl}/price?ids=${tokenMints.join(',')}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new JupiterError(
          error.message || 'Error al obtener precios de tokens',
          error.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof JupiterError) {
        throw error;
      }
      throw new JupiterError('Error al obtener precios de tokens');
    }
  }

  async getRoutes(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50
  ): Promise<RouteInfo[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=false`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new JupiterError(
          error.message || 'Error al obtener rutas',
          error.code
        );
      }

      const data = await response.json();
      return data.routes || [];
    } catch (error) {
      if (error instanceof JupiterError) {
        throw error;
      }
      throw new JupiterError('Error al obtener rutas');
    }
  }

  subscribeToPriceUpdates(
    tokenMint: string,
    callback: (price: number) => void
  ): () => void {
    if (!this.priceSubscribers.has(tokenMint)) {
      this.priceSubscribers.set(tokenMint, new Set());
    }

    const subscribers = this.priceSubscribers.get(tokenMint)!;
    subscribers.add(callback);

    if (!this.priceUpdateInterval) {
      this.startPriceUpdates();
    }

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.priceSubscribers.delete(tokenMint);
      }
      if (this.priceSubscribers.size === 0) {
        this.stopPriceUpdates();
      }
    };
  }

  private startPriceUpdates() {
    this.priceUpdateInterval = setInterval(async () => {
      const tokenMints = Array.from(this.priceSubscribers.keys());
      if (tokenMints.length === 0) return;

      try {
        const prices = await this.getTokenPrices(tokenMints);
        for (const [mint, price] of Object.entries(prices)) {
          const subscribers = this.priceSubscribers.get(mint);
          if (subscribers) {
            subscribers.forEach(callback => callback(price.price));
          }
        }
      } catch (error) {
        console.error('Error updating prices:', error);
      }
    }, 10000); // Actualizar cada 10 segundos
  }

  private stopPriceUpdates() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
  }

  async getTokenMetadata(tokenMint: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/token-metadata?mint=${tokenMint}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new JupiterError(
          error.message || 'Error al obtener metadata del token',
          error.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof JupiterError) {
        throw error;
      }
      throw new JupiterError('Error al obtener metadata del token');
    }
  }
}

// Exportar una instancia singleton
export const jupiterService = new JupiterService(
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com'
); 