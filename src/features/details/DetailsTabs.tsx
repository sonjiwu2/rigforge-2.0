import { useRef } from 'react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import styles from './DetailsTabs.module.css';

export type DetailsTabId = 'specs' | 'desc' | 'reviews';

const TABS: { id: DetailsTabId; label: string }[] = [
  { id: 'specs', label: 'Характеристики' },
  { id: 'desc', label: 'Описание' },
  { id: 'reviews', label: 'Отзывы' },
];

interface DetailsTabsProps {
  active: DetailsTabId;
  reviewsCount: number;
  onSelect: (id: DetailsTabId) => void;
}

export function DetailsTabs({ active, reviewsCount, onSelect }: DetailsTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    onSelect(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className={styles.tabs} role="tablist" aria-label="Сведения о детали">
      {TABS.map((item, index) => (
        <button
          key={item.id}
          ref={(node) => {
            tabRefs.current[index] = node;
          }}
          type="button"
          role="tab"
          className={styles.tab}
          id={`details-tab-${item.id}`}
          aria-controls={`details-panel-${item.id}`}
          aria-selected={active === item.id}
          tabIndex={active === item.id ? 0 : -1}
          onClick={() => onSelect(item.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          {item.label}
          {item.id === 'reviews' && reviewsCount > 0 && <span className={styles.count}> ({reviewsCount})</span>}
        </button>
      ))}
    </div>
  );
}

interface DetailsPanelProps {
  id: DetailsTabId;
  active: DetailsTabId;
  panelRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function DetailsPanel({ id, active, panelRef, children }: DetailsPanelProps) {
  return (
    <div
      ref={panelRef}
      className={styles.panel}
      role="tabpanel"
      id={`details-panel-${id}`}
      aria-labelledby={`details-tab-${id}`}
      tabIndex={0}
      hidden={active !== id}
    >
      {children}
    </div>
  );
}
