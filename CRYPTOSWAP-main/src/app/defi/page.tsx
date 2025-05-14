'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Staking } from '@/components/defi/staking';
import { Farming } from '@/components/defi/farming';  // Asegúrate de que esta ruta sea correcta
import { Lending } from '@/components/defi/lending';  // Asegúrate de que esta ruta sea correcta
import { Settings } from '@/components/defi/settings';
import { useTranslation } from 'react-i18next';

export default function DeFiPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('swap');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">DeFi</h1>
      
      <Tabs defaultValue="swap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="swap">Swap</TabsTrigger>
          <TabsTrigger value="staking">Staking</TabsTrigger>
          <TabsTrigger value="farming">Farming</TabsTrigger>
          <TabsTrigger value="lending">Préstamos</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="swap">
          <Card>
            <CardHeader>
              <CardTitle>Swap de Tokens</CardTitle>
            </CardHeader>
            <CardContent>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staking">
          <Card>
            <CardHeader>
              <CardTitle>Staking de Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <Staking />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="farming">
          <Card>
            <CardHeader>
              <CardTitle>Farming de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <Farming />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lending">
          <Card>
            <CardHeader>
              <CardTitle>Préstamos DeFi</CardTitle>
            </CardHeader>
            <CardContent>
              <Lending />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <Settings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}