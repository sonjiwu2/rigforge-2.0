import type { ChangeEvent } from 'react';
import { VisuallyHidden } from '../ui/VisuallyHidden';
import type { CurrencyCode, View } from '../../types';
import styles from './Header.module.css';

export interface HeaderProps {
  view: View;
  currency: CurrencyCode;
  rateNote: string;
  onCurrencyChange: (code: CurrencyCode) => void;
}

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: 'build', label: 'Сборка' },
  { view: 'catalog', label: 'Каталог' },
  { view: 'saved', label: 'Сохранённые' },
];

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'GBP', label: 'GBP £' },
  { code: 'USD', label: 'USD $' },
  { code: 'RUB', label: 'RUB ₽' },
];

export function Header({ view, currency, rateNote, onCurrencyChange }: HeaderProps) {
  function handleCurrencyChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = CURRENCIES.find((item) => item.code === event.target.value);
    if (selected) onCurrencyChange(selected.code);
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.logo} href="#build">
          RigForge
        </a>
        <nav className={styles.nav} aria-label="Разделы">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.view}
              className={styles.navLink}
              href={`#${item.view}`}
              aria-current={item.view === view ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.currencyBox}>
          <span className={styles.rateNote}>{rateNote}</span>
          <VisuallyHidden htmlFor="currency-select">Валюта</VisuallyHidden>
          <select
            id="currency-select"
            className={styles.currencySelect}
            value={currency}
            onChange={handleCurrencyChange}
          >
            {CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
