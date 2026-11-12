import styles from './CatalogToolbar.module.css';

interface CatalogToolbarProps {
  countText: string;
}

export function CatalogToolbar({ countText }: CatalogToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <p className={styles.count} aria-live="polite">
        {countText}
      </p>
    </div>
  );
}
