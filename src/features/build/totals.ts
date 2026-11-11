import { CURRENCIES } from '../../api/currency';
import { CATEGORIES } from '../../data/catalog';
import { convertFromGbp, convertToGbp, formatMoney, formatPrice, pluralRu } from '../../utils/format';
import type { ConvertedMoney } from '../../utils/format';
import type { Build, BuildTotals, CurrencyCode, Money, TypedBudget } from '../../types';

export type BudgetInfo =
  | { kind: 'none' }
  | { kind: 'incomplete' }
  | { kind: 'left'; diff: number; percent: number; currency: CurrencyCode }
  | { kind: 'over'; diff: number; percent: number; currency: CurrencyCode };

export function countText(n: number, forms: string[]): string {
  return `${n} ${pluralRu(n, forms)}`;
}

export function calculateBuildTotals(build: Build): BuildTotals {
  let count = 0;
  let unknownCount = 0;
  let knownTotalMinor = 0;
  const currencies = new Set<string>();

  for (const category of CATEGORIES) {
    const part = build.slots[category.id];
    if (!part) continue;
    count++;
    if (part.priceMinor !== null && Number.isSafeInteger(part.priceMinor)) {
      knownTotalMinor += part.priceMinor;
      currencies.add(part.currency || build.currency || 'GBP');
    } else {
      unknownCount++;
    }
  }

  const mixedCurrencies = currencies.size > 1;
  return {
    count,
    knownTotalMinor: mixedCurrencies ? null : knownTotalMinor,
    unknownCount,
    currency: mixedCurrencies ? null : [...currencies][0] || build.currency || 'GBP',
    mixedCurrencies,
  };
}

export function getDisplayCurrency(money: Money): CurrencyCode {
  return convertFromGbp(0, money).currency;
}

export function priceText(minor: number | null, currency: string | null, money: Money): string {
  if (!currency || currency === 'GBP') return formatPrice(minor, money);
  return formatMoney(minor, currency);
}

function roundForDisplay(minor: number, currency: CurrencyCode): number {
  return CURRENCIES[currency].digits === 0 ? Math.round(minor / 100) * 100 : minor;
}

function trailingZeros(value: number): number {
  let rest = value;
  let count = 0;
  while (rest > 0 && rest % 10 === 0 && count < 12) {
    rest /= 10;
    count++;
  }
  return count;
}

export function budgetInCurrency(
  budgetMinor: number,
  money: Money,
  typed: TypedBudget | null = null,
): ConvertedMoney {
  const converted = convertFromGbp(budgetMinor, money);
  if (converted.minor === null || converted.currency === 'GBP' || !money.rates) return converted;
  if (typed && typed.currency === converted.currency && convertToGbp(typed.minor, money) === budgetMinor) {
    return { minor: typed.minor, currency: typed.currency };
  }
  const rate = money.rates[converted.currency];
  const from = Math.floor((budgetMinor - 0.5) * rate) - 1;
  const to = Math.ceil((budgetMinor + 0.5) * rate) + 1;
  let best = converted.minor;
  for (let minor = Math.max(from, 1); minor <= to; minor++) {
    if (convertToGbp(minor, money) !== budgetMinor) continue;
    const better =
      trailingZeros(minor) - trailingZeros(best) ||
      Math.abs(best - converted.minor) - Math.abs(minor - converted.minor);
    if (better > 0) best = minor;
  }
  return { minor: best, currency: converted.currency };
}

export function formatRateDate(date: string | null): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
  return match ? `${match[3]}.${match[2]}.${match[1]}` : null;
}

export function rateNote(money: Money): string {
  if (getDisplayCurrency(money) === 'GBP') return '';
  const date = formatRateDate(money.date);
  return date ? `≈ по курсу на ${date}` : '≈ по текущему курсу';
}

export function getBudgetInfo(
  build: Build,
  totals: BuildTotals,
  money: Money,
  typed: TypedBudget | null,
): BudgetInfo {
  if (build.budgetMinor === null) return { kind: 'none' };
  if (totals.mixedCurrencies || totals.unknownCount > 0) return { kind: 'incomplete' };
  if (totals.currency !== build.currency || totals.knownTotalMinor === null) return { kind: 'incomplete' };
  const budget = budgetInCurrency(build.budgetMinor, money, typed);
  const total = convertFromGbp(totals.knownTotalMinor, money);
  if (budget.minor === null || total.minor === null) return { kind: 'incomplete' };
  const budgetValue = roundForDisplay(budget.minor, budget.currency);
  const totalValue = roundForDisplay(total.minor, total.currency);
  const diff = budgetValue - totalValue;
  const percent = Math.min(100, Math.max(0, Math.round((totals.knownTotalMinor / build.budgetMinor) * 100)));
  const currency = budget.currency;
  return diff >= 0 ? { kind: 'left', diff, percent, currency } : { kind: 'over', diff: -diff, percent: 100, currency };
}
