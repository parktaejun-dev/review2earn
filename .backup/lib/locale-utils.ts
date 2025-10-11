// 📂 src/lib/locale-utils.ts
// Review2Earn v6.0 - Locale & i18n Utilities

export const SUPPORTED_LOCALES = {
  'ko-KR': { name: '한국어', currency: 'KRW' },
  'en-US': { name: 'English', currency: 'USD' },
  'ja-JP': { name: '日本語', currency: 'JPY' },
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES;

export const DEFAULT_LOCALE: SupportedLocale = 
  (process.env.DEFAULT_LOCALE as SupportedLocale) || 'ko-KR';

export function formatDate(
  date: Date | string,
  locale?: SupportedLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  const finalLocale = locale || DEFAULT_LOCALE;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  };
  
  return dateObj.toLocaleDateString(finalLocale, defaultOptions);
}

export function formatCurrency(
  amount: number,
  locale?: SupportedLocale
): string {
  const finalLocale = locale || DEFAULT_LOCALE;
  const currency = SUPPORTED_LOCALES[finalLocale].currency;
  
  return new Intl.NumberFormat(finalLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}
