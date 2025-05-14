import { Connection, PublicKey } from '@solana/web3.js';
import { UserConfig, TokenConfig } from '../config/user-config';
import { getTokenBalance } from '../solana';
import JSBI from 'jsbi';

// Servicio para guardar swaps en localStorage
function saveSwapToHistory(wallet: string, swap: any) {
  const key = `swap_history_${wallet}`;
  const prev = localStorage.getItem(key);
  const history = prev ? JSON.parse(prev) : [];
  history.unshift(swap); // Agrega al inicio
  localStorage.setItem(key, JSON.stringify(history.slice(0, 50))); // Máximo 50 swaps
}

export type SwapNotification = (params: { success: boolean; message: string; txid?: string; error?: any }) => void;

export class AutoSwapService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async checkAndExecuteSwaps(walletAddress: string, config: UserConfig, notify?: SwapNotification): Promise<void> {
    if (!config.autoSwapEnabled) {
      return;
    }

    const enabledTokens = config.tokens.filter(token => token.enabled);
    if (enabledTokens.length === 0) {
      return;
    }

    for (const token of enabledTokens) {
      try {
        // Obtener balance del token
        const balance = await getTokenBalance(walletAddress, token.symbol);
        // Verificar si el balance está dentro de los límites configurados
        if (balance >= token.minAmount && balance <= token.maxAmount) {
          await this.executeSwap(
            token,
            balance,
            walletAddress,
            notify
          );
        }
      } catch (error) {
        if (notify) notify({ success: false, message: `Error al procesar ${token.symbol}`, error });
        console.error(`Error al procesar ${token.symbol}:`, error);
        // Continuar con el siguiente token
      }
    }
  }

  private async executeSwap(
    token: TokenConfig,
    amount: number,
    walletAddress: string,
    notify?: SwapNotification
  ): Promise<void> {
    try {
      if (!token.symbol || !token.targetStablecoin) {
        throw new Error('Token o stablecoin no configurados');
      }
      // Obtener quote
      const quoteRes = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${token.symbol}&outputMint=${token.targetStablecoin}&amount=${Math.floor(amount * 1e9)}&slippageBps=${Math.floor(token.slippage * 100)}`);
      const quote = await quoteRes.json();
      if (!quote || !quote.routePlan || quote.routePlan.length === 0) {
        if (notify) notify({ success: false, message: `No se encontraron rutas de swap para ${token.symbol}` });
        throw new Error('No se encontraron rutas de swap');
      }
      // Solicitar transacción de swap
      const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: quote,
          userPublicKey: walletAddress,
          wrapUnwrapSOL: true
        })
      });
      const swapData = await swapRes.json();
      if (!swapData.swapTransaction) {
        if (notify) notify({ success: false, message: `No se pudo preparar la transacción de swap para ${token.symbol}` });
        throw new Error('No se pudo preparar la transacción de swap');
      }
      // Aquí deberías firmar y enviar la transacción con la wallet del usuario (esto depende de tu integración de wallet)
      // Por ahora solo notificamos éxito simulado
      if (notify) notify({ success: true, message: `Swap preparado para ${token.symbol} -> ${token.targetStablecoin}` });
    } catch (error: any) {
      if (notify) notify({ success: false, message: `Error al ejecutar swap de ${token.symbol}: ${error?.message || error}`, error });
      console.error(`Error al ejecutar swap de ${token.symbol}:`, error);
      return;
    }
  }
} 