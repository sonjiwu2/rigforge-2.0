import { useRef, useState } from 'react';
import { PageHead, PageSub, PageTitle } from '../../components/layout';
import { Button, Field, FieldLabel, Icon, StateMessage, TextInput } from '../../components/ui';
import { countText, formatRateDate, getDisplayCurrency } from '../build/totals';
import { SavedCard } from './SavedCard';
import type { Build, Money } from '../../types';
import styles from './SavedView.module.css';

const SEARCH_FROM = 4;
const BUILD_FORMS = ['сборка', 'сборки', 'сборок'];

function normalize(text: string): string {
  return text.toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
}

export interface SavedViewProps {
  saved: Build[];
  money: Money;
  currentSavedId: string | null;
  storageWarning: string | null;
  onOpenSaved: (id: string) => void;
  onDownloadAll: () => void;
  onNewBuild: () => void;
  onGoToBuild: () => void;
}

export function SavedView({
  saved,
  money,
  currentSavedId,
  storageWarning,
  onOpenSaved,
  onDownloadAll,
  onNewBuild,
  onGoToBuild,
}: SavedViewProps) {
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const showSearch = saved.length >= SEARCH_FROM;
  if (!showSearch && query) setQuery('');

  const converted = saved.length > 0 && getDisplayCurrency(money) !== 'GBP';
  const rateDate = converted ? formatRateDate(money.date) : null;
  const normalizedQuery = normalize(query);
  const visible = normalizedQuery
    ? saved.filter((item) => normalize(item.name).includes(normalizedQuery))
    : saved;

  function clearSearch() {
    setQuery('');
    searchRef.current?.focus();
  }

  return (
    <div className={styles.page}>
      <PageHead className={styles.head}>
        <div className={styles.headText}>
          <PageTitle className={styles.title} tabIndex={-1}>
            Сохранённые сборки
          </PageTitle>
          <PageSub hidden={!saved.length}>{saved.length ? countText(saved.length, BUILD_FORMS) : ''}</PageSub>
          <p className={styles.rateNote} hidden={!converted}>
            {converted ? `Суммы пересчитаны по курсу ${rateDate ? 'на ' + rateDate : 'на сегодня'}` : ''}
          </p>
        </div>
        <Button
          className={styles.newBuild}
          variant="secondary"
          icon="plus"
          hidden={!saved.length}
          onClick={onNewBuild}
        >
          Новая сборка
        </Button>
      </PageHead>

      <div className={styles.warning} role="status" hidden={!storageWarning}>
        {storageWarning && (
          <>
            <Icon name="warning" />
            <span>{storageWarning}</span>
          </>
        )}
      </div>

      <Field className={styles.search} hidden={!showSearch}>
        <FieldLabel htmlFor="saved-search-input">Поиск по названию</FieldLabel>
        <div className={styles.searchBox}>
          <Icon name="search" />
          <TextInput
            ref={searchRef}
            className={styles.searchInput}
            id="saved-search-input"
            type="search"
            autoComplete="off"
            placeholder="Например, «Для работы»"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </Field>

      {!saved.length && (
        <StateMessage
          className={styles.empty}
          kind="empty"
          titleTag="h2"
          title="Пока нет сохранённых сборок"
          text="Сохраните первый вариант на вкладке «Сборка»."
          actionLabel="К сборке"
          onAction={onGoToBuild}
        />
      )}

      {saved.length > 0 && !visible.length && (
        <StateMessage
          className={styles.empty}
          kind="empty"
          titleTag="h2"
          title="Ничего не найдено"
          text="Нет сборок с таким названием."
          actionLabel="Очистить поиск"
          onAction={clearSearch}
        />
      )}

      {visible.length > 0 && (
        <ul className={styles.grid} role="list">
          {visible.map((build) => (
            <li key={build.id}>
              <SavedCard
                build={build}
                money={money}
                isCurrent={currentSavedId === build.id}
                onOpen={() => onOpenSaved(build.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <aside className={styles.note} aria-label="Где хранятся сборки">
        <div className={styles.noteText}>
          <p className={styles.noteTitle}>Сборки хранятся в этом браузере</p>
          <p>Скачайте список, чтобы сохранить копию.</p>
        </div>
        <Button
          className={styles.downloadAll}
          variant="secondary"
          icon="download"
          hidden={!saved.length}
          onClick={onDownloadAll}
        >
          Скачать все (JSON)
        </Button>
      </aside>
    </div>
  );
}
