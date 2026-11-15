import { useEffect, useRef, useState } from 'react';
import { ApiError, isAbortError, loadCategory, searchProducts } from '../../api/vantaspec';
import { getFilterOptions } from '../../core/products';
import type {
  CatalogFilters,
  CatalogState,
  CategoryId,
  Product,
  RatingsMap,
  SortKey,
} from '../../types';

interface UseCatalogOptions {
  active: boolean;
  ratings: RatingsMap;
  onItemsLoaded: (items: Product[]) => void;
}

export interface UseCatalogResult {
  catalog: CatalogState;
  search: (query: string) => void;
  setCategory: (id: CategoryId) => void;
  applyFilters: (filters: Partial<CatalogFilters> & { sort?: SortKey }) => void;
  resetFilters: () => void;
  setSort: (sort: SortKey) => void;
  retry: () => void;
  chooseForSlot: (slot: CategoryId, replace: boolean) => void;
  clearTargetSlot: () => void;
}

const EMPTY_FILTERS: CatalogFilters & { sort: SortKey } = {
  brands: [],
  priceMin: null,
  priceMax: null,
  specs: {},
  sort: 'popular',
};

const INITIAL_CATALOG: CatalogState = {
  ...EMPTY_FILTERS,
  category: 'cpu',
  query: '',
  status: 'idle',
  items: [],
  total: 0,
  error: null,
  targetSlot: null,
  options: null,
};

export function useCatalog({ active, ratings, onItemsLoaded }: UseCatalogOptions): UseCatalogResult {
  const [catalog, setCatalog] = useState(INITIAL_CATALOG);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const ratingsKey = JSON.stringify(ratings);

  async function runQuery(changes: Partial<CatalogState> = {}) {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    const next = { ...catalog, ...changes };
    setCatalog((current) => ({ ...current, ...changes, status: 'loading', error: null }));

    try {
      const all = await loadCategory(next.category, { signal: controller.signal });
      const result = await searchProducts(
        {
          category: next.category,
          query: next.query,
          brands: next.brands,
          priceMin: next.priceMin,
          priceMax: next.priceMax,
          specs: next.specs,
          sort: next.sort,
          ratings,
        },
        { signal: controller.signal },
      );
      if (requestId !== requestIdRef.current) return;

      onItemsLoaded(all.items);
      setCatalog((current) => ({
        ...current,
        options: getFilterOptions(all.items, next.category),
        items: result.items,
        total: result.total,
        status: result.items.length ? 'success' : 'empty',
      }));
    } catch (error) {
      if (isAbortError(error) || requestId !== requestIdRef.current) return;
      const apiError = error instanceof ApiError ? error : null;
      setCatalog((current) => ({
        ...current,
        status: 'error',
        error: {
          message: apiError ? apiError.message : 'Попробуйте ещё раз.',
          kind: apiError ? apiError.kind : 'network',
          canRetry: true,
          retryAfter: apiError ? apiError.retryAfter : null,
        },
      }));
    }
  }

  useEffect(() => {
    if (active && catalog.status === 'idle') runQuery();
  }, [active]);

  useEffect(() => {
    if (catalog.status !== 'idle' && catalog.status !== 'error') runQuery();
  }, [ratingsKey]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, []);

  function search(query: string) {
    if (query === catalog.query && catalog.status === 'success') return;
    runQuery({ query });
  }

  function setCategory(id: CategoryId) {
    if (id === catalog.category) return;
    runQuery({
      ...EMPTY_FILTERS,
      category: id,
      query: '',
      targetSlot: catalog.targetSlot === id ? id : null,
    });
  }

  function applyFilters(filters: Partial<CatalogFilters> & { sort?: SortKey }) {
    runQuery(filters);
  }

  function resetFilters() {
    runQuery({ ...EMPTY_FILTERS, sort: catalog.sort });
  }

  function setSort(sort: SortKey) {
    runQuery({ sort });
  }

  function retry() {
    runQuery();
  }

  function chooseForSlot(slot: CategoryId, replace: boolean) {
    const targetSlot = replace ? slot : null;
    window.location.hash = '#catalog';
    if (catalog.category === slot) runQuery({ targetSlot });
    else runQuery({ ...EMPTY_FILTERS, category: slot, query: '', targetSlot });
  }

  function clearTargetSlot() {
    setCatalog((current) => ({ ...current, targetSlot: null }));
  }

  return {
    catalog,
    search,
    setCategory,
    applyFilters,
    resetFilters,
    setSort,
    retry,
    chooseForSlot,
    clearTargetSlot,
  };
}
