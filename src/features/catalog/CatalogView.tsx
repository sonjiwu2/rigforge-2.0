import { PageHead, PageTitle } from '../../components/layout';
import { ATTRIBUTION } from '../../api/vantaspec';
import { getCategory } from '../../data/catalog';
import { pluralRu } from '../../utils/format';
import type { CatalogState, CategoryId, Money, Product, RatingSummary } from '../../types';
import { CatalogSearch } from './CatalogSearch';
import { CatalogToolbar } from './CatalogToolbar';
import { CategoryNav } from './CategoryNav';
import { ProductCard } from './ProductCard';
import styles from './CatalogView.module.css';

interface CatalogViewProps {
  catalog: CatalogState;
  money: Money;
  search: (query: string) => void;
  setCategory: (id: CategoryId) => void;
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
        <CatalogToolbar countText={countText} />
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
    </div>
  );
}
