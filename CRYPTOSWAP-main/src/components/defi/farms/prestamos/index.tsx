// pages/prestamos.jsx (o .tsx)

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function PrestamosPage() {
  const { publicKey } = useWallet();
  const [viewMode, setViewMode] = useState('supply');

  const renderBorrowView = () => {
    const borrowRates = [
      { token: 'DAI', borrowApr: '4.0%' },
      { token: 'USDC', borrowApr: '3.8%' },
      // ... otros tokens que se pueden pedir prestados
    ];

    const handleBorrow = () => {
      console.log('Lógica para depositar colateral y pedir el préstamo...');
      alert('Funcionalidad de préstamo pendiente de implementar');
    };

    const handleRepay = () => {
      console.log('Lógica para reembolsar el préstamo...');
      alert('Funcionalidad de reembolso pendiente de implementar');
    };

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 font-sans">
        <div className="bg-[#1a1b23] p-6 rounded-xl shadow-2xl text-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L3 9v12h6v-7h6v7h6V9l-9-7zM7 22v-4h10v4"/>
            </svg>
            <h1 className="text-2xl font-bold">Préstamos DeFi</h1>
          </div>

          <div className="flex gap-4 mb-8">
            <button 
              className={`px-6 py-2 rounded-lg ${viewMode === 'supply' ? 'bg-purple-600 text-white' : 'bg-[#0d0e12] text-gray-400'}`}
              onClick={() => setViewMode('supply')}
            >
              Depositar
            </button>
            <button 
              className={`px-6 py-2 rounded-lg ${viewMode === 'borrow' ? 'bg-purple-600 text-white' : 'bg-[#0d0e12] text-gray-400'}`}
              onClick={() => setViewMode('borrow')}
            >
              Pedir prestado
            </button>
          </div>

          {viewMode === 'supply' ? renderSupplyView() : renderBorrowView()}
        </div>
      </div>
    );
  };

  const renderSupplyView = () => {
    // Implementación de la vista de suministro
    return (
      <div>
        {/* Contenido de la vista de suministro */}
      </div>
    );
  };

  return (
    <div>
      {viewMode === 'supply' ? renderSupplyView() : renderBorrowView()}
    </div>
  );
}
