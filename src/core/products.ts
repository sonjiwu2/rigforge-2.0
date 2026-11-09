import { getCategory } from '../data/catalog';
import type {
  CatalogFilters,
  CategoryId,
  DetailsTarget,
  FilterOptions,
  Offer,
  Popularity,
  PriceKind,
  Product,
  ProductSnapshot,
  RatingSummary,
  RatingsMap,
  SortKey,
  Spec,
} from '../types';

export interface ProductFilters extends Partial<CatalogFilters> {
  query?: string;
}

export interface RawPrice {
  retailer?: unknown;
  price?: unknown;
  currency?: unknown;
  url?: unknown;
}

export interface RawProduct {
  id?: unknown;
  slug?: unknown;
  brand?: unknown;
  name?: unknown;
  model?: unknown;
  description?: unknown;
  imageUrl?: unknown;
  lowestPrice?: unknown;
  favorites?: unknown;
  prices?: (RawPrice | null)[];
}

export interface RawSpecRow {
  name?: unknown;
  unit?: unknown;
  values?: unknown[];
}

export interface CompareResponse {
  products?: (RawProduct | null)[];
  specMatrix?: (RawSpecRow | null)[];
}

export const SPEC_LABELS: Record<string, string> = {
  Architecture: 'Архитектура',
  'Base Clock': 'Базовая частота',
  'Boost Clock': 'Частота в бусте',
  Cores: 'Ядра',
  Threads: 'Потоки',
  'E-Cores': 'Энергоэффективные ядра',
  'P-Cores': 'Производительные ядра',
  'L3 Cache': 'Кеш L3',
  Socket: 'Сокет',
  TDP: 'Теплопакет',
  'Integrated Graphics': 'Встроенная графика',
  'Form Factor': 'Форм-фактор',
  Memory: 'Память',
  Chipset: 'Чипсет',
  'Memory Slots': 'Слоты памяти',
  'Max Memory': 'Макс. память',
  Colour: 'Цвет',
  PCIe: 'PCIe',
  'Memory Bus': 'Шина памяти',
  Length: 'Длина',
  'GPU Cores': 'Ядра GPU',
  Capacity: 'Объём',
  'CAS Latency': 'Задержка CAS',
  Kit: 'Комплект',
  Type: 'Тип',
  Speed: 'Частота',
  Voltage: 'Напряжение',
  Interface: 'Интерфейс',
  'Sequential Read': 'Чтение',
  'Sequential Write': 'Запись',
  TBW: 'Ресурс записи (TBW)',
  Cache: 'Кеш',
  RPM: 'Скорость вращения',
  Wattage: 'Мощность',
  Efficiency: 'Сертификат',
  Modular: 'Модульность',
  'ATX Version': 'Версия ATX',
  'Motherboard Support': 'Поддержка плат',
  'Side Panel': 'Боковая панель',
  'Tempered Glass': 'Закалённое стекло',
  '3.5" Bays': 'Отсеки 3.5"',
  'External Volume': 'Объём корпуса',
  'Fans Included': 'Вентиляторы в комплекте',
  'Max CPU Cooler Height': 'Макс. высота кулера',
  'Max GPU Length': 'Макс. длина видеокарты',
  'Fan Size': 'Размер вентилятора',
  'Noise Level': 'Уровень шума',
  Height: 'Высота',
  'Radiator Size': 'Радиатор',
  'Radiator Support': 'Поддержка радиаторов',
};

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function cleanImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cdn.vantaspec.com' ? url.href : null;
  } catch {
    return null;
  }
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
}

function toMinor(price: unknown): number | null {
  return typeof price === 'number' && Number.isFinite(price) && price >= 0
    ? Math.round(price * 100)
    : null;
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text || null;
}

