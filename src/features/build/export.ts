import { CATEGORIES } from '../../data/catalog';
import { convertFromGbp, formatMoney, formatPrice, pluralRu } from '../../utils/format';
import { budgetInCurrency, calculateBuildTotals, formatRateDate, getDisplayCurrency } from './totals';
import type { Build, Money } from '../../types';

const SOURCE_TEXT = 'Источник цен: VantaSpec (vantaspec.com), цены на момент добавления в сборку';
const DETAIL_FORMS_GENITIVE = ['детали', 'деталей', 'деталей'];

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function safeFileName(name: string, fallback: string): string {
  const clean = String(name || '')
    .replace(/[\\/:*?"<>|\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 60)
    .trim()
    .replace(/ /g, '-');
  return clean || fallback;
}

function saveFile(content: string, fileName: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function priceWithGbp(minor: number | null, currency: string | null, money: Money): string {
  if (currency && currency !== 'GBP') return formatMoney(minor, currency);
  const text = formatPrice(minor, money);
  if (minor === null || getDisplayCurrency(money) === 'GBP') return text;
  return `${text} (${formatMoney(minor, 'GBP')})`;
}

function rateLine(money: Money): string | null {
  const currency = getDisplayCurrency(money);
  if (currency === 'GBP' || !money.rates) return null;
  const rate = money.rates[currency].toLocaleString('ru-RU', { maximumFractionDigits: 6 });
  const date = formatRateDate(money.date);
  return `Курс: 1 GBP = ${rate} ${currency}${date ? ' на ' + date : ''} (Currency-api)`;
}

function budgetText(budgetMinor: number, money: Money): string {
  const shown = budgetInCurrency(budgetMinor, money);
  const text = formatMoney(shown.minor, shown.currency);
  return shown.currency === 'GBP' ? text : `${text} (${formatMoney(budgetMinor, 'GBP')})`;
}

export function buildToText(build: Build, money: Money, createdAt: Date = new Date()): string {
  const totals = calculateBuildTotals(build);
  const lines = [build.name, 'Список комплектующих RigForge', ''];

  for (const category of CATEGORIES) {
    const part = build.slots[category.id];
    if (!part) continue;
    lines.push(`${category.slotTitle}: ${part.name} — ${priceWithGbp(part.priceMinor, part.currency, money)}`);
  }
  if (!totals.count) lines.push('Детали не выбраны');
  lines.push('');

  if (totals.mixedCurrencies) {
    lines.push('Итого: цены в разных валютах, общая сумма не считается');
  } else {
    lines.push(`Итого известных позиций: ${priceWithGbp(totals.knownTotalMinor, totals.currency, money)}`);
  }
  if (totals.unknownCount > 0) {
    lines.push(`Цена не указана для ${totals.unknownCount} ${pluralRu(totals.unknownCount, DETAIL_FORMS_GENITIVE)}`);
  }
  lines.push(build.budgetMinor === null ? 'Бюджет: не указан' : `Бюджет: ${budgetText(build.budgetMinor, money)}`);
  lines.push('');
  const rate = rateLine(money);
  if (rate) lines.push(rate);
  lines.push(SOURCE_TEXT);
  lines.push(`Файл создан: ${dateFormat.format(createdAt)}`);

  return lines.join('\r\n') + '\r\n';
}

export function downloadBuild(build: Build, money: Money): void {
  const text = '﻿' + buildToText(build, money);
  saveFile(text, safeFileName(build.name, 'rigforge-build') + '.txt', 'text/plain;charset=utf-8');
}

function priceConverted(minor: number | null, currency: string | null, money: Money): string | null {
  if (minor === null || (currency && currency !== 'GBP')) return null;
  const converted = convertFromGbp(minor, money);
  return converted.currency === 'GBP' ? null : formatMoney(converted.minor, converted.currency);
}

function buildToJson(build: Build, money: Money) {
  const totals = calculateBuildTotals(build);
  const parts = [];
  for (const category of CATEGORIES) {
    const part = build.slots[category.id];
    if (!part) continue;
    parts.push({
      category: category.id,
      categoryTitle: category.slotTitle,
      id: part.id,
      name: part.name,
      manufacturer: part.manufacturer,
      model: part.model,
      priceMinor: part.priceMinor,
      currency: part.currency,
      price: formatMoney(part.priceMinor, part.currency),
      priceConverted: priceConverted(part.priceMinor, part.currency, money),
      priceAsOf: part.priceAsOf,
      specs: part.specs,
      sourceUrl: part.slug ? `https://vantaspec.com/products/${part.slug}` : null,
    });
  }
  return {
    id: build.id,
    name: build.name,
    currency: build.currency,
    budgetMinor: build.budgetMinor,
    budgetConverted:
      build.budgetMinor === null || getDisplayCurrency(money) === 'GBP' ? null : budgetText(build.budgetMinor, money),
    savedAt: build.savedAt ?? null,
    updatedAt: build.updatedAt,
    totals: {
      count: totals.count,
      knownTotalMinor: totals.knownTotalMinor,
      knownTotal: totals.mixedCurrencies ? null : formatMoney(totals.knownTotalMinor, totals.currency),
      knownTotalConverted: totals.mixedCurrencies ? null : priceConverted(totals.knownTotalMinor, totals.currency, money),
      unknownCount: totals.unknownCount,
      mixedCurrencies: totals.mixedCurrencies,
    },
    parts,
  };
}

export function downloadAllBuilds(builds: Build[], money: Money): void {
  const createdAt = new Date();
  const currency = getDisplayCurrency(money);
  const data = {
    app: 'RigForge',
    title: 'Список комплектующих RigForge',
    version: 1,
    createdAt: createdAt.toISOString(),
    source: {
      name: 'VantaSpec',
      url: 'https://vantaspec.com',
      note: 'цены на момент добавления в сборку',
    },
    exchange:
      currency === 'GBP' || !money.rates
        ? null
        : { from: 'GBP', to: currency, rate: money.rates[currency], date: money.date, source: 'Currency-api' },
    builds: builds.map((build) => buildToJson(build, money)),
  };
  const day = createdAt.toISOString().slice(0, 10);
  saveFile(JSON.stringify(data, null, 2), `rigforge-builds-${day}.json`, 'application/json;charset=utf-8');
}
