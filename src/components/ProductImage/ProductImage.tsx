import { useState } from 'react';
import { getProductArtwork, PLACEHOLDER_ALT } from '../../core/artwork';
import type { DetailsTarget } from '../../types';
import styles from './ProductImage.module.css';

interface ProductImageProps {
  product: DetailsTarget;
  large?: boolean;
  className?: string;
  onFallback?: () => void;
}

export function ProductImage({ product, large = false, className, onFallback }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const art = getProductArtwork(product);
  const image = large && art.gallery.length ? art.gallery[0] : art;
  const failed = failedSrc === image.src;
  const useFallback = failed && art.fallbackSrc !== '';
  const isPlaceholder = art.isPlaceholder || useFallback;
  const src = useFallback ? art.fallbackSrc : image.src;

  function handleError() {
    if (failed) return;
    setFailedSrc(image.src);
    if (onFallback) onFallback();
  }

  const classNames = [styles.image];
  if (className) classNames.push(className);

  return (
    <img
      className={classNames.join(' ')}
      data-placeholder={isPlaceholder ? 'true' : undefined}
      alt={useFallback ? PLACEHOLDER_ALT : art.alt}
      width={image.width}
      height={image.height}
      decoding="async"
      referrerPolicy="no-referrer"
      loading={large ? undefined : 'lazy'}
      src={src || undefined}
      onError={handleError}
    />
  );
}
