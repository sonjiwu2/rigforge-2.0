import { useEffect, useRef, useState } from 'react';
import { loadRates } from '../api/currency';
import { isAbortError } from '../api/vantaspec';
import type { CurrencyCode, Money } from '../types';

interface UseMoneyResult {
  money: Money;
  setCurrency: (code: CurrencyCode) => void;
  rateNote: string;
}

function formatRateDate(date: string): string {
  const [year, month, day] = date.split('-');
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

  useEffect(() => {
    const controller = new AbortController();
    setMoney((current) => ({ ...current, status: 'loading' }));

    loadRates({ signal: controller.signal })
      .then(({ rates, date }) => {
        setMoney((current) => ({ ...current, rates, date, status: 'ready' }));
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        setMoney((current) => ({ ...current, status: 'error' }));
        if (currencyRef.current !== 'GBP') {
          onError(error instanceof Error ? error.message : 'Не удалось загрузить курсы валют');
        }
      });

    return () => controller.abort();
  }, [loadAttempt]);

  function setCurrency(code: CurrencyCode) {
    currencyRef.current = code;
    setMoney((current) => ({ ...current, currency: code }));
    if (money.status === 'error') setLoadAttempt((attempt) => attempt + 1);
  }

  return { money, setCurrency, rateNote: getRateNote(money) };
}