function specValueToText(value: unknown, unit: string | null): string | null {
  let text: string | null = null;
  if (typeof value === 'number' && Number.isFinite(value)) text = String(value);
  else if (typeof value === 'boolean') text = value ? 'Да' : 'Нет';
  else text = cleanText(value);
  if (!text) return null;

  if (/^(true|yes)$/i.test(text)) return 'Да';
  if (/^(false|no)$/i.test(text)) return 'Нет';
  text = text.replace(/(\d)(GB|TB|MB)\b/g, '$1 $2');
  text = text.replace(/^(\d+)000 GB$/, '$1 TB');
  if (unit && !text.includes(unit)) text = `${text} ${unit}`;
  return text;
}

function normalizeOffers(prices: (RawPrice | null)[] | undefined): Offer[] {
  if (!Array.isArray(prices)) return [];
  const offers: Offer[] = [];
  for (const price of prices) {
    if (!price) continue;
    const priceMinor = toMinor(price.price);
    if (priceMinor === null) continue;
    offers.push({
      retailer: cleanText(price.retailer) || 'Магазин',
      priceMinor,
      currency: cleanText(price.currency) || 'GBP',
      url: isHttpUrl(price.url) ? price.url : null,
    });
  }
  return offers.sort((a, b) => a.priceMinor - b.priceMinor);
}

export function normalizeCompareResponse(
  json: CompareResponse | null | undefined,
  categoryId: CategoryId,
): Product[] {
  if (!json || !Array.isArray(json.products)) return [];
  const matrix = Array.isArray(json.specMatrix) ? json.specMatrix : [];
  const priceAsOf = new Date().toISOString();
  const result: Product[] = [];

  json.products.forEach((raw, index) => {
    if (!raw || typeof raw.id !== 'string' || typeof raw.slug !== 'string') return;

    const specs: Spec[] = [];
    for (const row of matrix) {
      if (!row || typeof row.name !== 'string' || !Array.isArray(row.values)) continue;
      const value = specValueToText(row.values[index], cleanText(row.unit));
      if (value === null) continue;
      specs.push({ key: row.name, label: SPEC_LABELS[row.name] || row.name, value, scope: 'exact' });
    }

    const offers = normalizeOffers(raw.prices);
    const priceMinor = offers.length ? offers[0].priceMinor : toMinor(raw.lowestPrice);
    const currency = offers.length ? offers[0].currency : priceMinor === null ? null : 'GBP';

    let priceKind: PriceKind = 'unknown';
    if (offers.length > 1) priceKind = 'from';
    else if (priceMinor !== null) priceKind = 'exact';

    const description = cleanText(raw.description);

    result.push({
      id: `vantaspec:${raw.id}`,
      provider: 'vantaspec',
      providerId: raw.id,
      slug: raw.slug,
      category: categoryId,
      manufacturer: cleanText(raw.brand),
      name: cleanText(raw.name) || raw.slug,
      model: cleanText(raw.model),
      mpn: null,
      priceMinor,
      currency,
      priceKind,
      offers,
      imageUrl: cleanImageUrl(raw.imageUrl),
      gallery: [],
      specs,
      description,
      descriptionScope: description ? 'exact' : null,
      sourceUrl: `https://vantaspec.com/products/${encodeURIComponent(raw.slug)}`,
      priceAsOf,
      popularity: { offers: offers.length, favorites: toCount(raw.favorites) },
    });
  });

  return result;
}

export function getSpec(product: DetailsTarget | null | undefined, key: string): string | null {
  if (!product || !Array.isArray(product.specs)) return null;
  const spec = product.specs.find((item) => item.key === key);
  return spec ? spec.value : null;
}

export function toSnapshot(product: DetailsTarget): ProductSnapshot {
  const category = getCategory(product.category);
  const cardSpecs = category ? category.cardSpecs : [];
  const specs: Spec[] = [];
  for (const key of cardSpecs) {
    const spec = (product.specs || []).find((item) => item.key === key);
    if (spec) specs.push({ key: spec.key, label: spec.label, value: spec.value, scope: spec.scope });
    if (specs.length === 2) break;
  }
  return {
    id: product.id,
    provider: product.provider,
    providerId: product.providerId,
    slug: product.slug,
    category: product.category,
    manufacturer: product.manufacturer,
    name: product.name,
    model: product.model,
    priceMinor: product.priceMinor,
    currency: product.currency,
    imageUrl: product.imageUrl || null,
    specs,
    priceAsOf: product.priceAsOf,
  };
}

