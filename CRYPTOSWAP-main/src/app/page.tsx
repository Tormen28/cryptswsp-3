"use client";

import { useState } from 'react'; // Import useState
// import { ClientWalletMultiButton } from "@/components/client-wallet-multi-button";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { TransactionHistory } from "@/components/transaction-history";
import { WalletIcon, Settings, History, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components for Dashboard placeholder
import { AutoSwapStatus } from '@/components/defi/auto-swap-status';
import { useAutoSwap } from '@/hooks/use-auto-swap';
import { Button } from '@/components/ui/button';
import { AutoSwapSettings } from '@/components/defi/auto-swap-settings';


type ActiveView = 'dashboard' | 'settings' | 'history';

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard'); // State for active view
  const { config, loading, saveConfig } = useAutoSwap();

  const handleToggleAutoSwap = async () => {
    if (!config) return;
    await saveConfig({ ...config, autoSwapEnabled: !config.autoSwapEnabled });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Card className="bg-card text-card-foreground shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" /> Dashboard Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Tokens configurados para AutoSwap:</p>
              <div className="mb-4">
                <AutoSwapStatus />
                {config && (
                  <Button
                    className="mt-4"
                    variant={config.autoSwapEnabled ? 'destructive' : 'default'}
                    onClick={handleToggleAutoSwap}
                    disabled={loading}
                  >
                    {config.autoSwapEnabled ? 'Desactivar AutoSwap' : 'Activar AutoSwap'}
                  </Button>
                )}
              </div>
              {/* Lista profesional de tokens configurados */}
              {config && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Tokens configurados</h3>
                  {config.tokens.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No hay tokens configurados.</div>
                  ) : (
                    <table className="min-w-full text-sm bg-muted/50 rounded-lg">
                      <thead>
                        <tr>
                          <th className="p-2 text-left">Activo</th>
                          <th className="p-2 text-left">Símbolo</th>
                          <th className="p-2 text-left">Contrato del token</th>
                          <th className="p-2 text-left">Stablecoin</th>
                          <th className="p-2 text-left">Slippage (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {config.tokens.map(token => (
                          <tr key={token.symbol + token.mint} className="border-b last:border-0">
                            <td className="p-2 text-center">
                              <input type="checkbox" checked={token.enabled} readOnly className="accent-blue-600" />
                            </td>
                            <td className="p-2 font-medium">{token.symbol}</td>
                            <td className="p-2 font-mono text-xs truncate max-w-[180px]">{token.mint}</td>
                            <td className="p-2">{token.targetStablecoin}</td>
                            <td className="p-2">{token.slippage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      case 'settings':
        return <AutoSwapSettings />;
      case 'history':
        return <TransactionHistory />;
      default:
        return null;
    }
  };

  const getHeaderTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard';
      case 'settings':
        return 'Configuración';
      case 'history':
        return 'Transaction History';
      default:
        return 'AutoSwap';
    }
  };


  return (
    <SidebarProvider>
      <div className="flex h-screen bg-secondary">
        <Sidebar collapsible="icon">
          <SidebarHeader className="flex items-center justify-between p-4">
             <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-accent">
                <path fillRule="evenodd" d="M15.97 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H7.5a.75.75 0 0 1 0-1.5h11.69l-3.22-3.22a.75.75 0 0 1 0-1.06Zm-7.94 9a.75.75 0 0 1 0 1.06l-3.22 3.22H16.5a.75.75 0 0 1 0 1.5H4.81l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
              </svg>
              <span className="text-lg font-semibold text-foreground group-data-[collapsible=icon]:hidden">AutoSwap</span>
             </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Dashboard"
                  isActive={activeView === 'dashboard'}
                  onClick={() => setActiveView('dashboard')} // Set active view
                >
                   <LayoutDashboard />
                   <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton
                   tooltip="Configuración"
                   isActive={activeView === 'settings'}
                   onClick={() => setActiveView('settings')} // Set active view
                 >
                   <Settings />
                   <span>Configuración</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton
                   tooltip="Transaction History"
                   isActive={activeView === 'history'}
                   onClick={() => setActiveView('history')} // Set active view
                 >
                   <History />
                   <span>History</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
             <div className="group-data-[collapsible=icon]:hidden">
                {/* Placeholder for ClientWalletMultiButton */}
             </div>
              <div className="hidden group-data-[collapsible=icon]:flex justify-center">
                {/* Placeholder for ClientWalletMultiButton */}
              </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <header className="flex items-center justify-between p-4 border-b bg-card">
             <div className="flex items-center gap-2">
               <SidebarTrigger className="md:hidden"/>
               <h1 className="text-xl font-semibold text-foreground">{getHeaderTitle()}</h1> {/* Dynamic Header Title */}
             </div>
             <div className="hidden md:block">
               {/* Placeholder for ClientWalletMultiButton */}
             </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
             {/* Render content based on activeView state */}
             {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
