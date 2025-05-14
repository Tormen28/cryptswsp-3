import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../useWallet';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { WALLET_CONFIG } from '@/config/solana';

// Mock de localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('useWallet', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WalletProvider wallets={[]} autoConnect={WALLET_CONFIG.AUTO_CONNECT}>
      {children}
    </WalletProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería inicializar correctamente', () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    expect(result.current.connected).toBeFalsy();
    expect(result.current.connecting).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it('debería manejar la conexión de wallet', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connectWallet('Phantom');
    });

    expect(result.current.error).toBeNull();
  });

  it('debería manejar errores de conexión', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connectWallet('WalletNoExistente');
    });

    expect(result.current.error).toBeTruthy();
  });

  it('debería guardar la última wallet usada', async () => {
    const { result } = renderHook(() => useWallet(), { wrapper });

    await act(async () => {
      await result.current.connectWallet('Phantom');
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastWallet', 'Phantom');
  });
}); 