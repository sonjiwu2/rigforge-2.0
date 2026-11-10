import { useCallback, useEffect, useRef, useState } from 'react';
import { loadRates } from '../api/currency';
import { isAbortError } from '../api/vantaspec';
import type { CurrencyCode, Money } from '../types';

export interface UseMoneyResult {
  money: Money;
  setCurrency: (code: CurrencyCode) => void;
  rateNote: string;
}

function formatRateDate(date: string): string {
  const [year, month, day] = String(date).split('-');
  return day && month ? `${day}.${month}.${year}` : date;
}

function getRateNote(money: Money): string {
  if (money.currency === 'GBP') return '';
  if (money.status === 'loading') return 'Загрузка курса…';
  if (money.status === 'error') return 'Курс недоступен';
  if (money.date) return 'Курс на ' + formatRateDate(money.date);
  return '';
}

export function useMoney(
  initialCurrency: CurrencyCode,
  onError: (message: string) => void,
): UseMoneyResult {
  const [money, setMoney] = useState<Money>({
    currency: initialCurrency,
    rates: null,
    date: null,
    status: 'idle',
  });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const currencyRef = useRef(initialCurrency);
  const onErrorRef = useRef(onError);
  const statusRef = useRef(money.status);

  useEffect(() => {
    onErrorRef.current = onError;
    statusRef.current = money.status;
  });

  useEffect(() => {
    const controller = new AbortController();
    setMoney((current) => ({ ...current, status: 'loading' }));

    loadRates({ signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setMoney((current) => ({
          ...current,
          rates: result.rates,
          date: result.date,
          status: 'ready',
        }));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setMoney((current) => ({ ...current, status: 'error' }));
        if (currencyRef.current !== 'GBP') {
          const message = error instanceof Error ? error.message : '';
          onErrorRef.current(message || 'Не удалось загрузить курсы валют');
        }
      });

    return () => controller.abort();
  }, [loadAttempt]);

  const setCurrency = useCallback((code: CurrencyCode) => {
    currencyRef.current = code;
    const failed = statusRef.current === 'error';
    if (failed) statusRef.current = 'idle';
    setMoney((current) => ({ ...current, currency: code, status: failed ? 'idle' : current.status }));
    if (failed) setLoadAttempt((attempt) => attempt + 1);
  }, []);

  return { money, setCurrency, rateNote: getRateNote(money) };
}
