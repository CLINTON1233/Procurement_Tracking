export const CURRENCIES = [
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', rate: 1 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 15700 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 17000 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 11600 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 19800 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 105 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 10200 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 2170 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 3350 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rate: 435 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 11.5 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 188 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', rate: 4180 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rate: 4270 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 2000 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', rate: 17500 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 11500 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 9500 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', rate: 170 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 3100 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 850 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', rate: 480 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', rate: 870 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', rate: 280 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', rate: 0.64 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', rate: 56 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 142 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', rate: 51 },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', rate: 117 },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', rate: 12 },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', rate: 22100 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', rate: 51200 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', rate: 41600 },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', rate: 40800 },
  { code: 'QAR', name: 'Qatari Rial', symbol: '﷼', rate: 4310 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', rate: 510 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', rate: 1560 },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', rate: 5050 },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', rate: 117 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rate: 38 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', rate: 1280 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', rate: 118 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', rate: 4.2 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', rate: 6.1 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', rate: 275 },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', rate: 350 },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', rate: 1150 },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', rate: 1015 },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', rate: 180 },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', rate: 0.37 },
];

export const getCurrencySymbol = (code) => {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : code;
};

// Fungsi konversi yang benar (via IDR sebagai base)
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = CURRENCIES.find(c => c.code === fromCurrency)?.rate || 1;
  const toRate = CURRENCIES.find(c => c.code === toCurrency)?.rate || 1;
  
  // Konversi ke IDR dulu, baru ke mata uang tujuan
  const amountInIDR = amount * fromRate;
  return amountInIDR / toRate;
};

// Format currency dengan simbol yang benar
export const formatCurrency = (amount, currencyCode = 'IDR') => {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency ? currency.symbol : currencyCode;
  
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
  
  return `${symbol} ${formatted}`;
};

// Konversi ke IDR
export const convertToIDR = (amount, fromCurrency) => {
  if (fromCurrency === 'IDR') return amount;
  const currency = CURRENCIES.find(c => c.code === fromCurrency);
  return amount * (currency?.rate || 1);
};

// Format IDR
export const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

// Format dengan opsi konversi
export const formatWithConvert = (amount, fromCurrency, toCurrency = null) => {
  if (toCurrency && fromCurrency !== toCurrency) {
    const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
    return formatCurrency(convertedAmount, toCurrency);
  }
  return formatCurrency(amount, fromCurrency);
};