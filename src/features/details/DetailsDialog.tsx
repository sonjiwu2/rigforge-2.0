import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { ATTRIBUTION } from '../../api/vantaspec';
import { Button, Icon } from '../../components/ui';
import { getCategory } from '../../data/catalog';
import type { DetailsTarget, Money, NewReview, ProductAction, RatingSummary, Review } from '../../types';
import { DescriptionText } from './DescriptionText';
import { DetailsActions } from './DetailsActions';
import { DetailsPhoto } from './DetailsPhoto';
import { DetailsSummary } from './DetailsSummary';
import { DetailsPanel, DetailsTabs } from './DetailsTabs';
import type { DetailsTabId } from './DetailsTabs';
import { OffersBlock } from './OffersBlock';
import { PriceStatsBlock } from './PriceStatsBlock';
import { ReviewsBlock } from './ReviewsBlock';
import { SeriesBlock } from './SeriesBlock';
import { SpecsList } from './SpecsList';
import { useProductDetails } from './useProductDetails';
import styles from './DetailsDialog.module.css';

interface DetailsDialogProps {
  target: DetailsTarget | null;
  trigger: HTMLElement | null;
  money: Money;
  reviews: Review[];
  rating: RatingSummary;
  action: ProductAction | null;
  onAction: (product: DetailsTarget) => void;
  onAddReview: (productId: string, review: NewReview) => boolean;
  onDeleteReview: (productId: string, reviewId: string) => void;
  onGoToBuild: () => void;
  onClose: () => void;
}

interface DetailsContentProps extends DetailsDialogProps {
  target: DetailsTarget;
}

function resolveRating(rating: RatingSummary, reviews: Review[]): RatingSummary {
  if (rating.count > 0 && Number.isFinite(rating.average)) return rating;
  if (!reviews.length) return { average: null, count: 0 };
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

function DetailsContent({
  target,
  trigger,
  money,
  reviews,
  rating,
  action,
  onAction,
  onAddReview,
  onDeleteReview,
  onGoToBuild,
  onClose,
}: DetailsContentProps) {
  const details = useProductDetails(target);
  const { product } = details;
  const [tab, setTab] = useState<DetailsTabId>('specs');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reviewsPanelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!returnFocusRef.current) {
      const active = document.activeElement;
      returnFocusRef.current = trigger || (active instanceof HTMLElement ? active : null);
    }
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    if (closeRef.current) closeRef.current.focus();

    return () => {
      const back = returnFocusRef.current;
      if (!leavingRef.current && back && back.isConnected) back.focus();
    };
  }, []);

  function handleNativeClose() {
    if (dialogRef.current && !dialogRef.current.open) onClose();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  function selectTab(id: DetailsTabId) {
    setTab(id);
    if (id === 'desc') details.requestSeries();
  }

  function handleGoToBuild() {
    leavingRef.current = true;
    onClose();
    onGoToBuild();
  }

  const category = getCategory(product.category);
  const currentRating = resolveRating(rating, reviews);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="details-title"
      onClose={handleNativeClose}
      onClick={handleDialogClick}
    >
      <div className={styles.shell}>
        <header className={styles.head}>
          <button type="button" className={styles.back} onClick={onClose}>
            <Icon name="chevron-left" />
            <span className={styles.crumbs}>Каталог / {category ? category.title : ''}</span>
          </button>
          <Button
            ref={closeRef}
            variant="icon"
            icon="close"
            aria-label="Закрыть сведения о детали"
            onClick={onClose}
          />
        </header>
        <div className={styles.scroll}>
          <DetailsPhoto product={target} />
          <DetailsSummary product={product} money={money} />
          <DetailsTabs active={tab} reviewsCount={currentRating.count} onSelect={selectTab} />
          <DetailsPanel id="specs" active={tab}>
            <SpecsList specs={product.specs} />
            <p className={styles.note}>Совместимость не проверена</p>
            <PriceStatsBlock
              stats={details.stats}
              failed={details.statsFailed}
              money={money}
              onRetry={details.retryStats}
            />
            <OffersBlock
              product={product}
              failed={details.detailsFailed}
              money={money}
              onRetry={details.retryDetails}
            />
          </DetailsPanel>
          <DetailsPanel id="desc" active={tab}>
            <DescriptionText product={product} />
            <SeriesBlock info={details.series} status={details.seriesStatus} onRetry={details.retrySeries} />
          </DetailsPanel>
          <DetailsPanel id="reviews" active={tab} panelRef={reviewsPanelRef}>
            <ReviewsBlock
              productId={product.id}
              reviews={reviews}
              rating={currentRating}
              panelRef={reviewsPanelRef}
              onAddReview={onAddReview}
              onDeleteReview={onDeleteReview}
            />
          </DetailsPanel>
          <p className={styles.attribution}>
            <a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">
              {ATTRIBUTION.text}
            </a>
          </p>
        </div>
        <DetailsActions action={action} onAction={() => onAction(product)} onGoToBuild={handleGoToBuild} />
      </div>
    </dialog>
  );
}

export function DetailsDialog(props: DetailsDialogProps) {
  if (!props.target) return null;
  return <DetailsContent key={props.target.id} {...props} target={props.target} />;
}
