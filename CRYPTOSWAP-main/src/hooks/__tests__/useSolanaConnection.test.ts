import { renderHook, act } from '@testing-library/react';
import { useSolanaConnection } from '../useSolanaConnection';
import { Connection, PublicKey } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/config/solana';

// Mock de Connection
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getVersion: jest.fn().mockResolvedValue({ 'solana-core': '1.0.0' }),
    getBalance: jest.fn().mockResolvedValue(1000000000),
    getParsedTokenAccountsByOwner: jest.fn().mockResolvedValue([]),
  })),
  PublicKey: jest.fn().mockImplementation(() => ({
    toString: () => 'mockPublicKey',
  })),
}));

describe('useSolanaConnection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería inicializar la conexión correctamente', async () => {
    const { result } = renderHook(() => useSolanaConnection());

    expect(result.current.isConnecting).toBeTruthy();
    expect(result.current.error).toBeNull();

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.connection).toBeInstanceOf(Connection);
    expect(result.current.isConnecting).toBeFalsy();
  });

  it('debería obtener el balance correctamente', async () => {
    const { result } = renderHook(() => useSolanaConnection());
    const mockPublicKey = new PublicKey('mockPublicKey');

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const balance = await result.current.getBalance(mockPublicKey);
    expect(balance).toBe(1000000000);
  });

  it('debería manejar errores de conexión', async () => {
    const mockError = new Error('Error de conexión');
    (Connection as jest.Mock).mockImplementationOnce(() => ({
      getVersion: jest.fn().mockRejectedValue(mockError),
    }));

    const { result } = renderHook(() => useSolanaConnection());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.isConnecting).toBeFalsy();
  });

  it('debería obtener las cuentas de tokens correctamente', async () => {
    const { result } = renderHook(() => useSolanaConnection());
    const mockPublicKey = new PublicKey('mockPublicKey');

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const tokenAccounts = await result.current.getTokenAccounts(mockPublicKey);
    expect(Array.isArray(tokenAccounts)).toBeTruthy();
  });
}); 