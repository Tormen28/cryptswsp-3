import { JupiterService, JupiterError } from '../jupiter';

// Mock de las dependencias
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    sendRawTransaction: jest.fn().mockResolvedValue('signature'),
    confirmTransaction: jest.fn().mockResolvedValue(undefined),
  })),
  PublicKey: jest.fn().mockImplementation((value) => ({ toBase58: () => value })),
  Transaction: {
    from: jest.fn().mockImplementation(() => ({
      serialize: jest.fn().mockReturnValue(new Uint8Array()),
    })),
  },
}));

describe('JupiterService', () => {
  let jupiterService: JupiterService;
  const mockEndpoint = 'https://api.testnet.solana.com';

  beforeEach(() => {
    jupiterService = new JupiterService(mockEndpoint);
    (global.fetch as jest.Mock).mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getQuote', () => {
    const mockQuote = {
      inputMint: 'So11111111111111111111111111111111111111112',
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      inAmount: '1000000000',
      outAmount: '20000000',
      otherAmountThreshold: '19900000',
      swapMode: 'ExactIn',
      slippageBps: 50,
      priceImpactPct: 0.1,
      routePlan: [],
      contextSlot: 123,
      timeTaken: 0.1,
    };

    it('should return a quote successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockQuote),
      });

      const result = await jupiterService.getQuote(
        mockQuote.inputMint,
        mockQuote.outputMint,
        mockQuote.inAmount
      );

      expect(result).toEqual(mockQuote);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/quote')
      );
    });

    it('should throw JupiterError when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'API Error', code: 'ERROR' }),
      });

      await expect(
        jupiterService.getQuote(
          mockQuote.inputMint,
          mockQuote.outputMint,
          mockQuote.inAmount
        )
      ).rejects.toThrow(JupiterError);
    });
  });

  describe('getTokenPrice', () => {
    const mockPrice = {
      'So11111111111111111111111111111111111111112': {
        id: 'So11111111111111111111111111111111111111112',
        mintSymbol: 'SOL',
        vsToken: 'USDC',
        vsTokenSymbol: 'USDC',
        price: 100,
      },
    };

    it('should return token price successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrice),
      });

      const result = await jupiterService.getTokenPrice(
        'So11111111111111111111111111111111111111112'
      );

      expect(result).toBe(100);
    });

    it('should return 0 when token price is not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await jupiterService.getTokenPrice(
        'So11111111111111111111111111111111111111112'
      );

      expect(result).toBe(0);
    });
  });

  describe('getRoutes', () => {
    const mockRoutes = [
      {
        inAmount: '1000000000',
        outAmount: '20000000',
        priceImpactPct: 0.1,
        marketInfos: [
          {
            label: 'Raydium',
            inputMint: 'So11111111111111111111111111111111111111112',
            outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            inAmount: '1000000000',
            outAmount: '20000000',
            feeAmount: '1000',
          },
        ],
      },
    ];

    it('should return routes successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ routes: mockRoutes }),
      });

      const result = await jupiterService.getRoutes(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        '1000000000'
      );

      expect(result).toEqual(mockRoutes);
    });

    it('should return empty array when no routes are found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ routes: [] }),
      });

      const result = await jupiterService.getRoutes(
        'So11111111111111111111111111111111111111112',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        '1000000000'
      );

      expect(result).toEqual([]);
    });
  });

  describe('getTokenMetadata', () => {
    const mockMetadata = {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
      logoURI: 'https://example.com/sol.png',
    };

    it('should return token metadata successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      });

      const result = await jupiterService.getTokenMetadata(
        'So11111111111111111111111111111111111111112'
      );

      expect(result).toEqual(mockMetadata);
    });

    it('should throw JupiterError when metadata is not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Token not found', code: 'ERROR' }),
      });

      await expect(
        jupiterService.getTokenMetadata(
          'So11111111111111111111111111111111111111112'
        )
      ).rejects.toThrow(JupiterError);
    });
  });

  describe('price updates subscription', () => {
    it('should notify subscribers of price updates', async () => {
      const mockPrice = 100;
      const callback = jest.fn();
      const tokenMint = 'So11111111111111111111111111111111111111112';

      const unsubscribe = jupiterService.subscribeToPriceUpdates(
        tokenMint,
        callback
      );

      // Simular actualización de precio
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              [tokenMint]: {
                id: tokenMint,
                mintSymbol: 'SOL',
                vsToken: 'USDC',
                vsTokenSymbol: 'USDC',
                price: mockPrice,
              },
            }),
        })
      );

      // Avanzar el tiempo para que se ejecute el intervalo
      await jest.advanceTimersByTimeAsync(10000);

      expect(callback).toHaveBeenCalledWith(mockPrice);

      unsubscribe();
    });

    it('should stop price updates when all subscribers unsubscribe', () => {
      const callback = jest.fn();
      const tokenMint = 'So11111111111111111111111111111111111111112';

      const unsubscribe = jupiterService.subscribeToPriceUpdates(
        tokenMint,
        callback
      );

      unsubscribe();

      // Verificar que no hay actualizaciones después de desuscribirse
      jest.advanceTimersByTime(10000);
      expect(callback).not.toHaveBeenCalled();
    });
  });
}); 