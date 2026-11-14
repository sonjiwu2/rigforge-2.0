import { useEffect, useState } from 'react';
import { getPriceStats, isAbortError } from '../../api/vantaspec';
import type { PriceStats } from '../../api/vantaspec';
import { Button } from '../../components/ui';
import { formatPrice } from '../../utils/format';
import type { DetailsTarget, Money } from '../../types';
import { Muted, Subtitle } from './DetailsText';
import styles from './PriceStatsBlock.module.css';

interface PriceStatsBlockProps {
  product: DetailsTarget;
  money: Money;
}

export function PriceStatsBlock({ product, money }: PriceStatsBlockProps) {
  const [stats, setStats] = useState<PriceStats | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStats(null);
    setFailed(false);
    getPriceStats(product, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setStats(result);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isAbortError(error)) setFailed(true);
      });
    return () => controller.abort();
  }, [attempt]);

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
            <Button variant="secondary" size="sm" onClick={() => setAttempt(attempt + 1)}>
              Повторить
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
