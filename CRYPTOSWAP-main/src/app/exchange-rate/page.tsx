import React from 'react';

export default function ExchangeRatePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#2d223a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ color: 'white', fontSize: 40, fontWeight: 700, marginBottom: 40 }}>Exchange Rate</h1>
      <div style={{
        background: 'rgba(60, 45, 80, 0.95)',
        borderRadius: 20,
        padding: 32,
        minWidth: 340,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        marginBottom: 32
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16,
          padding: '18px 24px',
          marginBottom: 8
        }}>
          <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=029" alt="BTC" style={{ width: 40, height: 40, marginRight: 16 }} />
          <span style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>1 Bitcoin</span>
          <span style={{ flex: 1 }} />
          <span style={{ color: '#b9a7e6', fontSize: 24, fontWeight: 600 }}>{'>'}</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 16,
          padding: '18px 24px',
        }}>
          <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=029" alt="USDC" style={{ width: 40, height: 40, marginRight: 16 }} />
          <span style={{ color: 'white', fontSize: 24, fontWeight: 600 }}>USDC 24,219.34</span>
        </div>
      </div>
      <button style={{
        background: '#6c4fd3',
        color: 'white',
        fontSize: 22,
        fontWeight: 600,
        border: 'none',
        borderRadius: 14,
        padding: '16px 80px',
        cursor: 'pointer',
        boxShadow: '0 2px 12px 0 rgba(108,79,211,0.15)'
      }}>OK</button>
    </div>
  );
} 