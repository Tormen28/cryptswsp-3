import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Correct import for GeistSans from geist package
import './globals.css';
import { ThemeProvider } from '../providers/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { Navigation } from '@/components/navigation';
import '@/i18n/config';
import { Inter } from "next/font/google";
import { SolanaWalletProvider } from '../providers/WalletProvider';
import { I18nProvider } from '../providers/I18nProvider';
// Remove the CSS import here as it's now correctly imported in WalletContextProvider
// import '@solana/wallet-adapter-react-ui/styles.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'CryptoSwap',
  description: 'Automate your Solana token swaps',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} font-sans antialiased ${inter.className}`}> {/* Use GeistSans.variable and font-sans */}
        <I18nProvider>
        <ThemeProvider>
            <SolanaWalletProvider>
            <Navigation />
            <main className="min-h-screen">
              {children}
            </main>
            <Toaster />
            </SolanaWalletProvider>
        </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
