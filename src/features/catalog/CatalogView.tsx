import { useState } from 'react';
import { PageHead, PageTitle } from '../../components/layout';
import { ATTRIBUTION } from '../../api/vantaspec';
import { getCategory } from '../../data/catalog';
import { pluralRu } from '../../utils/format';
import type { CatalogFilters, CatalogState, CategoryId, Money, Product, RatingSummary, SortKey } from '../../types';
import { CatalogSearch } from './CatalogSearch';
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
  search: (query: string) => void;
  setCategory: (id: CategoryId) => void;
  applyFilters: (filters: Partial<CatalogFilters> & { sort?: SortKey }) => void;
  resetFilters: () => void;
  setSort: (sort: SortKey) => void;
  isInBuild: (product: Product) => boolean;
  getAddLabel: (product: Product) => string;
  getRating: (productId: string) => RatingSummary;
  onAdd: (product: Product) => void;
  onOpenDetails: (product: Product, trigger: HTMLElement) => void;
}

function getCardRating(rating: RatingSummary): RatingSummary {
  return rating.count > 0 && Number.isFinite(rating.average) ? rating : { average: null, count: 0 };
}

export function CatalogView(props: CatalogViewProps) {
  const { catalog, money } = props;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const category = getCategory(catalog.category);
  const countText = `${catalog.total} ${pluralRu(catalog.total, ['модель', 'модели', 'моделей'])}`;

  return (
    <div className={styles.catalog}>
      <PageHead className={styles.head}>
        <PageTitle>Каталог</PageTitle>
      </PageHead>
      <CatalogSearch query={catalog.query} onSearch={props.search} />
      <CategoryNav category={catalog.category} onChange={props.setCategory} />
      <div className={styles.body}>
        <CatalogToolbar
          className={styles.toolbar}
          countText={countText}
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
        <div className={styles.results}>
          <ul className={styles.grid} aria-label={category ? category.title : 'Модели'}>
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
