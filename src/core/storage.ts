import { CATEGORIES } from '../data/catalog';
import { cleanReviewsMap } from './reviews';
import type { Problems } from './reviews';
import type {
  Build,
  BuildSlots,
  CategoryId,
  CurrencyCode,
  ProductSnapshot,
  ReviewsMap,
  Spec,
} from '../types';

export interface AppSettings {
  currency: CurrencyCode;
}

export interface StoredData {
  build: Build;
  saved: Build[];
  reviews: ReviewsMap;
  settings: AppSettings;
}

export interface LoadedState extends StoredData {
  storageOk: boolean;
  warning: string | null;
}

type RawObject = Record<string, unknown>;

const STORAGE_KEY = 'rigforge:state:v1';
const VERSION = 1;
const NAME_MAX = 80;
const SLOT_IDS: CategoryId[] = CATEGORIES.map((category) => category.id);
const DEFAULT_CURRENCY: CurrencyCode = 'GBP';

export const WARNING_UNAVAILABLE = 'Хранилище браузера недоступно — сборки не сохранятся после закрытия вкладки';
const WARNING_BROKEN = 'Сохранённые данные повреждены и были сброшены';
const WARNING_PARTLY_BROKEN = 'Часть сохранённых данных повреждена и была удалена';

function emptySlots(): BuildSlots {
  return {
    cpu: null,
    motherboard: null,
    gpu: null,
    ram: null,
    ssd: null,
    hdd: null,
    psu: null,
    case: null,
    cooler: null,
  };
}

export function createEmptyBuild(name = 'Сборка №1'): Build {
  return {
    id: 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
    name,
    budgetMinor: null,
    currency: 'GBP',
    slots: emptySlots(),
    updatedAt: new Date().toISOString(),
  };
}

function getStorage(): Storage | null {
  try {
    const storage = window.localStorage;
    const testKey = 'rigforge:test';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is RawObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 500;
}

function textOrNull(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' && value.length <= 500 ? value : undefined;
}

function isDateString(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

function isMoney(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function cleanName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= NAME_MAX ? name : null;
}

function cleanImageUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 500) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'cdn.vantaspec.com' ? url.href : null;
  } catch {
    return null;
  }
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'GBP' || value === 'USD' || value === 'RUB';
}

function cleanSettings(value: unknown): AppSettings {
  const currency = isPlainObject(value) && isCurrencyCode(value.currency) ? value.currency : DEFAULT_CURRENCY;
  return { currency };
}

function cleanSpecs(value: unknown): Spec[] | null {
  if (!Array.isArray(value)) return null;
  const specs: Spec[] = [];
  for (const spec of value.slice(0, 2)) {
    if (!isPlainObject(spec)) return null;
    const { key, label, value: specValue, scope } = spec;
    if (!isText(key) || !isText(label) || !isText(specValue)) return null;
    const cleanScope = textOrNull(scope);
    if (cleanScope === undefined) return null;
    specs.push({ key, label, value: specValue, scope: cleanScope });
  }
  return specs;
}

function cleanSnapshot(value: unknown, slotId: CategoryId): ProductSnapshot | null {
  if (!isPlainObject(value)) return null;
  if (value.category !== slotId) return null;
  if (!isText(value.id) || !isText(value.name)) return null;

  const provider = textOrNull(value.provider);
  const providerId = textOrNull(value.providerId);
  const slug = textOrNull(value.slug);
  const manufacturer = textOrNull(value.manufacturer);
  const model = textOrNull(value.model);
  if (
    provider === undefined ||
    providerId === undefined ||
    slug === undefined ||
    manufacturer === undefined ||
    model === undefined
  ) {
    return null;
  }

  const priceMinor = value.priceMinor === undefined ? null : value.priceMinor;
  if (priceMinor !== null && !isMoney(priceMinor)) return null;

  const currency = value.currency === undefined ? null : value.currency;
  if (currency !== null && !(typeof currency === 'string' && /^[A-Z]{3}$/.test(currency))) return null;

  const specs = value.specs === undefined ? [] : cleanSpecs(value.specs);
  if (!specs) return null;

  const priceAsOf = value.priceAsOf === undefined || value.priceAsOf === null ? null : value.priceAsOf;
  if (priceAsOf !== null && !isDateString(priceAsOf)) return null;

  return {
    id: value.id,
    provider,
    providerId,
    slug,
    category: slotId,
    manufacturer,
    name: value.name,
    model,
    priceMinor,
    currency,
    specs,
    imageUrl: cleanImageUrl(value.imageUrl),
    priceAsOf,
  };
}

