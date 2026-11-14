import { useId } from 'react';
import { ProductImage } from '../../components/ProductImage/ProductImage';
import { Button, Icon, VisuallyHidden } from '../../components/ui';
import { getProductArtwork } from '../../core/artwork';
import { CATEGORIES } from '../../data/catalog';
import { calculateBuildTotals, countText, priceText } from '../build/totals';
import type { Build, Category, CategoryId, Money, ProductSnapshot } from '../../types';
import styles from './SavedCard.module.css';

const DETAIL_FORMS = ['деталь', 'детали', 'деталей'];
const DETAIL_FORMS_GENITIVE = ['детали', 'деталей', 'деталей'];
const KEY_SLOTS: CategoryId[] = ['cpu', 'gpu', 'ram'];

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

interface KeyPart {
  category: Category;
  part: ProductSnapshot;
}

function keyParts(build: Build): KeyPart[] {
  const first = KEY_SLOTS.flatMap((id) => CATEGORIES.filter((category) => category.id === id));
  const rest = CATEGORIES.filter((category) => !KEY_SLOTS.includes(category.id));
  const parts: KeyPart[] = [];
  for (const category of [...first, ...rest]) {
    const part = build.slots[category.id];
    if (part) parts.push({ category, part });
    if (parts.length === 3) break;
  }
  return parts;
}

interface SavedCardProps {
  build: Build;
  money: Money;
  isCurrent: boolean;
  onOpen: () => void;
}

export function SavedCard({ build, money, isCurrent, onOpen }: SavedCardProps) {
  const nameId = useId();
  const parts = keyParts(build);
  const totals = calculateBuildTotals(build);

  return (
    <article className={styles.card} aria-labelledby={nameId}>
      <div className={styles.head}>
        <h2 className={styles.name} id={nameId}>
          {build.name}
        </h2>
      </div>
      {isCurrent && (
        <p className={styles.current}>
          <Icon name="check" />
          <span>Открыта на вкладке «Сборка»</span>
        </p>
      )}
      {parts.length > 0 ? (
        <div className={styles.tiles} aria-hidden="true">
          {parts.map(({ category, part }) => (
            <span className={styles.tile} key={category.id}>
              {getProductArtwork(part).isPlaceholder ? (
                <Icon name={category.icon} />
              ) : (
                <ProductImage product={part} />
              )}
            </span>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>Детали не выбраны</p>
      )}
      {parts.length > 0 && (
        <dl className={styles.parts}>
          {parts.map(({ category, part }) => (
            <div className={styles.part} key={category.id}>
              <dt>{category.slotTitle}</dt>
              <dd>{part.name}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className={styles.foot}>
        <div className={styles.total}>
          <span className={styles.count}>{countText(totals.count, DETAIL_FORMS)}</span>
          {totals.mixedCurrencies ? (
            <span className={`${styles.sum} ${styles.sumNote}`}>Цены в разных валютах</span>
          ) : (
            <span className={styles.sum}>{priceText(totals.knownTotalMinor, totals.currency, money)}</span>
          )}
        </div>
        {totals.unknownCount > 0 && (
          <p className={styles.missing}>
            Сумма известных позиций. Для {countText(totals.unknownCount, DETAIL_FORMS_GENITIVE)} цена не указана
          </p>
        )}
        {build.savedAt && (
          <p className={styles.date}>
            Сохранено <time dateTime={build.savedAt}>{dateFormat.format(new Date(build.savedAt))}</time>
          </p>
        )}
        <Button className={styles.open} variant="primary" block onClick={onOpen}>
          Открыть сборку
          <VisuallyHidden> «{build.name}»</VisuallyHidden>
        </Button>
      </div>
    </article>
  );
}
