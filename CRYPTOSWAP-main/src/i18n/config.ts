'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          // Navigation
          "nav": {
            "home": "Home",
            "limit": "Limit",
            "farms": "Farms"
          },
          
          // Wallet
          "wallet.connect": "Connect Wallet",
          "wallet.disconnect": "Disconnect",
          "wallet.balance": "Balance",
          
          // Common
          "common.loading": "Loading...",
          "common.error": "Error",
          "common.success": "Success",
          "common.confirm": "Confirm",
          "common.cancel": "Cancel"
        }
      },
      es: {
        translation: {
          // Navegación
          "nav": {
            "home": "Inicio",
            "limit": "Limit",
            "farms": "Granjas"
          },
          
          // Wallet
          "wallet.connect": "Conectar Wallet",
          "wallet.disconnect": "Desconectar",
          "wallet.balance": "Balance",
          
          // Común
          "common.loading": "Cargando...",
          "common.error": "Error",
          "common.success": "Éxito",
          "common.confirm": "Confirmar",
          "common.cancel": "Cancelar"
        }
      }
    }
  });

export default i18n; 