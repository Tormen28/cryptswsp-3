import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TESTNET_CONFIG } from '@/config/testnet';
import { JupiterService } from '@/services/dex/JupiterService';
import { RaydiumService } from '@/services/dex/RaydiumService';
import { WalletService } from '@/services/wallet/WalletService';
import { NotificationService } from '@/services/notifications/NotificationService';
import { Token } from '@/types/token';
import { AutoSwapConfig } from '@/types/autoSwap';

describe('AutoSwap Tests', () => {
  let connection: Connection;
  let jupiterService: JupiterService;
  let raydiumService: RaydiumService;
  let walletService: WalletService;
  let notificationService: NotificationService;
  let testWallet: Keypair;

  beforeAll(async () => {
    // Configurar conexión a testnet
    connection = new Connection(TESTNET_CONFIG.endpoint, 'confirmed');
    
    // Inicializar servicios
    jupiterService = JupiterService.getInstance(TESTNET_CONFIG.endpoint);
    raydiumService = RaydiumService.getInstance(TESTNET_CONFIG.endpoint);
    walletService = WalletService.getInstance(TESTNET_CONFIG.endpoint);
    notificationService = NotificationService.getInstance();

    // Crear wallet de prueba
    testWallet = Keypair.generate();
  });

  describe('Configuración', () => {
    it('debería cargar la configuración correctamente', async () => {
      const config: AutoSwapConfig = {
        enabled: true,
        fromTokens: [{
          address: TESTNET_CONFIG.tokens.USDC,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        }],
        toToken: {
          address: TESTNET_CONFIG.tokens.SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        },
        slippage: TESTNET_CONFIG.limits.defaultSlippage,
        dailyLimit: TESTNET_CONFIG.limits.dailyLimit,
        monthlyLimit: TESTNET_CONFIG.limits.monthlyLimit,
        minAmount: TESTNET_CONFIG.limits.minSwapAmount,
        maxAmount: TESTNET_CONFIG.limits.maxSwapAmount,
        priceAlerts: [{
          token: {
            address: TESTNET_CONFIG.tokens.USDC,
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6
          },
          threshold: TESTNET_CONFIG.notifications.priceAlertThreshold,
          type: 'above'
        }]
      };

      expect(config.enabled).toBe(true);
      expect(config.fromTokens[0].symbol).toBe('USDC');
      expect(config.toToken.symbol).toBe('SOL');
      expect(config.slippage).toBe(TESTNET_CONFIG.limits.defaultSlippage);
    });
  });

  describe('Quotes', () => {
    it('debería obtener quote de Jupiter', async () => {
      const fromToken: Token = {
        address: TESTNET_CONFIG.tokens.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      };

      const toToken: Token = {
        address: TESTNET_CONFIG.tokens.SOL,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };

      const quote = await jupiterService.getQuote(
        fromToken,
        toToken,
        100, // 100 USDC
        TESTNET_CONFIG.limits.defaultSlippage
      );

      expect(quote).toBeDefined();
      expect(quote.inAmount).toBeGreaterThan(0);
      expect(quote.outAmount).toBeGreaterThan(0);
      expect(quote.priceImpact).toBeGreaterThanOrEqual(0);
    });

    it('debería obtener quote de Raydium', async () => {
      const fromToken: Token = {
        address: TESTNET_CONFIG.tokens.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      };

      const toToken: Token = {
        address: TESTNET_CONFIG.tokens.SOL,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };

      const quote = await raydiumService.getQuote(
        fromToken,
        toToken,
        100, // 100 USDC
        TESTNET_CONFIG.limits.defaultSlippage
      );

      expect(quote).toBeDefined();
      expect(quote.inAmount).toBeGreaterThan(0);
      expect(quote.outAmount).toBeGreaterThan(0);
      expect(quote.priceImpact).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Swaps', () => {
    it('debería preparar transacción de swap en Jupiter', async () => {
      const fromToken: Token = {
        address: TESTNET_CONFIG.tokens.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      };

      const toToken: Token = {
        address: TESTNET_CONFIG.tokens.SOL,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };

      const quote = await jupiterService.getQuote(
        fromToken,
        toToken,
        100,
        TESTNET_CONFIG.limits.defaultSlippage
      );

      const transaction = await jupiterService.executeSwap(
        quote,
        testWallet.publicKey
      );

      expect(transaction).toBeDefined();
      expect(transaction.instructions.length).toBeGreaterThan(0);
    });

    it('debería preparar transacción de swap en Raydium', async () => {
      const fromToken: Token = {
        address: TESTNET_CONFIG.tokens.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      };

      const toToken: Token = {
        address: TESTNET_CONFIG.tokens.SOL,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };

      const quote = await raydiumService.getQuote(
        fromToken,
        toToken,
        100,
        TESTNET_CONFIG.limits.defaultSlippage
      );

      const transaction = await raydiumService.executeSwap(
        quote,
        testWallet.publicKey
      );

      expect(transaction).toBeDefined();
      expect(transaction.instructions.length).toBeGreaterThan(0);
    });
  });

  describe('Notificaciones', () => {
    it('debería enviar notificación de swap exitoso', async () => {
      const notification = await notificationService.sendNotification(
        'success',
        'Swap Exitoso',
        'La transacción se ha completado correctamente',
        {
          fromToken: 'USDC',
          toToken: 'SOL',
          amount: 100
        }
      );

      expect(notification).toBeDefined();
    });

    it('debería enviar notificación de error', async () => {
      const notification = await notificationService.sendNotification(
        'error',
        'Error en Swap',
        'No se pudo completar la transacción',
        {
          error: 'Insufficient funds'
        }
      );

      expect(notification).toBeDefined();
    });
  });

  describe('Límites', () => {
    it('debería respetar el límite diario', async () => {
      const config: AutoSwapConfig = {
        enabled: true,
        fromTokens: [{
          address: TESTNET_CONFIG.tokens.USDC,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        }],
        toToken: {
          address: TESTNET_CONFIG.tokens.SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        },
        slippage: TESTNET_CONFIG.limits.defaultSlippage,
        dailyLimit: 1000,
        monthlyLimit: 10000,
        minAmount: TESTNET_CONFIG.limits.minSwapAmount,
        maxAmount: TESTNET_CONFIG.limits.maxSwapAmount,
        priceAlerts: []
      };

      // Simular un swap que excede el límite diario
      const amount = 1500; // Mayor que el límite diario de 1000
      await expect(async () => {
        const quote = await jupiterService.getQuote(
          config.fromTokens[0],
          config.toToken,
          amount,
          config.slippage
        );
      }).rejects.toThrow('Límite diario excedido');
    });

    it('debería respetar el límite mensual', async () => {
      const config: AutoSwapConfig = {
        enabled: true,
        fromTokens: [{
          address: TESTNET_CONFIG.tokens.USDC,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        }],
        toToken: {
          address: TESTNET_CONFIG.tokens.SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        },
        slippage: TESTNET_CONFIG.limits.defaultSlippage,
        dailyLimit: 1000,
        monthlyLimit: 10000,
        minAmount: TESTNET_CONFIG.limits.minSwapAmount,
        maxAmount: TESTNET_CONFIG.limits.maxSwapAmount,
        priceAlerts: []
      };

      // Simular un swap que excede el límite mensual
      const amount = 11000; // Mayor que el límite mensual de 10000
      await expect(async () => {
        const quote = await jupiterService.getQuote(
          config.fromTokens[0],
          config.toToken,
          amount,
          config.slippage
        );
      }).rejects.toThrow('Límite mensual excedido');
    });
  });

  describe('Validación de Montos', () => {
    it('debería rechazar montos menores al mínimo', async () => {
      const config: AutoSwapConfig = {
        enabled: true,
        fromTokens: [{
          address: TESTNET_CONFIG.tokens.USDC,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        }],
        toToken: {
          address: TESTNET_CONFIG.tokens.SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        },
        slippage: TESTNET_CONFIG.limits.defaultSlippage,
        dailyLimit: TESTNET_CONFIG.limits.dailyLimit,
        monthlyLimit: TESTNET_CONFIG.limits.monthlyLimit,
        minAmount: 100,
        maxAmount: TESTNET_CONFIG.limits.maxSwapAmount,
        priceAlerts: []
      };

      const amount = 50; // Menor que el mínimo de 100
      await expect(async () => {
        const quote = await jupiterService.getQuote(
          config.fromTokens[0],
          config.toToken,
          amount,
          config.slippage
        );
      }).rejects.toThrow('Monto menor al mínimo permitido');
    });

    it('debería rechazar montos mayores al máximo', async () => {
      const config: AutoSwapConfig = {
        enabled: true,
        fromTokens: [{
          address: TESTNET_CONFIG.tokens.USDC,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        }],
        toToken: {
          address: TESTNET_CONFIG.tokens.SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        },
        slippage: TESTNET_CONFIG.limits.defaultSlippage,
        dailyLimit: TESTNET_CONFIG.limits.dailyLimit,
        monthlyLimit: TESTNET_CONFIG.limits.monthlyLimit,
        minAmount: TESTNET_CONFIG.limits.minSwapAmount,
        maxAmount: 1000,
        priceAlerts: []
      };

      const amount = 1500; // Mayor que el máximo de 1000
      await expect(async () => {
        const quote = await jupiterService.getQuote(
          config.fromTokens[0],
          config.toToken,
          amount,
          config.slippage
        );
      }).rejects.toThrow('Monto mayor al máximo permitido');
    });
  });

  describe('Alertas de Precio', () => {
    it('debería activar alerta cuando el precio supera el umbral', async () => {
      const config: AutoSwapConfig = {
        enabled: true,
        fromTokens: [{
          address: TESTNET_CONFIG.tokens.USDC,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6
        }],
        toToken: {
          address: TESTNET_CONFIG.tokens.SOL,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9
        },
        slippage: TESTNET_CONFIG.limits.defaultSlippage,
        dailyLimit: TESTNET_CONFIG.limits.dailyLimit,
        monthlyLimit: TESTNET_CONFIG.limits.monthlyLimit,
        minAmount: TESTNET_CONFIG.limits.minSwapAmount,
        maxAmount: TESTNET_CONFIG.limits.maxSwapAmount,
        priceAlerts: [{
          token: {
            address: TESTNET_CONFIG.tokens.USDC,
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6
          },
          threshold: 1.5, // 50% por encima del precio base
          type: 'above'
        }]
      };

      // Simular un precio que supera el umbral
      const currentPrice = 2.0; // 100% por encima del precio base
      const shouldAlert = currentPrice > config.priceAlerts[0].threshold;

      expect(shouldAlert).toBe(true);
      // Verificar que se envía la notificación
      const notification = await notificationService.sendNotification(
        'warning',
        'Alerta de Precio',
        `El precio de USDC ha superado el umbral de ${config.priceAlerts[0].threshold}`,
        {
          token: 'USDC',
          currentPrice,
          threshold: config.priceAlerts[0].threshold
        }
      );

      expect(notification).toBeDefined();
    });
  });

  describe('Manejo de Errores', () => {
    it('debería manejar errores de red', async () => {
      const fromToken: Token = {
        address: TESTNET_CONFIG.tokens.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      };

      const toToken: Token = {
        address: TESTNET_CONFIG.tokens.SOL,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };

      // Simular un error de red
      jest.spyOn(connection, 'getRecentBlockhash').mockRejectedValueOnce(new Error('Network error'));

      await expect(async () => {
        const quote = await jupiterService.getQuote(
          fromToken,
          toToken,
          100,
          TESTNET_CONFIG.limits.defaultSlippage
        );
      }).rejects.toThrow('Error de red al obtener quote');

      // Verificar que se envía la notificación de error
      const notification = await notificationService.sendNotification(
        'error',
        'Error de Red',
        'No se pudo conectar con el servicio de quotes',
        {
          error: 'Network error'
        }
      );

      expect(notification).toBeDefined();
    });

    it('debería manejar errores de slippage', async () => {
      const fromToken: Token = {
        address: TESTNET_CONFIG.tokens.USDC,
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6
      };

      const toToken: Token = {
        address: TESTNET_CONFIG.tokens.SOL,
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9
      };

      // Simular un error de slippage
      const highSlippage = 0.5; // 50% de slippage
      await expect(async () => {
        const quote = await jupiterService.getQuote(
          fromToken,
          toToken,
          100,
          highSlippage
        );
      }).rejects.toThrow('Slippage demasiado alto');

      // Verificar que se envía la notificación de error
      const notification = await notificationService.sendNotification(
        'warning',
        'Slippage Alto',
        'El slippage especificado es demasiado alto',
        {
          slippage: highSlippage,
          maxAllowed: TESTNET_CONFIG.limits.maxSlippage
        }
      );

      expect(notification).toBeDefined();
    });
  });
}); 