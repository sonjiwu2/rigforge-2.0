import { useState } from 'react';
import { PageHead, PageTitle } from '../../components/layout';
import { Button } from '../../components/ui';
import { ATTRIBUTION } from '../../api/vantaspec';
import { getCategory } from '../../data/catalog';
import { pluralRu } from '../../utils/format';
import type { Build, CatalogFilters, CatalogState, CategoryId, Money, Product, RatingSummary, SortKey } from '../../types';
import { CatalogBuildBar } from './CatalogBuildBar';
import { CatalogSearch } from './CatalogSearch';
import { CatalogStatus } from './CatalogStatus';
import { CatalogToolbar } from './CatalogToolbar';
import { CategoryNav } from './CategoryNav';
import { countActiveFilters } from './filterForm';
import { FiltersDialog } from './FiltersDialog';
import { FiltersPanel } from './FiltersPanel';
import { ProductCard } from './ProductCard';
import styles from './CatalogView.module.css';

interface CatalogViewProps {
  catalog: CatalogState;
  money: Money;
  build: Build;
  search: (query: string) => void;
  setCategory: (id: CategoryId) => void;
  applyFilters: (filters: Partial<CatalogFilters> & { sort?: SortKey }) => void;
  resetFilters: () => void;
  setSort: (sort: SortKey) => void;
  retry: () => void;
  clearTargetSlot: () => void;
  isInBuild: (product: Product) => boolean;
  getAddLabel: (product: Product) => string;
  getRating: (productId: string) => RatingSummary;
  onAdd: (product: Product) => void;
  onOpenDetails: (product: Product, trigger: HTMLElement) => void;
  onGoToBuild: () => void;
}

function getCountText(catalog: CatalogState, loadingFirst: boolean): string {
  if (loadingFirst) return 'Загрузка…';
  if (catalog.status === 'error') return '';
  return `${catalog.total} ${pluralRu(catalog.total, ['модель', 'модели', 'моделей'])}`;
}

function getCardRating(rating: RatingSummary): RatingSummary {
  return rating.count > 0 && Number.isFinite(rating.average) ? rating : { average: null, count: 0 };
}

export function CatalogView(props: CatalogViewProps) {
  const { catalog, money } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const category = getCategory(catalog.category);
  const target = catalog.targetSlot ? getCategory(catalog.targetSlot) : null;
  const hasItems = catalog.items.length > 0;
  const loading = catalog.status === 'loading' || catalog.status === 'idle';
  const stale = loading && hasItems;
  const isEmpty = catalog.status === 'empty' || (catalog.status === 'success' && !hasItems);
  const showGrid = hasItems && catalog.status !== 'error' && catalog.status !== 'empty';

  return (
    <div className={styles.catalog}>
      <PageHead className={styles.head}>
        <PageTitle>Каталог</PageTitle>
      </PageHead>
      {target && (
        <div className={styles.replace}>
          <p className={styles.replaceText}>
            Выбери <strong>{target.accusative}</strong> для замены
          </p>
          <Button variant="secondary" size="sm" onClick={props.clearTargetSlot}>
            Отмена
          </Button>
        </div>
      )}
      <CatalogSearch query={catalog.query} onSearch={props.search} />
      <CategoryNav category={catalog.category} onChange={props.setCategory} />
      <div className={styles.body}>
        <CatalogToolbar
          className={styles.toolbar}
          countText={getCountText(catalog, loading && !hasItems)}
          activeFilters={countActiveFilters(catalog)}
          sort={catalog.sort}
          onSort={props.setSort}
          onOpenFilters={() => setFiltersOpen(true)}
        />
        <FiltersPanel
          className={styles.sidebar}
          catalog={catalog}
          money={money}
          applyFilters={props.applyFilters}
          resetFilters={props.resetFilters}
        />
        <div className={styles.results} aria-busy={loading}>
          {stale && <p className={styles.loadingLine}>Загрузка…</p>}
          <CatalogStatus
            loading={loading && !hasItems}
            empty={isEmpty}
            error={catalog.error}
            showError={catalog.status === 'error'}
            onReset={props.resetFilters}
            onRetry={props.retry}
          />
          <ul
            className={stale ? `${styles.grid} ${styles.stale}` : styles.grid}
            aria-label={category ? category.title : 'Модели'}
            hidden={!showGrid}
            inert={stale}
          >
            {catalog.items.map((product) => {
              const inBuild = props.isInBuild(product);
              return (
                <li key={product.id} className={styles.item}>
                  <ProductCard
                    product={product}
                    money={money}
                    inBuild={inBuild}
                    label={inBuild ? 'В сборке' : props.getAddLabel(product) || 'В сборку'}
                    rating={getCardRating(props.getRating(product.id))}
                    onAdd={props.onAdd}
                    onOpenDetails={props.onOpenDetails}
                  />
                </li>
              );
            })}
          </ul>
          <p className={styles.attribution}>
            <a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">
              {ATTRIBUTION.text}
            </a>
          </p>
        </div>
      </div>
      <CatalogBuildBar build={props.build} money={money} onGoToBuild={props.onGoToBuild} />
      <FiltersDialog
        open={filtersOpen}
        catalog={catalog}
        money={money}
        applyFilters={props.applyFilters}
        onClose={() => setFiltersOpen(false)}
      />
    </div>
  );
}
