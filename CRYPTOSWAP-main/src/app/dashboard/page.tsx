'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionHistory } from '@/components/transaction-history';
import { PortfolioOverview } from '@/components/dashboard/portfolio-overview';
import { Watchlist } from '@/components/dashboard/watchlist';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>
      
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="portfolio">Portafolio</TabsTrigger>
          <TabsTrigger value="transactions">Historial</TabsTrigger>
          <TabsTrigger value="watchlist">Favoritos</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Portafolio</CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionHistory />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <Watchlist />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 