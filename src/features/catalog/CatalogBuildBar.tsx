import { Button } from '../../components/ui';
import { CATEGORIES } from '../../data/catalog';
import { formatPrice, pluralRu } from '../../utils/format';
import type { Build, Money } from '../../types';
import styles from './CatalogBuildBar.module.css';

interface CatalogBuildBarProps {
  build: Build;
  money: Money;
  onGoToBuild: () => void;
}

function getTotalText(count: number, unknown: number, total: number, money: Money): string {
  if (count === 0) return 'В сборке пока нет деталей';
  const sum = unknown === count ? 'цена не указана' : formatPrice(total, money);
  return `${count} ${pluralRu(count, ['деталь', 'детали', 'деталей'])} · ${sum}`;
}

export function CatalogBuildBar({ build, money, onGoToBuild }: CatalogBuildBarProps) {
  let count = 0;
  let unknown = 0;
  let total = 0;
  for (const category of CATEGORIES) {
    const part = build.slots[category.id];
    if (!part) continue;
    count += 1;
    if (part.priceMinor !== null && Number.isFinite(part.priceMinor)) total += part.priceMinor;
    else unknown += 1;
  }

  const sub: string[] = [];
  if (unknown) sub.push(`из них ${unknown} без цены`);
  if (build.budgetMinor !== null && Number.isFinite(build.budgetMinor)) {
    sub.push(`Бюджет ${formatPrice(build.budgetMinor, money)}`);
  }

  return (
    <section className={styles.bar} aria-label="Текущая сборка">
      <div className={styles.info}>
        <p className={styles.total}>{getTotalText(count, unknown, total, money)}</p>
        {sub.length > 0 && <p className={styles.sub}>{sub.join(' · ')}</p>}
      </div>
      <Button className={styles.button} variant="light" onClick={onGoToBuild}>
        К сборке
      </Button>
    </section>
  );
}
