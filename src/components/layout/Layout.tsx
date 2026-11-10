import { useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import type { HeaderProps } from './Header';
import '../../styles/base.css';
import styles from './Layout.module.css';

interface LayoutProps extends HeaderProps {
  children: ReactNode;
}

export function Layout({ view, currency, rateNote, onCurrencyChange, children }: LayoutProps) {
  const mainRef = useRef<HTMLElement>(null);

  function handleSkipClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    mainRef.current?.focus();
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main" onClick={handleSkipClick}>
        Перейти к содержимому
      </a>
      <Header view={view} currency={currency} rateNote={rateNote} onCurrencyChange={onCurrencyChange} />
      <main ref={mainRef} id="main" className={styles.main} tabIndex={-1}>
        <div className={styles.page}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}
