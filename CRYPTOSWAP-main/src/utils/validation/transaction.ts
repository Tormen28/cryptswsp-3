/**
 * Interfaz para el resultado de la validación
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Interfaz para una transacción
 */
export interface Transaction {
  from: string;
  to: string;
  amount: number;
  token: string;
}

/**
 * Valida una transacción
 * @param tx - Transacción a validar
 * @returns Resultado de la validación
 */
export const validateTransaction = (tx: Transaction): ValidationResult => {
  const errors: string[] = [];

  // Validar dirección de origen
  if (!tx.from || tx.from.length !== 44) {
    errors.push('Dirección de origen inválida');
  }

  // Validar dirección de destino
  if (!tx.to || tx.to.length !== 44) {
    errors.push('Dirección de destino inválida');
  }

  // Validar monto
  if (tx.amount <= 0) {
    errors.push('El monto debe ser mayor que 0');
  }

  // Validar token
  if (!tx.token) {
    errors.push('Token no especificado');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}; 