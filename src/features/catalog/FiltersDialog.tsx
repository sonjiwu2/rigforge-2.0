import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, FieldError, LinkButton, Panel } from '../../components/ui';
import { getCategory } from '../../data/catalog';
import type { CatalogFilters, CatalogState, Money } from '../../types';
import { FilterFields } from './FilterFields';
import { checkDraft, draftFromFilters, EMPTY_FILTERS, NO_FILTER_ERRORS, priceLegend } from './filterForm';
import styles from './FiltersDialog.module.css';

const DESKTOP_FILTERS = '(min-width: 1200px)';
const ID_PREFIX = 'dlg';
const ERROR_ID = 'dialog-price-error';

interface FiltersDialogProps {
  open: boolean;
  catalog: CatalogState;
  money: Money;
  applyFilters: (filters: CatalogFilters) => void;
  onClose: () => void;
}

function FiltersDialogForm({ catalog, money, applyFilters, onClose }: Omit<FiltersDialogProps, 'open'>) {
  const [draft, setDraft] = useState(() => draftFromFilters(catalog, money));
  const [check, setCheck] = useState(NO_FILTER_ERRORS);
  const category = getCategory(catalog.category);

  function apply() {
    const result = checkDraft(draft, catalog, money);
    setCheck(result);
    if (!result.values) {
      if (result.invalidMin) document.getElementById(`${ID_PREFIX}-price-min`)?.focus();
      else if (result.invalidMax) document.getElementById(`${ID_PREFIX}-price-max`)?.focus();
      return;
    }
    onClose();
    applyFilters(result.values);
  }

  function resetDraft() {
    setDraft(draftFromFilters(EMPTY_FILTERS, money));
    setCheck(NO_FILTER_ERRORS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply();
  }

  return (
    <form className={styles.inner} noValidate onSubmit={handleSubmit}>
      <header className={styles.head}>
        <h2 className={styles.title} id="filters-dialog-title">
          Фильтры
        </h2>
        <Button variant="icon" icon="close" aria-label="Закрыть фильтры" onClick={onClose} />
      </header>
      <div className={styles.body}>
        <Panel className={styles.panel}>
          <FilterFields
            idPrefix={ID_PREFIX}
            options={catalog.options}
            draft={draft}
            legend={priceLegend(money)}
            invalidMin={check.invalidMin}
            invalidMax={check.invalidMax}
            errorId={check.error ? ERROR_ID : undefined}
            onCheckboxChange={setDraft}
            onPriceChange={setDraft}
            onPriceEnter={apply}
          />
        </Panel>
        <FieldError className={styles.error} id={ERROR_ID} hidden={!check.error}>
          {check.error}
        </FieldError>
        <p className={styles.note}>{category ? `Выбрана категория: ${category.title.toLowerCase()}` : ''}</p>
        <LinkButton onClick={resetDraft}>Сбросить фильтры</LinkButton>
      </div>
      <footer className={styles.foot}>
        <Button variant="primary" block onClick={apply}>
          Показать результаты
        </Button>
      </footer>
    </form>
  );
}

export function FiltersDialog({ open, catalog, money, applyFilters, onClose }: FiltersDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(DESKTOP_FILTERS);
    function handleChange() {
      if (media.matches) onClose();
    }
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [open, onClose]);

  function handleNativeClose() {
    if (dialogRef.current && !dialogRef.current.open) onClose();
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="filters-dialog-title" onClose={handleNativeClose}>
      {open && <FiltersDialogForm catalog={catalog} money={money} applyFilters={applyFilters} onClose={onClose} />}
    </dialog>
  );
}
