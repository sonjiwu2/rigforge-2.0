import type { ProductArtwork } from '../../core/artwork';
import { ExternalLink, isHttpUrl } from './ExternalLink';
import styles from './PhotoCredit.module.css';

export function PhotoCredit({ art }: { art: ProductArtwork }) {
  if (art.isPlaceholder) return null;

  const isVantaspec = art.sourceKind === 'vantaspec';
  const rows = [
    { term: 'Автор', value: art.creator },
    { term: 'Лицензия', value: isVantaspec ? null : art.rightsStatus },
  ];

  return (
    <div className={styles.credit}>
      <details className={styles.box}>
        <summary className={styles.toggle}>Фото и лицензия</summary>
        <div className={styles.body}>
          {isVantaspec && <p>Фото: VantaSpec, права у производителя.</p>}
          {!isVantaspec && art.attribution && <p>{art.attribution}</p>}
          <dl className={styles.list}>
            {rows.map((row) =>
              row.value ? (
                <div key={row.term} className={styles.row}>
                  <dt>{row.term}</dt>
                  <dd>{row.value}</dd>
                </div>
              ) : null,
            )}
          </dl>
          <p className={styles.links}>
            {art.sourceUrl && isHttpUrl(art.sourceUrl) && (
              <ExternalLink href={art.sourceUrl}>
                {isVantaspec ? 'Страница товара на VantaSpec' : 'Источник фото'}
              </ExternalLink>
            )}
            {art.licenseUrl && isHttpUrl(art.licenseUrl) && <ExternalLink href={art.licenseUrl}>Лицензия</ExternalLink>}
            {art.licenseFileUrl && <ExternalLink href={art.licenseFileUrl}>Текст лицензии</ExternalLink>}
          </p>
        </div>
      </details>
    </div>
  );
}
