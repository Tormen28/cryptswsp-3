'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import WalletBalance from '@/components/wallet/WalletBalance';
import { WalletMultiButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ClientOnly } from '@/components/ClientOnly';

export function Navigation() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { connected, disconnect, select, wallets } = useWallet();
  const { setVisible } = useWalletModal();

  const navigationItems = [
    { href: '/', label: t('nav.home') },
    { href: '/limit', label: t('nav.limit') },
    { href: '/farms', label: t('nav.farms') },
  ];

  const handleConnect = () => {
    if (connected) {
      disconnect();
    } else {
      // Seleccionar Phantom por defecto si está disponible
      const phantomWallet = wallets.find(wallet => wallet.adapter.name === 'Phantom');
      if (phantomWallet) {
        select(phantomWallet.adapter.name);
      }
    }
  };

  const handleChangeWallet = async () => {
    await disconnect();
    localStorage.removeItem('walletName');
    localStorage.removeItem('walletAdapter');
    setVisible(true);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">CryptoSwap</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            <ClientOnly>
              <WalletMultiButton />
              {connected && (
                <button onClick={handleChangeWallet} className="ml-2 text-xs underline text-primary">
                  Cambiar wallet
                </button>
              )}
            </ClientOnly>
            <WalletBalance />
          </div>
        </div>
      </div>
    </nav>
  );
} 