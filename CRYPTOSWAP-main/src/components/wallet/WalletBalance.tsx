import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function WalletBalance() {
  const { publicKey, connected } = useWallet();

  // Aquí podrías usar hooks para obtener el balance real
  // Por ahora solo muestra la clave pública

  if (!connected) return null;

  return (
    <div className="text-sm text-foreground bg-card rounded px-2 py-1">
      Wallet: {publicKey?.toBase58()}
    </div>
  );
} 