import { CURRENCIES } from '../api/currency';
import type { CurrencyInfo } from '../api/currency';
import type { CurrencyCode, Money } from '../types';

export interface ConvertedMoney {
  minor: number | null;
  currency: CurrencyCode;
}

const formatters = new Map<string, Intl.NumberFormat>();

function getCurrencyInfo(code: string): CurrencyInfo | null {
  if (code === 'GBP' || code === 'USD' || code === 'RUB') return CURRENCIES[code];
  return null;
}

function getFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    const info = getCurrencyInfo(currency);
    const digits = info ? info.digits : 2;
    formatter = new Intl.NumberFormat(info ? info.locale : 'en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}

export function formatMoney(
  priceMinor: number | null,
  currency: string | null = 'GBP',
): string {
  if (priceMinor === null || !Number.isFinite(priceMinor)) {
    return 'Цена не указана';
  }
  const code = currency || 'GBP';
  try {
    return getFormatter(code).format(priceMinor / 100);
  } catch {
    return `${(priceMinor / 100).toFixed(2)} ${code}`;
  }
}

function getRate(money: Money): number | null {
  if (money.currency === 'GBP' || !money.rates) return null;
  return money.rates[money.currency];
}

export function convertFromGbp(minorGbp: number | null, money: Money): ConvertedMoney {
  const rate = getRate(money);
  if (minorGbp === null || !Number.isFinite(minorGbp)) {
    return { minor: null, currency: rate ? money.currency : 'GBP' };
  }
  if (!rate) return { minor: Math.round(minorGbp), currency: 'GBP' };
  return { minor: Math.round(minorGbp * rate), currency: money.currency };
}

export function convertToGbp(minor: number | null, money: Money): number | null {
  if (minor === null || !Number.isFinite(minor)) return null;
  const rate = getRate(money);
  if (!rate) return Math.round(minor);
  return Math.round(minor / rate);
}

export function formatPrice(minorGbp: number | null, money: Money): string {
  if (minorGbp === null || !Number.isFinite(minorGbp)) {
    return 'Цена не указана';
  }
  const converted = convertFromGbp(minorGbp, money);
  return formatMoney(converted.minor, converted.currency);
}

export function parseMoneyInput(text: string): number | null {
  let s = text.replace(/[£$₽\s  ]/g, '');
  if (s === '' || s.includes('-')) return null;

  const lastComma = s.lastIndexOf(',');
  if (lastComma !== -1 && !s.includes('.') && /^,\d{1,2}$/.test(s.slice(lastComma))) {
    s = s.slice(0, lastComma) + '.' + s.slice(lastComma + 1);
  }

  const match = s.match(/^(\d{1,3}(?:,\d{3})+|\d*)(?:\.(\d*))?$/);
  if (!match) return null;
  const intPart = match[1].replace(/,/g, '');
  const fracPart = match[2] || '';
  if (intPart === '' && fracPart === '') return null;

  const pounds = Number(intPart || '0');
  const pence = Number((fracPart + '00').slice(0, 2));
  const roundUp = fracPart.length > 2 && Number(fracPart[2]) >= 5 ? 1 : 0;
  const result = pounds * 100 + pence + roundUp;
  return Number.isSafeInteger(result) ? result : null;
}

export function pluralRu(n: number, forms: string[]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}
