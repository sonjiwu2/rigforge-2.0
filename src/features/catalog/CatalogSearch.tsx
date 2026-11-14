import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Icon, TextInput, VisuallyHidden } from '../../components/ui';
import styles from './CatalogSearch.module.css';

interface CatalogSearchProps {
  query: string;
  onSearch: (query: string) => void;
}

export function CatalogSearch({ query, onSearch }: CatalogSearchProps) {
  const [text, setText] = useState(query);

  useEffect(() => {
    setText((current) => (current.trim() === query ? current : query));
  }, [query]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(text.trim());
  }

  return (
    <form className={styles.search} role="search" noValidate onSubmit={handleSubmit}>
      <VisuallyHidden htmlFor="catalog-query">Поиск по названию или модели</VisuallyHidden>
      <div className={styles.field}>
        <Icon name="search" className={styles.fieldIcon} />
        <TextInput
          className={styles.input}
          id="catalog-query"
          name="query"
          type="search"
          placeholder="Название или модель"
          autoComplete="off"
          enterKeyHint="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <Button type="submit" variant="primary" className={styles.button}>
        <Icon name="search" className={styles.buttonIcon} />
        <span className={styles.buttonText}>Найти</span>
      </Button>
    </form>
  );
}
