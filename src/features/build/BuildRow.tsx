import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { ProductImage } from '../../components/ProductImage/ProductImage';
import { Button, Icon, LinkButton, VisuallyHidden } from '../../components/ui';
import { getProductArtwork } from '../../core/artwork';
import { priceText } from './totals';
import type { Category, CategoryId, Money, ProductSnapshot } from '../../types';
import styles from './BuildRow.module.css';

interface BuildRowProps {
  category: Category;
  part: ProductSnapshot | null;
  money: Money;
  onOpenDetails: (part: ProductSnapshot, trigger: HTMLElement) => void;
  onReplace: (slotId: CategoryId) => void;
  onChoose: (slotId: CategoryId) => void;
  onRemove: (slotId: CategoryId) => void;
}

export function BuildRow({ category, part, money, onOpenDetails, onReplace, onChoose, onRemove }: BuildRowProps) {
  const nameRef = useRef<HTMLButtonElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const removedHereRef = useRef(false);

  useEffect(() => {
    if (!part && removedHereRef.current) {
      removedHereRef.current = false;
      chooseRef.current?.focus();
    }
  }, [part]);

  if (!part) {
    return (
      <li className={`${styles.row} ${styles.rowEmpty}`}>
        <span className={styles.art}>
          <Icon name={category.icon} />
        </span>
        <div className={styles.info}>
          <p className={styles.category}>{category.slotTitle}</p>
          <p className={styles.none}>Не выбрано</p>
        </div>
        <Button
          ref={chooseRef}
          className={styles.choose}
          variant="secondary"
          size="sm"
          onClick={() => onChoose(category.id)}
        >
          Выбрать
          <VisuallyHidden> {category.accusative}</VisuallyHidden>
        </Button>
      </li>
    );
  }

  const product = part;
  const hasPrice = product.priceMinor !== null && Number.isSafeInteger(product.priceMinor);
  const specs = product.specs.slice(0, 2);

  function openFromArt() {
    if (nameRef.current) onOpenDetails(product, nameRef.current);
  }

  function openFromButton(event: MouseEvent<HTMLButtonElement>) {
    onOpenDetails(product, event.currentTarget);
  }

  function handleRemove() {
    removedHereRef.current = true;
    onRemove(category.id);
  }

  return (
    <li className={styles.row}>
      <button className={styles.art} type="button" tabIndex={-1} aria-hidden="true" onClick={openFromArt}>
        {getProductArtwork(product).isPlaceholder ? <Icon name={category.icon} /> : <ProductImage product={product} />}
      </button>
      <div className={styles.info}>
        <p className={styles.category}>{category.slotTitle}</p>
        <h3 className={styles.name}>
          <button ref={nameRef} className={styles.nameButton} type="button" onClick={openFromButton}>
            {product.name}
          </button>
        </h3>
        {specs.length > 0 && (
          <p className={styles.specs}>{specs.map((spec) => `${spec.label}: ${spec.value}`).join(' · ')}</p>
        )}
      </div>
      <div className={styles.priceBox}>
        {hasPrice ? (
          <p className={styles.price}>{priceText(product.priceMinor, product.currency, money)}</p>
        ) : (
          <p className={`${styles.price} ${styles.priceUnknown}`}>Цена не указана</p>
        )}
        <LinkButton className={styles.more} onClick={openFromButton}>
          Подробнее
          <VisuallyHidden>: {product.name}</VisuallyHidden>
        </LinkButton>
      </div>
      <Button className={styles.replace} variant="secondary" size="sm" onClick={() => onReplace(category.id)}>
        Заменить
        <VisuallyHidden> {category.accusative}</VisuallyHidden>
      </Button>
      <Button
        className={styles.remove}
        variant="icon"
        icon="close"
        aria-label={`Убрать ${product.name}`}
        onClick={handleRemove}
      />
    </li>
  );
}
