import type { ChangeEvent } from 'react';
import { Button, Select, VisuallyHidden } from '../../components/ui';
import { joinClasses } from '../../components/ui/joinClasses';
import type { SortKey } from '../../types';
import styles from './CatalogToolbar.module.css';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'По популярности' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'rating', label: 'По оценке' },
];

interface CatalogToolbarProps {
  countText: string;
  activeFilters: number;
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  onOpenFilters: () => void;
  className?: string;
}

export function CatalogToolbar({ countText, activeFilters, sort, onSort, onOpenFilters, className }: CatalogToolbarProps) {
  function handleSort(event: ChangeEvent<HTMLSelectElement>) {
    const found = SORT_OPTIONS.find((option) => option.value === event.target.value);
    if (found) onSort(found.value);
  }

  return (
    <div className={joinClasses(styles.toolbar, className)}>
      <p className={styles.count} aria-live="polite">
        {countText}
      </p>
      <Button
        className={styles.filtersButton}
        variant="secondary"
        size="sm"
        icon="filter"
        aria-haspopup="dialog"
        onClick={onOpenFilters}
      >
        {activeFilters ? `Фильтры (${activeFilters})` : 'Фильтры'}
      </Button>
      <div className={styles.sort}>
        <VisuallyHidden htmlFor="catalog-sort">Сортировка</VisuallyHidden>
        <Select id="catalog-sort" name="sort" value={sort} onChange={handleSort}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
