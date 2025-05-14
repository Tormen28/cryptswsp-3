/**
 * Formatea un número como moneda
 * @param amount - Cantidad a formatear
 * @param currency - Código de moneda (ej: 'USD', 'EUR')
 * @param locale - Localización para el formateo (ej: 'es-ES', 'en-US')
 * @returns String formateado como moneda
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formatea un número como porcentaje
 * @param value - Valor a formatear (0-1)
 * @param locale - Localización para el formateo
 * @returns String formateado como porcentaje
 */
export const formatPercentage = (
  value: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}; 