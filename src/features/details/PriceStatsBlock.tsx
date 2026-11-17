import type { PriceStats } from '../../api/vantaspec';
import { Button } from '../../components/ui';
import { formatPrice } from '../../utils/format';
import type { Money } from '../../types';
import { Muted, Subtitle } from './DetailsText';
import styles from './PriceStatsBlock.module.css';

interface PriceStatsBlockProps {
  stats: PriceStats | null;
  failed: boolean;
  money: Money;
  onRetry: () => void;
}

export function PriceStatsBlock({ stats, failed, money, onRetry }: PriceStatsBlockProps) {
  const rows = stats
    ? [
        { term: 'Минимум сейчас', value: formatPrice(stats.currentLowestMinor, money) },
        { term: 'Минимум за период', value: formatPrice(stats.lowestEverMinor, money) },
        { term: 'Средняя', value: formatPrice(stats.averageMinor, money) },
        { term: 'Магазинов', value: String(stats.retailerCount) },
      ]
    : [];

  return (
    <section className={styles.section} aria-labelledby="details-stats-title">
      <Subtitle id="details-stats-title">Цены за 90 дней</Subtitle>
      <div aria-live="polite">
        {stats && (
          <dl className={styles.list}>
            {rows.map((row) => (
              <div key={row.term} className={styles.stat}>
                <dt>{row.term}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!stats && !failed && <Muted>Загрузка…</Muted>}
        {failed && (
          <>
            <Muted>Не удалось загрузить статистику цен</Muted>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Повторить
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
