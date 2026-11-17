import { useState } from 'react';
import { ProductImage } from '../../components/ProductImage/ProductImage';
import { getProductArtwork } from '../../core/artwork';
import type { DetailsTarget } from '../../types';
import { PhotoCredit } from './PhotoCredit';
import styles from './DetailsPhoto.module.css';

export function DetailsPhoto({ product }: { product: DetailsTarget }) {
  const [failed, setFailed] = useState(false);
  const art = getProductArtwork(product);
  const isPlaceholder = art.isPlaceholder || failed;

  return (
    <>
      <div className={isPlaceholder ? `${styles.photo} ${styles.placeholder}` : styles.photo}>
        <ProductImage product={product} large onFallback={() => setFailed(true)} />
        {art.isPlaceholder && (
          <span className={styles.noPhoto} aria-hidden="true">
            Фото отсутствует
          </span>
        )}
      </div>
      {!failed && <PhotoCredit art={art} />}
    </>
  );
}
