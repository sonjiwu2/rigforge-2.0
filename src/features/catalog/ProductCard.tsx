import { useRef } from 'react';
import type { MouseEvent } from 'react';
import { Button, LinkButton, VisuallyHidden } from '../../components/ui';
import { ProductImage } from '../../components/ProductImage/ProductImage';
import { getProductArtwork } from '../../core/artwork';
import { getSpec } from '../../core/products';
import { getCategory } from '../../data/catalog';
import { formatPrice, pluralRu } from '../../utils/format';
import type { Money, Product, RatingSummary } from '../../types';
import { RatingLine } from './Stars';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  money: Money;
  inBuild: boolean;
  label: string;
  rating: RatingSummary;
  onAdd: (product: Product) => void;
  onOpenDetails: (product: Product, trigger: HTMLElement) => void;
}

function getCardSpecs(product: Product): string[] {
  const category = getCategory(product.category);
  const keys = category ? category.cardSpecs : [];
  const values: string[] = [];
  for (const key of keys) {
    const value = getSpec(product, key);
    if (!value) continue;
    if (/^\d+$/.test(value)) {
      const spec = product.specs.find((item) => item.key === key);
      values.push(`${spec && spec.label ? spec.label : key}: ${value}`);
    } else {
      values.push(value);
    }
  }
  return values.slice(0, 2);
}

function getCtaIcon(inBuild: boolean, label: string): string {
  if (inBuild) return 'check';
  return label.startsWith('Заменить') ? 'refresh' : 'plus';
}

export function ProductCard({ product, money, inBuild, label, rating, onAdd, onOpenDetails }: ProductCardProps) {
  const nameRef = useRef<HTMLButtonElement>(null);
  const isPlaceholder = getProductArtwork(product).isPlaceholder;
  const specs = getCardSpecs(product);
  const shops = product.popularity.offers;
  const hasPrice = product.priceMinor !== null;

  function handlePhotoClick() {
    if (nameRef.current) onOpenDetails(product, nameRef.current);
  }

  function handleDetailsClick(event: MouseEvent<HTMLButtonElement>) {
    onOpenDetails(product, event.currentTarget);
  }

  function handleAddClick() {
    if (!inBuild) onAdd(product);
  }

  return (
    <article className={styles.card}>
      <div className={styles.photo} onClick={handlePhotoClick}>
        <ProductImage product={product} />
        {isPlaceholder && (
          <span className={styles.noPhoto} aria-hidden="true">
            Фото отсутствует
          </span>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>
          <button ref={nameRef} className={styles.name} type="button" onClick={handleDetailsClick}>
            {product.name}
          </button>
        </h3>
        {specs.length > 0 && <p className={styles.specs}>{specs.join(' · ')}</p>}
        <div className={styles.meta}>
          <RatingLine rating={rating} />
          {shops > 0 && (
            <p className={styles.shops}>
              В {shops} {pluralRu(shops, ['магазине', 'магазинах', 'магазинах'])}
            </p>
          )}
        </div>
        {hasPrice ? (
          <p className={styles.price}>
            {product.priceKind === 'from' && <span className={styles.from}>от </span>}
            {formatPrice(product.priceMinor, money)}
          </p>
        ) : (
          <p className={`${styles.price} ${styles.priceUnknown}`}>Цена не указана</p>
        )}
        <div className={styles.actions}>
          <LinkButton className={styles.more} onClick={handleDetailsClick}>
            Подробнее
            <VisuallyHidden>: {product.name}</VisuallyHidden>
          </LinkButton>
          <Button
            className={styles.cta}
            variant={inBuild ? 'done' : 'primary'}
            size="sm"
            icon={getCtaIcon(inBuild, label)}
            aria-disabled={inBuild ? 'true' : undefined}
            onClick={handleAddClick}
          >
            <span>{label}</span>
            <VisuallyHidden>: {product.name}</VisuallyHidden>
          </Button>
        </div>
      </div>
    </article>
  );
}
