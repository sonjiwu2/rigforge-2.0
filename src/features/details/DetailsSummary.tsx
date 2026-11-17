import { getProductArtwork } from '../../core/artwork';
import { convertFromGbp, formatMoney, formatPrice } from '../../utils/format';
import type { DetailsTarget, Money } from '../../types';
import styles from './DetailsSummary.module.css';

interface DetailsSummaryProps {
  product: DetailsTarget;
  money: Money;
}

function formatRateDate(date: string | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || '');
  return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
}

function getPriceNote(priceMinor: number, money: Money): string {
  if (convertFromGbp(priceMinor, money).currency === 'GBP') return '';
  const date = formatRateDate(money.date);
  const rate = date ? `≈ по курсу на ${date}` : '≈ по текущему курсу';
  return `${rate}, в магазине ${formatMoney(priceMinor, 'GBP')}`;
}

export function DetailsSummary({ product, money }: DetailsSummaryProps) {
  const mpn = ('mpn' in product && product.mpn) || getProductArtwork(product).mpn;
  const priceNote = product.priceMinor === null ? '' : getPriceNote(product.priceMinor, money);

  return (
    <>
      {product.manufacturer && <p className={styles.brand}>{product.manufacturer}</p>}
      <h2 className={styles.title} id="details-title">
        {product.name}
      </h2>
      {mpn && <p className={styles.mpn}>MPN: {mpn}</p>}
      {product.priceMinor === null ? (
        <p className={`${styles.price} ${styles.priceUnknown}`}>Цена не указана</p>
      ) : (
        <p className={styles.price}>
          {'priceKind' in product && product.priceKind === 'from' && <span className={styles.priceFrom}>от </span>}
          {formatPrice(product.priceMinor, money)}
        </p>
      )}
      {priceNote && <p className={styles.priceNote}>{priceNote}</p>}
    </>
  );
}
