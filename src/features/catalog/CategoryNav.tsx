import type { ChangeEvent } from 'react';
import { Field, Select, VisuallyHidden } from '../../components/ui';
import { CATEGORIES } from '../../data/catalog';
import type { CategoryId } from '../../types';
import styles from './CategoryNav.module.css';

interface CategoryNavProps {
  category: CategoryId;
  onChange: (id: CategoryId) => void;
}

export function CategoryNav({ category, onChange }: CategoryNavProps) {
  function handleSelect(event: ChangeEvent<HTMLSelectElement>) {
    const found = CATEGORIES.find((item) => item.id === event.target.value);
    if (found) onChange(found.id);
  }

  return (
    <>
      <div className={styles.tabs} role="group" aria-label="Категория">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            className={styles.tab}
            type="button"
            aria-pressed={item.id === category}
            onClick={() => onChange(item.id)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <Field className={styles.select}>
        <VisuallyHidden htmlFor="catalog-category">Категория</VisuallyHidden>
        <Select id="catalog-category" name="category" value={category} onChange={handleSelect}>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
