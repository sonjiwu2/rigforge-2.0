import { useCallback, useEffect, useRef, useState } from 'react';
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

export interface UseCatalogOptions {
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

const INITIAL_CATALOG: CatalogState = {
  category: 'cpu',
  query: '',
  brands: [],
  priceMin: null,
  priceMax: null,
  specs: {},
  sort: 'popular',
  status: 'idle',
  items: [],
  total: 0,
  error: null,
  targetSlot: null,
  options: null,
};

function emptyFilters(): CatalogFilters & { sort: SortKey } {
  return { brands: [], priceMin: null, priceMax: null, specs: {}, sort: 'popular' };
}

export function useCatalog({ active, ratings, onItemsLoaded }: UseCatalogOptions): UseCatalogResult {
  const [catalog, setCatalog] = useState<CatalogState>(INITIAL_CATALOG);
  const catalogRef = useRef(INITIAL_CATALOG);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const startedRef = useRef(false);
  const ratingsRef = useRef(ratings);
  const onItemsLoadedRef = useRef(onItemsLoaded);
  const ratingsKey = JSON.stringify(ratings);
  const lastRatingsKeyRef = useRef(ratingsKey);

  useEffect(() => {
    ratingsRef.current = ratings;
    onItemsLoadedRef.current = onItemsLoaded;
  });

  const updateCatalog = useCallback((changes: Partial<CatalogState>) => {
    catalogRef.current = { ...catalogRef.current, ...changes };
    setCatalog(catalogRef.current);
  }, []);

  const runQuery = useCallback(async () => {
    startedRef.current = true;
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    updateCatalog({ status: 'loading', error: null });
    const current = catalogRef.current;

    try {
      const all = await loadCategory(current.category, { signal: controller.signal });
      const result = await searchProducts(
        {
          category: current.category,
          query: current.query,
          brands: current.brands,
          priceMin: current.priceMin,
          priceMax: current.priceMax,
          specs: current.specs,
          sort: current.sort,
          ratings: ratingsRef.current,
        },
        { signal: controller.signal },
      );
      if (requestId !== requestIdRef.current) return;

      onItemsLoadedRef.current(all.items);
      updateCatalog({
        options: getFilterOptions(all.items, current.category),
        items: result.items,
        total: result.total,
        status: result.items.length ? 'success' : 'empty',
      });
    } catch (error) {
      if (isAbortError(error) || requestId !== requestIdRef.current) return;
      const apiError = error instanceof ApiError ? error : null;
      updateCatalog({
        status: 'error',
        error: {
          message: apiError ? apiError.message : 'Попробуйте ещё раз.',
          kind: apiError ? apiError.kind : 'network',
          canRetry: true,
          retryAfter: apiError ? apiError.retryAfter : null,
        },
      });
    } finally {
      if (requestId === requestIdRef.current) controllerRef.current = null;
    }
  }, [updateCatalog]);

  useEffect(() => {
    if (active && !startedRef.current) runQuery();
  }, [active, runQuery]);

  useEffect(() => {
    if (lastRatingsKeyRef.current === ratingsKey) return;
    lastRatingsKeyRef.current = ratingsKey;
    if (startedRef.current && catalogRef.current.status !== 'error') runQuery();
  }, [ratingsKey, runQuery]);

  useEffect(() => {
    return () => {
      startedRef.current = false;
      requestIdRef.current += 1;
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = null;
    };
  }, []);

  const search = useCallback(
    (query: string) => {
      const current = catalogRef.current;
      if (query === current.query && current.status === 'success') return;
      updateCatalog({ query });
      runQuery();
    },
    [updateCatalog, runQuery],
  );

  const setCategory = useCallback(
    (id: CategoryId) => {
      const current = catalogRef.current;
      if (id === current.category) return;
      updateCatalog({
        ...emptyFilters(),
        category: id,
        query: '',
        targetSlot: current.targetSlot === id ? current.targetSlot : null,
      });
      runQuery();
    },
    [updateCatalog, runQuery],
  );

  const applyFilters = useCallback(
    (filters: Partial<CatalogFilters> & { sort?: SortKey }) => {
      updateCatalog(filters);
      runQuery();
    },
    [updateCatalog, runQuery],
  );

  const resetFilters = useCallback(() => {
    updateCatalog({ ...emptyFilters(), sort: catalogRef.current.sort });
    runQuery();
  }, [updateCatalog, runQuery]);

  const setSort = useCallback(
    (sort: SortKey) => {
      updateCatalog({ sort });
      runQuery();
    },
    [updateCatalog, runQuery],
  );

  const retry = useCallback(() => {
    runQuery();
  }, [runQuery]);

  const chooseForSlot = useCallback(
    (slot: CategoryId, replace: boolean) => {
      const targetSlot = replace ? slot : null;
      if (catalogRef.current.category !== slot) {
        updateCatalog({ ...emptyFilters(), category: slot, query: '', targetSlot });
      } else {
        updateCatalog({ targetSlot });
      }
      window.location.hash = '#catalog';
      runQuery();
    },
    [updateCatalog, runQuery],
  );

  const clearTargetSlot = useCallback(() => {
    updateCatalog({ targetSlot: null });
  }, [updateCatalog]);

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
