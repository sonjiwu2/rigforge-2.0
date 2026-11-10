import { ApiError, fetchJson } from './vantaspec';
import type { RequestOptions } from './vantaspec';
import type { CategoryId, DetailsTarget } from '../types';

export interface SeriesInfo {
  title: string;
  extract: string;
  url: string;
  lang: string;
  scope: string;
}

interface SeriesRule {
  pattern: RegExp;
  title: string;
}

interface RawWikiPage {
  title?: string;
  fullurl?: string;
  extract?: unknown;
  missing?: unknown;
  invalid?: unknown;
}

interface RawWikiResponse {
  error?: unknown;
  query?: { pages?: (RawWikiPage | null)[] } | null;
}

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';
const MAX_EXTRACT = 900;

const SERIES: Partial<Record<CategoryId, SeriesRule[]>> = {
  cpu: [
    { pattern: /\bRyzen\s+[3579]\s+9\d{3}(?:X3D|XT|X|GT|G|F)?\b/i, title: 'Zen 5' },
    { pattern: /\bRyzen\s+[3579]\s+7\d{3}(?:X3D|XT|X|GT|G|F)?\b/i, title: 'Zen 4' },
    { pattern: /\bRyzen\s+[3579]\s+5\d{3}(?:X3D|XT|X|GT|G|F)?\b/i, title: 'Zen 3' },
    { pattern: /\bCore\s+Ultra\s+[3579]\s+2\d{2}(?:KF|K|F|T)?\b/i, title: 'Arrow Lake (microprocessor)' },
    { pattern: /\bCore\s+i[3579][\s-]+14\d{3}(?:KF|K|F|T)?\b/i, title: 'Raptor Lake' },
    { pattern: /\bCore\s+i[3579][\s-]+12\d{3}(?:KF|K|F|T)?\b/i, title: 'Alder Lake' },
  ],
  gpu: [
    { pattern: /\bGeForce\s+RTX\s+50[5-9]0\b/i, title: 'GeForce RTX 50 series' },
    { pattern: /\bGeForce\s+RTX\s+40[5-9]0\b/i, title: 'GeForce RTX 40 series' },
    { pattern: /\bRadeon\s+RX\s+90[5-9]0\b/i, title: 'Radeon RX 9000 series' },
  ],
};

const cache = new Map<string, SeriesInfo | null>();

export function getSeriesTitle(product: DetailsTarget): string | null {
  const rules = SERIES[product.category];
  if (!rules) return null;
  const text = product.model || product.name || '';
  const rule = rules.find((item) => item.pattern.test(text));
  return rule ? rule.title : null;
}

function shortenExtract(text: string): string {
  if (text.length <= MAX_EXTRACT) return text;
  const part = text.slice(0, MAX_EXTRACT);
  const lastEnd = Math.max(part.lastIndexOf('. '), part.lastIndexOf('.\n'));
  if (lastEnd > MAX_EXTRACT / 3) return part.slice(0, lastEnd + 1);
  return part.slice(0, part.lastIndexOf(' ')) + '…';
}

export async function getSupplementaryInfo(
  product: DetailsTarget,
  { signal }: RequestOptions = {},
): Promise<SeriesInfo | null> {
  const title = getSeriesTitle(product);
  if (!title) return null;
  const cached = cache.get(title);
  if (cached !== undefined) return cached;

  const url = new URL(WIKI_API_URL);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    prop: 'extracts|info',
    inprop: 'url',
    exintro: '1',
    explaintext: '1',
    redirects: '1',
    titles: title,
  }).toString();

  const json = await fetchJson(url.toString(), { signal });
  const data = json as RawWikiResponse | null;
  if (!data || typeof data !== 'object' || data.error) {
    throw new ApiError('format', 'Не удалось получить описание серии.');
  }

  const page = data.query && Array.isArray(data.query.pages) ? data.query.pages[0] : null;
  let info: SeriesInfo | null = null;
  if (page && !page.missing && !page.invalid && typeof page.extract === 'string' && page.extract.trim()) {
    info = {
      title: page.title || title,
      extract: shortenExtract(page.extract.trim()),
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      lang: 'en',
      scope: 'series',
    };
  }
  cache.set(title, info);
  return info;
}
