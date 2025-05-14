import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        auto_swap: 'Auto-Swap',
        tokens_to_convert: 'Tokens to Convert',
        destination_stablecoin: 'Destination Stablecoin',
        slippage: 'Slippage',
        save: 'Save',
        saving: 'Saving...',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export default i18n; 