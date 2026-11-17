import { CURRENCIES } from '../../api/currency';
import { convertFromGbp, convertToGbp, parseMoneyInput } from '../../utils/format';
import type { CatalogFilters, CurrencyCode, Money } from '../../types';

export interface FilterDraft {
  brands: string[];
  specs: Record<string, string[]>;
  minText: string;
  maxText: string;
}

interface FilterCheck {
  values: CatalogFilters | null;
  error: string;
  invalidMin: boolean;
  invalidMax: boolean;
}

export const NO_FILTER_ERRORS: FilterCheck = { values: null, error: '', invalidMin: false, invalidMax: false };

export const EMPTY_FILTERS: CatalogFilters = { brands: [], specs: {}, priceMin: null, priceMax: null };

export function shownCurrency(money: Money): CurrencyCode {
  return convertFromGbp(0, money).currency;
}

function minorToInput(valueGbp: number | null, money: Money): string {
  if (valueGbp === null) return '';
  const { minor, currency } = convertFromGbp(valueGbp, money);
  if (minor === null) return '';
  if (CURRENCIES[currency].digits === 0) return String(Math.round(minor / 100));
  return minor % 100 === 0 ? String(minor / 100) : (minor / 100).toFixed(2);
}

export function priceLegend(money: Money): string {
  return `Цена, ${CURRENCIES[shownCurrency(money)].symbol}`;
}

export function countActiveFilters(filters: CatalogFilters): number {
  let count = filters.brands.length;
  for (const values of Object.values(filters.specs)) count += values.length;
  if (filters.priceMin !== null) count += 1;
  if (filters.priceMax !== null) count += 1;
  return count;
}

export function draftFromFilters(filters: CatalogFilters, money: Money): FilterDraft {
  return {
    brands: filters.brands,
    specs: filters.specs,
    minText: minorToInput(filters.priceMin, money),
    maxText: minorToInput(filters.priceMax, money),
  };
}

function readPrice(text: string, current: number | null, money: Money): number | null {
  if (text === minorToInput(current, money)) return current;
  const minor = parseMoneyInput(text);
  return minor === null ? null : convertToGbp(minor, money);
}

export function checkDraft(draft: FilterDraft, filters: CatalogFilters, money: Money): FilterCheck {
  const minText = draft.minText.trim();
  const maxText = draft.maxText.trim();
  const priceMin = minText ? readPrice(minText, filters.priceMin, money) : null;
  const priceMax = maxText ? readPrice(maxText, filters.priceMax, money) : null;
  const invalidMin = minText !== '' && priceMin === null;
  const invalidMax = maxText !== '' && priceMax === null;

  let error = '';
  if (invalidMin || invalidMax) {
    error = 'Введите цену числом, например 150 или 149.99';
  } else if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
    error = '«Цена от» не может быть больше «Цена до»';
  }

  return {
    values: error ? null : { brands: draft.brands, specs: draft.specs, priceMin, priceMax },
    error,
    invalidMin,
    invalidMax,
  };
}

export function sameFilters(values: CatalogFilters, filters: CatalogFilters): boolean {
  return (
    JSON.stringify([values.brands, values.specs, values.priceMin, values.priceMax]) ===
    JSON.stringify([filters.brands, filters.specs, filters.priceMin, filters.priceMax])
  );
}
