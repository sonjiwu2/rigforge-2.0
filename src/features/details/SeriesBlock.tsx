import { useEffect, useState } from 'react';
import { isAbortError } from '../../api/vantaspec';
import { getSupplementaryInfo } from '../../api/wikipedia';
import type { SeriesInfo } from '../../api/wikipedia';
import { Button, TextLink } from '../../components/ui';
import type { DetailsTarget } from '../../types';
import { BodyText, Muted, Subtitle } from './DetailsText';
import { isHttpUrl } from './ExternalLink';
import styles from './SeriesBlock.module.css';

type SeriesStatus = 'idle' | 'loading' | 'ready' | 'error';

interface SeriesBlockProps {
  product: DetailsTarget;
  requested: boolean;
}

export function SeriesBlock({ product, requested }: SeriesBlockProps) {
  const [info, setInfo] = useState<SeriesInfo | null>(null);
  const [status, setStatus] = useState<SeriesStatus>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!requested) return;
    const controller = new AbortController();
    setStatus('loading');
    getSupplementaryInfo(product, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setInfo(result);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isAbortError(error)) setStatus('error');
      });
    return () => controller.abort();
  }, [requested, attempt]);

  return (
    <div aria-live="polite">
      {status === 'loading' && <Muted>Загрузка…</Muted>}
      {status === 'error' && (
        <div className={styles.error}>
          <p className={styles.errorTitle}>Дополнительное описание недоступно</p>
          <Muted>Характеристики детали доступны.</Muted>
          <Button variant="secondary" size="sm" onClick={() => setAttempt(attempt + 1)}>
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
