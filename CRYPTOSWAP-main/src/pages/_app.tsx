import type { AppProps } from 'next/app';
import { SolanaWalletProvider } from '@/components/providers/wallet-provider';
import '../app/globals.css';
import React, { useState, useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SolanaWalletProvider>
      <Component {...pageProps} />
    </SolanaWalletProvider>
  );
} 