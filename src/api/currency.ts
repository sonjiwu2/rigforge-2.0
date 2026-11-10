import { ApiError, fetchJson, isAbortError } from './vantaspec';
import type { CurrencyCode } from '../types';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
  digits: number;
}

export interface RatesResult {
  rates: Record<CurrencyCode, number>;
  date: string | null;
  source: string;
}

export interface LoadRatesOptions {
  signal?: AbortSignal;
}

interface RawRatesResponse {
  date?: unknown;
  gbp?: { usd?: unknown; rub?: unknown } | null;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  GBP: { code: 'GBP', symbol: '£', label: 'GBP £', locale: 'en-GB', digits: 2 },
  USD: { code: 'USD', symbol: '$', label: 'USD $', locale: 'en-US', digits: 2 },
  RUB: { code: 'RUB', symbol: '₽', label: 'RUB ₽', locale: 'ru-RU', digits: 0 },
};

const RATES_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/gbp.min.json';
const RATES_FALLBACK_URL = 'https://latest.currency-api.pages.dev/v1/currencies/gbp.min.json';

let cachedRates: RatesResult | null = null;

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

async function fetchRates(url: string, signal?: AbortSignal): Promise<RatesResult> {
  const json = await fetchJson(url, { signal });
  const data = json as RawRatesResponse | null;
  const gbp = data && data.gbp;
  if (!gbp || !isPositiveNumber(gbp.usd) || !isPositiveNumber(gbp.rub)) {
    throw new ApiError('format', 'Курсы валют пришли в непонятном формате.');
  }
  return {
    rates: { GBP: 1, USD: gbp.usd, RUB: gbp.rub },
    date: data && typeof data.date === 'string' ? data.date : null,
    source: 'Currency-api',
  };
}

export async function loadRates({ signal }: LoadRatesOptions = {}): Promise<RatesResult> {
  if (cachedRates) return cachedRates;

  let result: RatesResult;
  try {
    result = await fetchRates(RATES_URL, signal);
  } catch (err) {
    if (isAbortError(err)) throw err;
    try {
      result = await fetchRates(RATES_FALLBACK_URL, signal);
    } catch (err2) {
      if (isAbortError(err2)) throw err2;
      const apiError = err2 instanceof ApiError ? err2 : null;
      throw new ApiError(apiError ? apiError.kind : 'network', 'Не удалось загрузить курсы валют. Цены показаны в фунтах.', {
        status: apiError ? apiError.status : null,
        retryAfter: apiError ? apiError.retryAfter : null,
      });
    }
  }
  cachedRates = result;
  return result;
}
