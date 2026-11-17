import { useEffect, useState } from 'react';
import { getPriceStats, getProductDetails, isAbortError } from '../../api/vantaspec';
import type { PriceStats } from '../../api/vantaspec';
import { getSupplementaryInfo } from '../../api/wikipedia';
import type { SeriesInfo } from '../../api/wikipedia';
import type { DetailsTarget } from '../../types';
import { isFullProduct } from './isFullProduct';

export type SeriesStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useProductDetails(target: DetailsTarget) {
  const [product, setProduct] = useState<DetailsTarget>(target);
  const [detailsFailed, setDetailsFailed] = useState(false);
  const [detailsAttempt, setDetailsAttempt] = useState(0);

  const [stats, setStats] = useState<PriceStats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [statsAttempt, setStatsAttempt] = useState(0);

  const [seriesRequested, setSeriesRequested] = useState(false);
  const [series, setSeries] = useState<SeriesInfo | null>(null);
  const [seriesStatus, setSeriesStatus] = useState<SeriesStatus>('idle');
  const [seriesAttempt, setSeriesAttempt] = useState(0);

  useEffect(() => {
    if (isFullProduct(target)) return;
    const controller = new AbortController();
    setDetailsFailed(false);
    getProductDetails(target, { signal: controller.signal })
      .then((full) => {
        if (!controller.signal.aborted) setProduct(full);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isAbortError(error)) setDetailsFailed(true);
      });
    return () => controller.abort();
  }, [detailsAttempt]);

  useEffect(() => {
    const controller = new AbortController();
    setStats(null);
    setStatsFailed(false);
    getPriceStats(product, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setStats(result);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isAbortError(error)) setStatsFailed(true);
      });
    return () => controller.abort();
  }, [statsAttempt]);

  useEffect(() => {
    if (!seriesRequested) return;
    const controller = new AbortController();
    setSeriesStatus('loading');
    getSupplementaryInfo(product, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setSeries(result);
        setSeriesStatus('ready');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted && !isAbortError(error)) setSeriesStatus('error');
      });
    return () => controller.abort();
  }, [seriesRequested, seriesAttempt]);

  return {
    product,
    detailsFailed,
    retryDetails: () => setDetailsAttempt(detailsAttempt + 1),
    stats,
    statsFailed,
    retryStats: () => setStatsAttempt(statsAttempt + 1),
    series,
    seriesStatus,
    requestSeries: () => setSeriesRequested(true),
    retrySeries: () => setSeriesAttempt(seriesAttempt + 1),
  };
}
