export type View = 'build' | 'catalog' | 'saved';

export type CategoryId =
  | 'cpu'
  | 'motherboard'
  | 'gpu'
  | 'ram'
  | 'ssd'
  | 'hdd'
  | 'psu'
  | 'case'
  | 'cooler';

export interface Category {
  id: CategoryId;
  providerSlug: string;
  title: string;
  slotTitle: string;
  accusative: string;
  icon: string;
  cardSpecs: string[];
  filterSpecs: string[];
}

export interface Spec {
  key: string;
  label: string;
  value: string;
  scope: string | null;
}

export interface Offer {
  retailer: string;
  priceMinor: number;
  currency: string;
  url: string | null;
}

export type PriceKind = 'unknown' | 'from' | 'exact';

export interface Popularity {
  offers: number;
  favorites: number;
}

export interface Product {
  id: string;
  provider: string;
  providerId: string;
  slug: string;
  category: CategoryId;
  manufacturer: string | null;
  name: string;
  model: string | null;
  mpn: string | null;
  priceMinor: number | null;
  currency: string | null;
  priceKind: PriceKind;
  offers: Offer[];
  imageUrl: string | null;
  gallery: string[];
  specs: Spec[];
  description: string | null;
  descriptionScope: string | null;
  sourceUrl: string;
  priceAsOf: string;
  popularity: Popularity;
}

export interface ProductSnapshot {
  id: string;
  provider: string | null;
  providerId: string | null;
  slug: string | null;
  category: CategoryId;
  manufacturer: string | null;
  name: string;
  model: string | null;
  priceMinor: number | null;
  currency: string | null;
  imageUrl: string | null;
  specs: Spec[];
  priceAsOf: string | null;
}

export type DetailsTarget = Product | ProductSnapshot;

export type BuildSlots = Record<CategoryId, ProductSnapshot | null>;

export interface Build {
  id: string;
  name: string;
  budgetMinor: number | null;
  currency: 'GBP';
  slots: BuildSlots;
  updatedAt: string;
  savedAt?: string;
}

export interface BuildTotals {
  count: number;
  knownTotalMinor: number | null;
  unknownCount: number;
  currency: string | null;
  mixedCurrencies: boolean;
}

export interface TypedBudget {
  minor: number;
  currency: CurrencyCode;
}

export interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  createdAt: string;
}

export type ReviewsMap = Record<string, Review[]>;

export interface RatingSummary {
  average: number | null;
  count: number;
}

export type RatingsMap = Record<string, RatingSummary>;

export type CurrencyCode = 'GBP' | 'USD' | 'RUB';

export type MoneyStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Money {
  currency: CurrencyCode;
  rates: Record<CurrencyCode, number> | null;
  date: string | null;
  status: MoneyStatus;
}

export type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'rating';

export interface CatalogFilters {
  brands: string[];
  priceMin: number | null;
  priceMax: number | null;
  specs: Record<string, string[]>;
}

export interface FilterOptions {
  brands: string[];
  specs: Record<string, { label: string; values: string[] }>;
  priceRange: { min: number | null; max: number | null };
}

export type CatalogStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface CatalogError {
  message: string;
  kind: string;
  canRetry: boolean;
  retryAfter: number | null;
}

export interface CatalogState extends CatalogFilters {
  category: CategoryId;
  query: string;
  sort: SortKey;
  status: CatalogStatus;
  items: Product[];
  total: number;
  error: CatalogError | null;
  targetSlot: CategoryId | null;
  options: FilterOptions | null;
}

export interface ProductAction {
  label: string;
  inBuild: boolean;
  disabled: boolean;
}

export interface ToastMessage {
  id: number;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmRequest {
  title: string;
  text: string;
  okLabel: string;
}

export interface NewReview {
  rating: number;
  text: string;
  author: string;
}
