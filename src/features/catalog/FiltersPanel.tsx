import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { FieldError, LinkButton, panelClass } from '../../components/ui';
import { joinClasses } from '../../components/ui/joinClasses';
import type { CatalogFilters, CatalogState, Money } from '../../types';
import { FilterFields } from './FilterFields';
import {
  checkDraft,
  countActiveFilters,
  draftFromFilters,
  NO_FILTER_ERRORS,
  priceLegend,
  sameFilters,
  shownCurrency,
} from './filterForm';
import type { FilterDraft } from './filterForm';
import styles from './FiltersPanel.module.css';

const ID_PREFIX = 'side';
const MIN_INPUT_ID = `${ID_PREFIX}-price-min`;
const MAX_INPUT_ID = `${ID_PREFIX}-price-max`;
const ERROR_ID = 'sidebar-price-error';

interface FiltersPanelProps {
  catalog: CatalogState;
  money: Money;
  applyFilters: (filters: CatalogFilters) => void;
  resetFilters: () => void;
  className?: string;
}

export function FiltersPanel({ catalog, money, applyFilters, resetFilters, className }: FiltersPanelProps) {
  const [draft, setDraft] = useState(() => draftFromFilters(catalog, money));
  const [check, setCheck] = useState(NO_FILTER_ERRORS);
  const currency = shownCurrency(money);
  const rate = money.rates ? money.rates[currency] : 1;
  const lastCurrencyRef = useRef(currency);

  useEffect(() => {
    const currencyChanged = lastCurrencyRef.current !== currency;
    lastCurrencyRef.current = currency;
    const activeId = document.activeElement ? document.activeElement.id : '';
    const next = draftFromFilters(catalog, money);
    setDraft((current) => ({
      ...next,
      minText: activeId === MIN_INPUT_ID && !currencyChanged ? current.minText : next.minText,
      maxText: activeId === MAX_INPUT_ID && !currencyChanged ? current.maxText : next.maxText,
    }));
    setCheck(NO_FILTER_ERRORS);
  }, [catalog, currency, rate]);

  function apply(nextDraft: FilterDraft, onlyIfChanged: boolean) {
    const result = checkDraft(nextDraft, catalog, money);
    setCheck(result);
    if (!result.values) return;
    if (onlyIfChanged && sameFilters(result.values, catalog)) return;
    applyFilters(result.values);
  }

  function handleCheckboxChange(nextDraft: FilterDraft) {
    setDraft(nextDraft);
    apply(nextDraft, false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply(draft, false);
  }

  return (
    <aside className={joinClasses(panelClass, styles.sidebar, className)} aria-labelledby="catalog-sidebar-title">
      <h2 className={styles.title} id="catalog-sidebar-title">
        Фильтры
      </h2>
      <form noValidate onSubmit={handleSubmit}>
        <FilterFields
          idPrefix={ID_PREFIX}
          options={catalog.options}
          draft={draft}
          legend={priceLegend(money)}
          invalidMin={check.invalidMin}
          invalidMax={check.invalidMax}
          errorId={check.error ? ERROR_ID : undefined}
          onCheckboxChange={handleCheckboxChange}
          onPriceChange={setDraft}
          onPriceEnter={() => apply(draft, true)}
          onPriceBlur={() => apply(draft, true)}
        />
        <FieldError className={styles.error} id={ERROR_ID} hidden={!check.error}>
          {check.error}
        </FieldError>
        <LinkButton className={styles.reset} hidden={countActiveFilters(catalog) === 0} onClick={resetFilters}>
          Сбросить фильтры
        </LinkButton>
      </form>
    </aside>
  );
}
