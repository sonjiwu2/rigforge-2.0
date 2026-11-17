import type { SeriesInfo } from '../../api/wikipedia';
import { Button, TextLink } from '../../components/ui';
import { BodyText, Muted, Subtitle } from './DetailsText';
import { isHttpUrl } from './ExternalLink';
import type { SeriesStatus } from './useProductDetails';
import styles from './SeriesBlock.module.css';

interface SeriesBlockProps {
  info: SeriesInfo | null;
  status: SeriesStatus;
  onRetry: () => void;
}

export function SeriesBlock({ info, status, onRetry }: SeriesBlockProps) {
  return (
    <div aria-live="polite">
      {status === 'loading' && <Muted>Загрузка…</Muted>}
      {status === 'error' && (
        <div className={styles.error}>
          <p className={styles.errorTitle}>Дополнительное описание недоступно</p>
          <Muted>Характеристики детали доступны.</Muted>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Повторить
          </Button>
        </div>
      )}
      {status === 'ready' && info && (
        <section className={styles.box} aria-labelledby="details-series-title">
          <Subtitle id="details-series-title">О серии</Subtitle>
          {info.title && <p className={styles.name}>{info.title}</p>}
          {info.extract
            .split(/\n+/)
            .filter((paragraph) => paragraph.trim())
            .map((paragraph, index) => (
              <BodyText key={index} lang={info.lang || 'en'}>
                {paragraph.trim()}
              </BodyText>
            ))}
          <p className={styles.source}>
            Источник: Wikipedia (англ.), CC BY-SA 4.0.{' '}
            {info.url && isHttpUrl(info.url) && (
              <TextLink href={info.url} target="_blank" rel="noopener noreferrer">
                Открыть статью
              </TextLink>
            )}
          </p>
          <Muted>Сведения о серии в целом, а не о конкретной модели.</Muted>
        </section>
      )}
    </div>
  );
}
