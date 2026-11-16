import { CATALOG_SLUGS } from '../data/catalog';
import { filterProducts, normalizeCompareResponse, sortProducts } from '../core/products';
import type { CompareResponse, ProductFilters } from '../core/products';
import type { CategoryId, DetailsTarget, Product, RatingsMap, SortKey } from '../types';

const COMPARE_URL = 'https://vantaspec.com/api/compare';
const TIMEOUT_MS = 12000;
const CHUNK_SIZE = 4;

export const ATTRIBUTION = { text: 'Данные: VantaSpec', url: 'https://vantaspec.com' };

type ApiErrorKind = 'http' | 'network' | 'timeout' | 'format' | 'rate';

interface ApiErrorDetails {
  status?: number | null;
  retryAfter?: number | null;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

interface SearchParams extends ProductFilters {
  category: CategoryId;
  sort?: SortKey;
  ratings?: RatingsMap;
}

interface SearchResult {
  items: Product[];
  total: number;
}

export interface PriceStats {
  days: number;
  currentLowestMinor: number | null;
  lowestEverMinor: number | null;
  averageMinor: number | null;
  retailerCount: number;
  currency: 'GBP';
}

interface RawPriceStats {
  days?: unknown;
  currentLowest?: unknown;
  lowestEver?: unknown;
  averagePrice?: unknown;
  retailerCount?: unknown;
}

export class ApiError extends Error {
  kind: ApiErrorKind;
  status: number | null;
  retryAfter: number | null;

  constructor(kind: ApiErrorKind, message: string, details: ApiErrorDetails = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = details.status ?? null;
    this.retryAfter = details.retryAfter ?? null;
  }
}

export function isAbortError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError';
}

function abortError(): DOMException {
  return new DOMException('Запрос отменён', 'AbortError');
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const date = Date.parse(header);
  if (Number.isNaN(date)) return null;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

export async function fetchJson(url: string, { signal }: RequestOptions = {}): Promise<unknown> {
  if (signal && signal.aborted) throw abortError();

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);
  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onAbort, { once: true });

  const convertError = (err: unknown): unknown => {
    if (timedOut) return new ApiError('timeout', 'Сервер слишком долго отвечает. Попробуйте ещё раз.');
    if (signal && signal.aborted) return isAbortError(err) ? err : abortError();
    return new ApiError('network', 'Не удалось связаться с сервером. Проверьте подключение к интернету.');
  };

  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    } catch (err) {
      throw convertError(err);
    }

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseRetryAfter(response.headers.get('Retry-After'));
        const wait = retryAfter ? ` через ${retryAfter} с` : ' чуть позже';
        throw new ApiError('rate', `Слишком много запросов. Попробуйте${wait}.`, { status: 429, retryAfter });
      }
      throw new ApiError('http', `Сервер ответил ошибкой (код ${response.status}).`, { status: response.status });
    }

    let text: string;
    try {
      text = await response.text();
    } catch (err) {
      throw convertError(err);
    }
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError('format', 'Сервер вернул данные в непонятном формате.');
    }
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

function waitWithSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (err) => {
        signal.removeEventListener('abort', onAbort);
        reject(err);
      },
    );
  });
}

async function fetchCompare(
  slugs: string[],
  categoryId: CategoryId,
  { signal }: RequestOptions = {},
): Promise<Product[]> {
  const url = new URL(COMPARE_URL);
  url.searchParams.set('slugs', slugs.join(','));
  const json = await fetchJson(url.toString(), { signal });
  const data = json as CompareResponse | null;
  if (!data || typeof data !== 'object' || !Array.isArray(data.products)) {
    throw new ApiError('format', 'Сервер вернул данные в непонятном формате.');
  }
  return normalizeCompareResponse(data, categoryId);
}

function withPartner(slug: string, slugs: string[], skip: string[]): string[] {
  const partner = slugs.find((other) => other !== slug && !skip.includes(other));
  return partner ? [slug, partner] : [slug];
}

