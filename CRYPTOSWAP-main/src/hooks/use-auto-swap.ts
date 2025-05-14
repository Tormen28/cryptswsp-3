import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { createApproveInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { AutoSwapService, SwapNotification } from '@/services/auto-swap/auto-swap-service';
import { UserConfigService, UserConfig } from '@/services/config/user-config';
import { useToast } from '@/hooks/use-toast';
import { TOKEN_CONFIGS } from '@/lib/solana-config';
import { jupiterService } from '@/services/jupiter';

// Placeholder para el contrato inteligente de AutoSwap
const AUTOSWAP_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
const GLOBAL_CONNECTION = new Connection('https://api.testnet.solana.com');

export function useAutoSwap() {
  const { publicKey, wallet, signTransaction } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [configService] = useState(() => new UserConfigService(GLOBAL_CONNECTION));
  const [autoSwapService] = useState(() => new AutoSwapService(GLOBAL_CONNECTION));

  const loadConfig = useCallback(async () => {
    if (!publicKey) return;
    try {
      setLoading(true);
      const userConfig = await configService.loadConfig(publicKey.toString());
      setConfig(userConfig);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [publicKey, configService, toast]);

  const saveConfig = useCallback(async (newConfig: UserConfig) => {
    if (!publicKey) return;
    try {
      setLoading(true);
      await configService.validateConfig(newConfig);
      await configService.saveConfig(publicKey.toString(), newConfig);
      const updatedConfig = await configService.loadConfig(publicKey.toString());
      setConfig(updatedConfig);
      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar la configuración',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [publicKey, configService, toast]);

  // Callback para notificaciones de swap
  const swapNotification: SwapNotification = ({ success, message, txid, error }) => {
    if (success) {
      toast({
        title: 'Swap exitoso',
        description: message + (txid ? ` (txid: ${txid})` : ''),
        variant: 'default'
      });
    } else {
      toast({
        title: 'Error en AutoSwap',
        description: message,
        variant: 'destructive'
      });
    }
  };

  // Nueva función: aprobar tokens SPL para el contrato de AutoSwap
  const approveTokensForAutoSwap = useCallback(async () => {
    if (!publicKey || !wallet || !signTransaction || !config) {
      toast({
        title: 'Wallet no conectada',
        description: 'Conecta tu wallet antes de activar AutoSwap.',
        variant: 'destructive'
      });
      console.log('Wallet:', wallet);
      console.log('signTransaction:', signTransaction);
      console.log('PublicKey:', publicKey?.toBase58());
      return false;
    }
    try {
      setLoading(true);
      const enabledTokens = config.tokens?.filter(token => token.enabled) || [];
      for (const token of enabledTokens) {
        const tokenInfo = (TOKEN_CONFIGS as Record<string, any>)[token.symbol];
        if (!tokenInfo) {
          toast({
            title: 'Token desconocido',
            description: `No se encontró información para el token ${token.symbol}`,
            variant: 'destructive'
          });
          continue;
        }
        const mint = new PublicKey(tokenInfo.address);
        const decimals = tokenInfo.decimals;
        const ata = await getAssociatedTokenAddress(mint, publicKey);
        let accountInfo = null;
        let needsCreateATA = false;
        try {
          accountInfo = await GLOBAL_CONNECTION.getTokenAccountBalance(ata);
        } catch (e) {
          needsCreateATA = true;
        }
        if (!accountInfo || Number(accountInfo.value.amount) === 0) {
          needsCreateATA = true;
        }
        // Crear instrucciones
        const instructions = [];
        if (needsCreateATA) {
          instructions.push(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer
              ata, // ata
              publicKey, // owner
              mint
            )
          );
        }
        instructions.push(
          createApproveInstruction(
            ata,
            AUTOSWAP_PROGRAM_ID,
            publicKey,
            BigInt(token.maxAmount * Math.pow(10, decimals))
          )
        );
        // Crear y firmar la transacción
        const tx = new Transaction().add(...instructions);
        tx.feePayer = publicKey;
        tx.recentBlockhash = (await GLOBAL_CONNECTION.getRecentBlockhash()).blockhash;
        console.log('Transaction:', tx);
        const signedTx = await signTransaction(tx);
        const txid = await GLOBAL_CONNECTION.sendRawTransaction(signedTx.serialize());
        await GLOBAL_CONNECTION.confirmTransaction(txid, 'confirmed');
        toast({
          title: 'Permiso concedido',
          description: `Aprobación de ${token.symbol} confirmada en la wallet.`,
          variant: 'default'
        });
      }
      return true;
    } catch (error) {
      toast({
        title: 'Permiso denegado',
        description: 'No se pudo aprobar el uso de fondos en la wallet.',
        variant: 'destructive'
      });
      console.error('Error en approveTokensForAutoSwap:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [publicKey, wallet, signTransaction, config]);

  // Nueva función: swap automático usando Jupiter
  const autoSwapIfNeeded = useCallback(async () => {
    if (!publicKey || !wallet || !signTransaction || !config) return;
    const enabledTokens = config.tokens?.filter(token => token.enabled) || [];
    for (const token of enabledTokens) {
      const tokenInfo = (TOKEN_CONFIGS as Record<string, any>)[token.symbol];
      if (!tokenInfo) continue;
      const mint = new PublicKey(tokenInfo.address);
      const decimals = tokenInfo.decimals;
      const ata = await getAssociatedTokenAddress(mint, publicKey);
      let accountInfo = null;
      try {
        accountInfo = await GLOBAL_CONNECTION.getTokenAccountBalance(ata);
      } catch (e) {
        continue; // No hay cuenta asociada, no hay saldo
      }
      const balance = Number(accountInfo?.value?.amount || 0) / Math.pow(10, decimals);
      if (balance < token.minAmount) continue; // No hay saldo suficiente
      // Obtener quote de Jupiter
      const outTokenInfo = (TOKEN_CONFIGS as Record<string, any>)[token.targetStablecoin];
      if (!outTokenInfo) continue;
      const quote = await jupiterService.getQuote(
        tokenInfo.address,
        outTokenInfo.address,
        String(Math.floor(balance * Math.pow(10, decimals))),
        Math.floor(token.slippage * 100)
      );
      if (!quote || !quote.routePlan || quote.routePlan.length === 0) continue;
      // Solicitar transacción de swap
      const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: quote,
          userPublicKey: publicKey.toString(),
          wrapUnwrapSOL: true
        })
      });
      const swapData = await swapRes.json();
      if (!swapData.swapTransaction) continue;
      // Firmar y enviar la transacción
      const tx = Transaction.from(Buffer.from(swapData.swapTransaction, 'base64'));
      tx.feePayer = publicKey;
      tx.recentBlockhash = (await GLOBAL_CONNECTION.getRecentBlockhash()).blockhash;
      const signedTx = await signTransaction(tx);
      const txid = await GLOBAL_CONNECTION.sendRawTransaction(signedTx.serialize());
      await GLOBAL_CONNECTION.confirmTransaction(txid, 'confirmed');
      toast({
        title: 'Swap automático realizado',
        description: `Se cambió ${balance} ${token.symbol} a ${token.targetStablecoin}.`,
        variant: 'default'
      });
    }
  }, [publicKey, wallet, signTransaction, config]);

  const startAutoSwap = useCallback(async () => {
    if (!publicKey || !config) {
      toast({
        title: 'Wallet no conectada',
        description: 'Conecta tu wallet antes de activar AutoSwap.',
        variant: 'destructive'
      });
      return;
    }
    try {
      const approved = await approveTokensForAutoSwap();
      if (!approved) {
        toast({
          title: 'Permiso denegado',
          description: 'AutoSwap no puede funcionar sin permiso para mover fondos.',
          variant: 'destructive'
        });
        return;
      }
      setIsRunning(true);
      await autoSwapService.checkAndExecuteSwaps(publicKey.toString(), config, swapNotification);
      toast({
        title: 'AutoSwap activado',
        description: 'AutoSwap ha sido activado y realizará swaps automáticamente.',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al ejecutar AutoSwap',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  }, [publicKey, config, autoSwapService, toast, approveTokensForAutoSwap]);

  useEffect(() => {
    if (publicKey) {
      loadConfig();
    }
  }, [publicKey, loadConfig]);

  useEffect(() => {
    if (!config?.autoSwapEnabled || !publicKey) return;
    const interval = setInterval(() => {
      autoSwapIfNeeded();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [config?.autoSwapEnabled, publicKey, autoSwapIfNeeded]);

  return {
    config,
    loading,
    isRunning,
    saveConfig,
    startAutoSwap
  };
} 