export function filterValue(
  key: string,
  value: string | null | undefined,
  categoryId: CategoryId,
): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value);
  const lower = text.toLowerCase();

  if (key === 'Form Factor' && categoryId === 'case') {
    if (lower.includes('full tower')) return 'Full Tower';
    if (lower.includes('mid tower') || lower.includes('midi tower')) return 'Mid Tower';
    if (lower.includes('mini tower')) return 'Mini Tower';
    return text;
  }
  if (key === 'Form Factor' && categoryId === 'motherboard') {
    if (/e-?atx/.test(lower)) return 'E-ATX';
    if (/mini[\s-]?itx/.test(lower)) return 'Mini-ITX';
    if (/\bmatx\b|\bm-atx\b|micro[\s-]?atx/.test(lower)) return 'Micro-ATX';
    if (/\batx\b/.test(lower)) return 'ATX';
    return text;
  }
  if (key === 'Memory' && categoryId === 'gpu') {
    const match = text.match(/(\d+)\s*GB/i);
    return match ? `${match[1]} GB` : text;
  }
  if (key === 'Type' && categoryId === 'ram') {
    const match = text.match(/DDR(\d)/i);
    return match ? `DDR${match[1]}` : text;
  }
  if (key === 'Capacity' && categoryId === 'ram') {
    const match = text.match(/^(\d+)\s*GB/i);
    return match ? `${match[1]} GB` : text;
  }
  if (key === 'Type' && categoryId === 'cooler') {
    if (/aio|all-in-one|liquid|hydro|water/.test(lower)) return 'Жидкостное';
    if (/\bair\b/.test(lower)) return 'Воздушное';
    return text;
  }
  if (key === 'Modular' && categoryId === 'psu') {
    if (/semi/.test(lower)) return 'Полумодульный';
    if (/non|^нет$|^false$/.test(lower)) return 'Немодульный';
    if (/full|^modular$|^да$/.test(lower)) return 'Полностью модульный';
    return text;
  }
  return text;
}

export function filterBrand(product: Product): string | null {
  const brand = product.manufacturer;
  if (!brand) return null;
  if (/^(wd|wd_black|western digital)$/i.test(brand)) return 'WD';
  if (/^sandisk/i.test(brand) && /\bwd\b|wd_black/i.test(`${brand} ${product.model || ''}`)) return 'WD';
  return brand;
}

function getFilterSpec(product: Product, key: string): string | null {
  return filterValue(key, getSpec(product, key), product.category);
}

function normalizeQuery(text: string | null | undefined): string[] {
  return String(text || '').toLowerCase().split(/\s+/).filter(Boolean);
}