function cleanBuild(value: unknown, isSaved: boolean, problems: Problems): Build | null {
  if (!isPlainObject(value)) return null;
  if (!isText(value.id)) return null;
  const name = cleanName(value.name);
  if (!name) return null;

  const budgetMinor = value.budgetMinor === undefined ? null : value.budgetMinor;
  if (budgetMinor !== null && !(isMoney(budgetMinor) && budgetMinor > 0)) return null;

  if (value.currency !== 'GBP') return null;
  const rawSlots = value.slots;
  if (!isPlainObject(rawSlots)) return null;

  const slots = emptySlots();
  for (const id of SLOT_IDS) {
    const raw = rawSlots[id];
    if (raw === null || raw === undefined) continue;
    slots[id] = cleanSnapshot(raw, id);
    if (!slots[id]) problems.count++;
  }

  const build: Build = {
    id: value.id,
    name,
    budgetMinor,
    currency: 'GBP',
    slots,
    updatedAt: isDateString(value.updatedAt) ? value.updatedAt : new Date().toISOString(),
  };

  if (isSaved) {
    if (!isDateString(value.savedAt)) return null;
    build.savedAt = value.savedAt;
  }
  return build;
}

function cleanState(data: unknown, problems: Problems): StoredData | null {
  if (!isPlainObject(data) || data.version !== VERSION) return null;
  const build = cleanBuild(data.build, false, problems);
  if (!build || !Array.isArray(data.saved)) return null;

  const saved: Build[] = [];
  const ids = new Set<string>();
  for (const item of data.saved) {
    const savedBuild = cleanBuild(item, true, problems);
    if (!savedBuild || ids.has(savedBuild.id)) {
      problems.count++;
      continue;
    }
    ids.add(savedBuild.id);
    saved.push(savedBuild);
  }
  const reviews = cleanReviewsMap(data.reviews, problems);
  const settings = cleanSettings(data.settings);
  return { build, saved, reviews, settings };
}

function emptyData(): StoredData {
  return { build: createEmptyBuild(), saved: [], reviews: {}, settings: { currency: DEFAULT_CURRENCY } };
}

export function loadAppState(): LoadedState {
  const storage = getStorage();
  if (!storage) {
    return { ...emptyData(), storageOk: false, warning: WARNING_UNAVAILABLE };
  }

  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { ...emptyData(), storageOk: false, warning: WARNING_UNAVAILABLE };
  }
  if (raw === null) {
    return { ...emptyData(), storageOk: true, warning: null };
  }

  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  const problems: Problems = { count: 0 };
  const state = data ? cleanState(data, problems) : null;
  if (!state) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      return { ...emptyData(), storageOk: true, warning: WARNING_BROKEN };
    }
    return { ...emptyData(), storageOk: true, warning: WARNING_BROKEN };
  }

  return {
    ...state,
    storageOk: true,
    warning: problems.count > 0 ? WARNING_PARTLY_BROKEN : null,
  };
}

export function persistAppState({ build, saved, reviews, settings }: StoredData): boolean {
  const storage = getStorage();
  if (!storage) return false;

  const problems: Problems = { count: 0 };
  const cleanCurrent = cleanBuild(build, false, problems);
  if (!cleanCurrent) return false;
  const cleanSaved: Build[] = [];
  for (const item of saved) {
    const savedBuild = cleanBuild(item, true, problems);
    if (savedBuild) cleanSaved.push(savedBuild);
  }

  const data = {
    version: VERSION,
    build: cleanCurrent,
    saved: cleanSaved,
    reviews: cleanReviewsMap(reviews, problems),
    settings: cleanSettings(settings),
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
