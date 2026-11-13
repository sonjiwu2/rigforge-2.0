import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { getProductDetails, ATTRIBUTION } from '../../api/vantaspec';
import { Button, Icon } from '../../components/ui';
import { ProductImage } from '../../components/ProductImage/ProductImage';
import { getProductArtwork } from '../../core/artwork';
import { getCategory } from '../../data/catalog';
import { convertFromGbp, formatMoney, formatPrice } from '../../utils/format';
import type { DetailsTarget, Money, Product, ProductAction } from '../../types';
import { BodyText, Muted } from './DetailsText';
import { PhotoCredit } from './PhotoCredit';
import { SpecsList } from './SpecsList';
import styles from './DetailsDialog.module.css';

const TABS = [
  { id: 'specs', label: 'Характеристики' },
  { id: 'desc', label: 'Описание' },
];

const DEFAULT_ACTION: ProductAction = { label: 'В сборку', inBuild: false, disabled: false };

interface DetailsDialogProps {
  target: DetailsTarget | null;
  trigger: HTMLElement | null;
  money: Money;
  action: ProductAction | null;
  onAction: (product: DetailsTarget) => void;
  onGoToBuild: () => void;
  onClose: () => void;
}

interface DetailsContentProps extends DetailsDialogProps {
  target: DetailsTarget;
}

function isFullProduct(product: DetailsTarget): product is Product {
  return 'offers' in product && Array.isArray(product.offers);
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

function DetailsContent({ target, trigger, money, action, onAction, onGoToBuild, onClose }: DetailsContentProps) {
  const [product, setProduct] = useState<DetailsTarget>(target);
  const [tab, setTab] = useState(0);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const goBuildRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

  useEffect(() => {
    if (isFullProduct(target)) return;
    const controller = new AbortController();
    getProductDetails(target, { signal: controller.signal })
      .then((full) => {
        if (!controller.signal.aborted) setProduct(full);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (actionDone && goBuildRef.current) goBuildRef.current.focus();
  }, [actionDone]);

  function handleNativeClose() {
    if (dialogRef.current && !dialogRef.current.open) onClose();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  function selectTab(index: number, focus: boolean) {
    setTab(index);
    if (focus && tabRefs.current[index]) tabRefs.current[index].focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    selectTab(next, true);
  }

  function handleAction() {
    if (currentAction.inBuild) return;
    onAction(product);
    setActionDone(true);
  }

  function handleGoToBuild() {
    leavingRef.current = true;
    onClose();
    onGoToBuild();
  }

  const category = getCategory(product.category);
  const photoArt = getProductArtwork(target);
  const mpn = ('mpn' in product && product.mpn) || getProductArtwork(product).mpn;
  const isPlaceholderPhoto = photoArt.isPlaceholder || photoFailed;
  const currentAction = action || DEFAULT_ACTION;
  const priceNote = product.priceMinor === null ? '' : getPriceNote(product.priceMinor, money);

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
          <div className={isPlaceholderPhoto ? `${styles.photo} ${styles.photoPlaceholder}` : styles.photo}>
            <ProductImage product={target} large onFallback={() => setPhotoFailed(true)} />
            {photoArt.isPlaceholder && (
              <span className={styles.noPhoto} aria-hidden="true">
                Фото отсутствует
              </span>
            )}
          </div>
          {!photoFailed && <PhotoCredit art={photoArt} />}
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
          <div className={styles.tabs} role="tablist" aria-label="Сведения о детали">
            {TABS.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                className={styles.tab}
                id={`details-tab-${item.id}`}
                aria-controls={`details-panel-${item.id}`}
                aria-selected={tab === index}
                tabIndex={tab === index ? 0 : -1}
                onClick={() => selectTab(index, false)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div
            className={styles.panel}
            role="tabpanel"
            id="details-panel-specs"
            aria-labelledby="details-tab-specs"
            tabIndex={0}
            hidden={tab !== 0}
          >
            <SpecsList specs={product.specs} />
            <p className={styles.note}>Совместимость не проверена</p>
          </div>
          <div
            className={styles.panel}
            role="tabpanel"
            id="details-panel-desc"
            aria-labelledby="details-tab-desc"
            tabIndex={0}
            hidden={tab !== 1}
          >
            {isFullProduct(product) && product.description && <BodyText lang="en">{product.description}</BodyText>}
            {isFullProduct(product) && !product.description && <Muted>Описание модели не указано</Muted>}
            {!isFullProduct(product) && <Muted>Загрузка…</Muted>}
          </div>
          <p className={styles.attribution}>
            <a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">
              {ATTRIBUTION.text}
            </a>
          </p>
        </div>
        <footer className={styles.actions}>
          <Button
            className={styles.action}
            variant={currentAction.inBuild ? 'done' : 'primary'}
            icon={currentAction.inBuild ? 'check' : undefined}
            aria-disabled={currentAction.inBuild ? 'true' : undefined}
            disabled={!currentAction.inBuild && currentAction.disabled}
            onClick={handleAction}
          >
            {currentAction.inBuild ? 'В сборке' : currentAction.label || 'В сборку'}
          </Button>
          <Button
            ref={goBuildRef}
            className={styles.action}
            variant="secondary"
            hidden={!(actionDone || currentAction.inBuild)}
            onClick={handleGoToBuild}
          >
            К сборке
          </Button>
        </footer>
      </div>
    </dialog>
  );
}

export function DetailsDialog(props: DetailsDialogProps) {
  if (!props.target) return null;
  return <DetailsContent key={props.target.id} {...props} target={props.target} />;
}
