import { CURRENCIES } from './currency';

// Format currency sesuai dengan mata uang asli budget
export const formatOriginalCurrency = (amount, currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  
  if (!currency) {
    // Fallback ke format IDR jika currency tidak ditemukan
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  }

  // Format dengan mata uang asli
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format currency dengan simbol saja (tanpa kode mata uang)
export const formatWithSymbol = (amount, currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
  
  return `${symbol} ${formatted}`;
};

// Mendapatkan simbol mata uang
export const getSymbol = (currencyCode) => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

// Format untuk tampilan di tabel (dengan simbol)
export const formatTableCurrency = (amount, currencyCode) => {
  const symbol = getSymbol(currencyCode);
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
  
  return `${symbol} ${formatted}`;
};