async function fetchChunk(chunk: string[], slugs: string[], categoryId: CategoryId): Promise<Product[]> {
  const request = chunk.length === 1 ? withPartner(chunk[0], slugs, []) : chunk;
  try {
    return await fetchCompare(request, categoryId);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err;
  }

  const found: Product[] = [];
  for (const slug of chunk) {
    try {
      const items = await fetchCompare(withPartner(slug, slugs, chunk), categoryId);
      found.push(...items.filter((item) => item.slug === slug));
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 404) throw err;
    }
  }
  return found;
}

async function fetchCategory(categoryId: CategoryId): Promise<Product[]> {
  const slugs = CATALOG_SLUGS[categoryId];
  const chunks: string[][] = [];
  for (let i = 0; i < slugs.length; i += CHUNK_SIZE) {
    chunks.push(slugs.slice(i, i + CHUNK_SIZE));
  }

  const results = await Promise.all(chunks.map((chunk) => fetchChunk(chunk, slugs, categoryId)));

  const bySlug = new Map<string, Product>();
  for (const items of results) {
    for (const item of items) bySlug.set(item.slug, item);
  }
  const items: Product[] = [];
  for (const slug of slugs) {
    const item = bySlug.get(slug);
    if (item) items.push(item);
  }
  return items;
}

const categoryCache = new Map<CategoryId, Promise<Product[]>>();

export function loadCategory(
  categoryId: CategoryId,
  { signal }: RequestOptions = {},
): Promise<Product[]> {
  let promise = categoryCache.get(categoryId);
  if (!promise) {
    promise = fetchCategory(categoryId);
    categoryCache.set(categoryId, promise);
    promise.catch(() => categoryCache.delete(categoryId));
  }
  return waitWithSignal(promise, signal);
}

export async function searchProducts(
  params: SearchParams,
  { signal }: RequestOptions = {},
): Promise<SearchResult> {
  const items = await loadCategory(params.category, { signal });
  const filtered = filterProducts(items, params);
  const sorted = sortProducts(filtered, params.sort, params.ratings);
  return { items: sorted, total: sorted.length };
}

export async function getProductDetails(
  product: DetailsTarget,
  { signal }: RequestOptions = {},
): Promise<Product> {
  if ('offers' in product) return product;

  const items = await loadCategory(product.category, { signal });
  const found = items.find((item) => item.id === product.id || item.slug === product.slug);
  if (found) return found;

  const other = CATALOG_SLUGS[product.category].find((slug) => slug !== product.slug);
  if (product.slug && other) {
    try {
      const fetched = await fetchCompare([product.slug, other], product.category, { signal });
      const item = fetched.find((entry) => entry.slug === product.slug);
      if (item) return item;
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) throw err;
    }
  }
  throw new ApiError('http', 'Этот товар больше не найден в каталоге.', { status: 404 });
}

const PRICE_STATS_URL = 'https://vantaspec.com/api/products/price-intelligence';
const priceStatsCache = new Map<string, PriceStats>();

function poundsToMinor(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) : null;
}

function integerOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) ? value : fallback;
}

export async function getPriceStats(
  product: DetailsTarget,
  { signal }: RequestOptions = {},
): Promise<PriceStats> {
  const id = String(product.providerId);
  const cached = priceStatsCache.get(id);
  if (cached) return cached;

  const url = new URL(PRICE_STATS_URL);
  url.searchParams.set('productId', id);
  url.searchParams.set('days', '90');
  const json = await fetchJson(url.toString(), { signal });
  const data = json as RawPriceStats | null;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ApiError('format', 'Сервер вернул данные в непонятном формате.');
  }

  const stats: PriceStats = {
    days: integerOr(data.days, 90),
    currentLowestMinor: poundsToMinor(data.currentLowest),
    lowestEverMinor: poundsToMinor(data.lowestEver),
    averageMinor: poundsToMinor(data.averagePrice),
    retailerCount: integerOr(data.retailerCount, 0),
    currency: 'GBP',
  };
  priceStatsCache.set(id, stats);
  return stats;
}
