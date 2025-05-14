'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Trash2 } from 'lucide-react';

interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  condition: 'above' | 'below';
}

export function PriceAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newAlert, setNewAlert] = useState({
    symbol: '',
    price: '',
    condition: 'above' as const
  });

  const addAlert = () => {
    if (!newAlert.symbol || !newAlert.price) return;

    const alert: PriceAlert = {
      id: Math.random().toString(36).substr(2, 9),
      symbol: newAlert.symbol.toUpperCase(),
      price: parseFloat(newAlert.price),
      condition: newAlert.condition
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ symbol: '', price: '', condition: 'above' });
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas de Precio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Símbolo (ej: SOL)"
              value={newAlert.symbol}
              onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Precio"
              value={newAlert.price}
              onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
            />
            <Select
              value={newAlert.condition}
              onValueChange={(value: 'above' | 'below') => 
                setNewAlert({ ...newAlert, condition: value })
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Condición" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Por encima</SelectItem>
                <SelectItem value="below">Por debajo</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addAlert}>
              <Bell className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>

          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{alert.symbol}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.condition === 'above' ? 'Por encima de' : 'Por debajo de'} ${alert.price}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAlert(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 