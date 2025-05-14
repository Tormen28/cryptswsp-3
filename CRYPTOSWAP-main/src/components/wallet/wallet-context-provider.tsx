
"use client";

import type { FC, ReactNode } from "react";
import React, { useMemo, useCallback } from "react"; // Import useCallback
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base"; // Import WalletError
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, Connection } from "@solana/web3.js"; // Import Connection
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Import styles using the standard import statement
import "@solana/wallet-adapter-react-ui/styles.css";


type WalletContextProviderProps = {
  children: ReactNode;
};

export const WalletContextProvider: FC<WalletContextProviderProps> = ({
  children,
}) => {
  const { toast } = useToast(); // Get toast function

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Testnet; // Changed to Testnet

  // You can also provide a custom RPC endpoint.
  // Consider using a reliable public RPC or your own node for production.
  // List of public RPCs: https://docs.solana.com/cluster/rpc-endpoints
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // Example using a specific public RPC:
  // const endpoint = "https://api.testnet.solana.com";
  // const endpoint = "https://testnet.solana.genesysgo.net/";


  // Initialize Connection object (optional but can be useful for other hooks/components)
  // const connection = useMemo(() => new Connection(endpoint), [endpoint]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }), // Ensure Solflare uses the correct network
      // Add other wallets like Sollet, Ledger, etc. if needed by installing their specific adapter packages
    ],
    [network]
  );

  // Define onError callback
  const onError = useCallback(
    (error: WalletError) => {
      // Log the raw error received for debugging purposes
      console.error("Raw Wallet Error:", error);

      // Don't show toast for WalletDisconnectionError when already disconnected
      // This specifically handles the "Wallet not connected" error during disconnect attempts.
      if (error.name === 'WalletDisconnectionError' && error.message === 'Wallet not connected') {
         console.warn("Attempted to disconnect wallet when not connected.");
         return; // Exit early, preventing the generic error toast for this specific case.
      }

      // Handle specific connection errors more gracefully
      // Includes WalletConnectionError (e.g., user rejection), WalletNotReadyError, WalletNotFound
      if (error.name === 'WalletConnectionError' || error.name === 'WalletNotReadyError' || error.name === 'WalletNotFound') {
        let message = 'Wallet interaction failed. Please ensure your wallet is installed, unlocked, and ready, or try connecting again.'; // More generic default

        // Refine message based on error type if the original message is available and meaningful
        if (error.message && error.message.trim() && error.message.trim() !== '.') {
             message = error.message; // Use specific message (e.g., "Connection rejected.")
        } else if (error.name === 'WalletConnectionError') {
             message = 'Connection failed. The wallet might not be available, the connection was rejected, or an unknown error occurred.'; // Specific default for connection error
        } else if (error.name === 'WalletNotReadyError') {
             message = 'Wallet not ready. Please ensure your wallet extension is active and unlocked.'; // Specific default for not ready error
        } else if (error.name === 'WalletNotFound') {
            message = 'Wallet not found. Please ensure the wallet extension is installed.'; // Specific default for not found error
        }

        console.warn(`Wallet Issue (${error.name}): ${message}`, error); // Enhanced logging
        // Show a less intrusive toast for connection issues
        toast({
          title: `Wallet ${error.name.replace('Wallet', '')} Error`, // e.g., "Connection Error"
          description: message,
          variant: "default", // Use default variant instead of destructive
        });
        return; // Prevent the default destructive toast for these common cases
      }

      // For other, potentially more serious or unexpected errors, show a destructive toast
      console.error("Unhandled Wallet Error:", error); // Log the full error object for unexpected cases
      toast({
        title: "Wallet Error",
        description: error.message ? `${error.name}: ${error.message}` : error.name,
        variant: "destructive",
      });
    },
    [toast] // Add toast to dependency array
  );


  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* Pass onError handler to WalletProvider */}
      {/* autoConnect={true} can sometimes cause issues if the wallet is locked or requires interaction */}
      <WalletProvider wallets={wallets} onError={onError} autoConnect={false}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

