/**
 * Utility functions for formatting data
 */

/**
 * Formats a document number (CPF or CNPJ) to Brazilian format
 * CPF: 000.000.000-00
 * CNPJ: 00.000.000/0000-00
 */
export const formatDocument = (documentNumber?: string | number): string => {
  if (!documentNumber) return '';
  const docStr = String(documentNumber).replace(/\D/g, '');
  
  if (docStr.length === 11) {
    // CPF: 000.000.000-00
    return docStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (docStr.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return docStr.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  // If not CPF or CNPJ, return as is
  return docStr;
};

/**
 * Removes formatting from document number (returns only numbers)
 */
export const parseDocument = (document: string): string => {
  return document.replace(/\D/g, '');
};

/**
 * Formats currency value to Brazilian format (R$ 1.234,56)
 */
export const formatCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (!numbers) return '';
  
  const cents = parseInt(numbers, 10);
  const real = cents / 100;
  
  return real.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Converts Brazilian currency format to number (e.g: "1.234,56" -> 1234.56)
 * If empty, returns 0.00
 */
export const parseCurrency = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const numbers = trimmed.replace(/\D/g, '');
  if (!numbers) return 0;
  return parseFloat(numbers) / 100;
};

/**
 * Validates and formats stock (accepts numbers, period and comma, but converts to integer)
 */
export const formatStock = (value: string): string => {
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  if (!cleaned) return '';
  
  const num = parseFloat(cleaned);
  if (isNaN(num)) return '';
  
  // Return only integer (no decimals)
  return Math.floor(num).toString();
};

/**
 * Converts stock to integer (accepts period or comma, but converts to integer)
 * If empty, returns 0
 */
export const parseStock = (value: string): number => {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const cleaned = trimmed.replace(/[^\d.,]/g, '').replace(',', '.');
  if (!cleaned) return 0;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.floor(parsed);
};

/**
 * Formats date to Brazilian format (dd/mm/yyyy hh:mm)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Formats date to Brazilian format (dd/mm/yyyy)
 */
export const formatDateOnly = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Formats currency number to Brazilian locale string
 */
export const formatCurrencyNumber = (amount: number): string => {
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