function matchesQuery(product: Product, words: string[]): boolean {
  if (!words.length) return true;
  const haystack = [product.name, product.manufacturer, filterBrand(product), product.model, product.mpn]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

function integerOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

export function filterProducts(items: Product[], filters: ProductFilters = {}): Product[] {
  const words = normalizeQuery(filters.query);
  const brands = filters.brands || [];
  const specs = filters.specs || {};
  const priceMin = integerOrNull(filters.priceMin);
  const priceMax = integerOrNull(filters.priceMax);

  return items.filter((product) => {
    if (!matchesQuery(product, words)) return false;
    if (brands.length) {
      const brand = filterBrand(product);
      if (brand === null || !brands.includes(brand)) return false;
    }

    if (priceMin !== null || priceMax !== null) {
      if (product.priceMinor === null) return false;
      if (priceMin !== null && product.priceMinor < priceMin) return false;
      if (priceMax !== null && product.priceMinor > priceMax) return false;
    }

    for (const [key, values] of Object.entries(specs)) {
      if (!Array.isArray(values) || !values.length) continue;
      const value = getFilterSpec(product, key);
      if (value === null || !values.includes(value)) return false;
    }
    return true;
  });
}

function comparePrice(a: Product, b: Product): number {
  if (a.priceMinor === null && b.priceMinor === null) return 0;
  if (a.priceMinor === null) return 1;
  if (b.priceMinor === null) return -1;
  return a.priceMinor - b.priceMinor;
}

export function sortProducts(
  items: Product[],
  sort: SortKey = 'popular',
  ratings: RatingsMap = {},
): Product[] {
  const list = items.slice();
  const rating = (product: Product): RatingSummary =>
    (ratings && ratings[product.id]) || { average: null, count: 0 };
  const reviewCount = (product: Product): number => rating(product).count || 0;

  if (sort === 'price-asc') return list.sort(comparePrice);
  if (sort === 'price-desc') {
    return list.sort((a, b) => {
      if (a.priceMinor === null || b.priceMinor === null) return comparePrice(a, b);
      return b.priceMinor - a.priceMinor;
    });
  }
  if (sort === 'rating') {
    return list.sort((a, b) => {
      const avgA = rating(a).average;
      const avgB = rating(b).average;
      if (avgA === null && avgB === null) return 0;
      if (avgA === null) return 1;
      if (avgB === null) return -1;
      return avgB - avgA || reviewCount(b) - reviewCount(a);
    });
  }

  const popularity = (product: Product): Popularity =>
    product.popularity || { offers: (product.offers || []).length, favorites: 0 };
  return list.sort((a, b) => {
    const popA = popularity(a);
    const popB = popularity(b);
    return popB.offers - popA.offers || popB.favorites - popA.favorites || reviewCount(b) - reviewCount(a);
  });
}

function specSortValue(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(TB|GB|MB)?/i);
  if (!match) return null;
  const multipliers: Record<string, number> = { tb: 1000, gb: 1, mb: 0.001 };
  const unit = match[2] ? match[2].toLowerCase() : null;
  return Number(match[1]) * (unit ? multipliers[unit] : 1);
}

const VALUE_ORDER = ['Немодульный', 'Полумодульный', 'Полностью модульный', 'Mini-ITX', 'Micro-ATX', 'ATX', 'E-ATX', 'Mini Tower', 'Mid Tower', 'Full Tower'];

function compareSpecValues(a: string, b: string): number {
  const orderA = VALUE_ORDER.indexOf(a);
  const orderB = VALUE_ORDER.indexOf(b);
  if (orderA !== -1 && orderB !== -1) return orderA - orderB;
  if (orderA !== -1) return -1;
  if (orderB !== -1) return 1;

  const numA = specSortValue(a);
  const numB = specSortValue(b);
  if (numA !== null && numB !== null && numA !== numB) return numA - numB;
  if (numA !== null && numB === null) return -1;
  if (numA === null && numB !== null) return 1;
  return a.localeCompare(b, 'ru', { numeric: true });
}

function isText(value: string | null): value is string {
  return Boolean(value);
}

export function getFilterOptions(items: Product[], categoryId: CategoryId): FilterOptions {
  const category = getCategory(categoryId);
  const brands = [...new Set(items.map(filterBrand).filter(isText))].sort((a, b) =>
    a.localeCompare(b, 'en'),
  );

  const specs: FilterOptions['specs'] = {};
  for (const key of category ? category.filterSpecs : []) {
    const values = [...new Set(items.map((item) => filterValue(key, getSpec(item, key), categoryId)).filter(isText))];
    if (!values.length) continue;
    specs[key] = { label: SPEC_LABELS[key] || key, values: values.sort(compareSpecValues) };
  }

  const prices: number[] = [];
  for (const item of items) {
    if (item.priceMinor !== null) prices.push(item.priceMinor);
  }
  const priceRange = prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : { min: null, max: null };

  return { brands, specs, priceRange };
}
