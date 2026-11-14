import { Button, TextLink, VisuallyHidden } from '../../components/ui';
import { formatMoney, formatPrice } from '../../utils/format';
import type { DetailsTarget, Money, Offer, Product } from '../../types';
import { Muted, Subtitle } from './DetailsText';
import { isHttpUrl } from './ExternalLink';
import { isFullProduct } from './isFullProduct';
import styles from './OffersBlock.module.css';

interface OffersBlockProps {
  product: DetailsTarget;
  failed: boolean;
  money: Money;
  onRetry: () => void;
}

function formatOfferPrice(offer: Offer, money: Money): string {
  if (offer.currency && offer.currency !== 'GBP') return formatMoney(offer.priceMinor, offer.currency);
  return formatPrice(offer.priceMinor, money);
}

function formatAsOf(priceAsOf: string): string {
  const date = new Date(priceAsOf);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
}

function OffersList({ product, money }: { product: Product; money: Money }) {
  const offers = [...product.offers].sort((a, b) => a.priceMinor - b.priceMinor);
  if (!offers.length) return <Muted>Магазины не указаны</Muted>;
  const asOf = product.priceAsOf ? formatAsOf(product.priceAsOf) : '';

  return (
    <>
      <ul className={styles.list}>
        {offers.map((offer, index) => (
          <li key={`${offer.retailer}-${index}`} className={styles.offer}>
            <span className={styles.shop}>{offer.retailer || 'Магазин'}</span>
            <span className={styles.price}>{formatOfferPrice(offer, money)}</span>
            {offer.url && isHttpUrl(offer.url) && (
              <TextLink className={styles.link} href={offer.url} target="_blank" rel="noopener noreferrer">
                В магазин
                <VisuallyHidden> {offer.retailer} (откроется в новой вкладке)</VisuallyHidden>
              </TextLink>
            )}
          </li>
        ))}
      </ul>
      {asOf && <Muted className={styles.asOf}>Цены загружены {asOf}</Muted>}
    </>
  );
}

export function OffersBlock({ product, failed, money, onRetry }: OffersBlockProps) {
  let content = <Muted>Загрузка…</Muted>;
  if (isFullProduct(product)) {
    content = <OffersList product={product} money={money} />;
  } else if (failed) {
    content = (
      <>
        <Muted>Не удалось загрузить полные сведения о детали</Muted>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Повторить
        </Button>
      </>
    );
  }

  return (
    <section className={styles.section} aria-labelledby="details-offers-title">
      <Subtitle id="details-offers-title">Предложения магазинов</Subtitle>
      <div>{content}</div>
    </section>
  );
}
