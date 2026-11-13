import { useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { CURRENCIES } from '../../api/currency';
import { Button, Icon } from '../../components/ui';
import { convertToGbp, formatMoney, parseMoneyInput } from '../../utils/format';
import {
  budgetInCurrency,
  calculateBuildTotals,
  countText,
  getBudgetInfo,
  getDisplayCurrency,
  priceText,
  rateNote,
} from './totals';
import type { Build, Money, TypedBudget } from '../../types';
import styles from './BudgetPanel.module.css';

const DETAIL_FORMS = ['деталь', 'детали', 'деталей'];
const DETAIL_FORMS_GENITIVE = ['детали', 'деталей', 'деталей'];

interface BudgetPanelProps {
  build: Build;
  money: Money;
  onBudgetChange: (budgetMinor: number | null) => void;
  onSave: () => void;
  onDownload: () => void;
}

export function BudgetPanel({ build, money, onBudgetChange, onSave, onDownload }: BudgetPanelProps) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const [typed, setTyped] = useState<TypedBudget | null>(null);
  const editedRef = useRef(false);

  const totals = calculateBuildTotals(build);
  const budget = getBudgetInfo(build, totals, money, typed);
  const currency = getDisplayCurrency(money);
  const note = totals.count && !totals.mixedCurrencies ? rateNote(money) : '';
  const showProgress = budget.kind === 'left' || budget.kind === 'over';
  const progress = budget.kind === 'left' || budget.kind === 'over' ? budget.percent : 0;

  function budgetText(typedBudget: TypedBudget | null): string {
    if (build.budgetMinor === null) return '';
    const shown = budgetInCurrency(build.budgetMinor, money, typedBudget);
    return formatMoney(shown.minor, shown.currency);
  }

  function commit() {
    editedRef.current = false;
    const text = draft.trim();
    if (text === '') {
      setError('');
      if (build.budgetMinor !== null) onBudgetChange(null);
      return;
    }
    const value = parseMoneyInput(text);
    const valueGbp = value === null ? null : convertToGbp(value, money);
    if (value === null || value <= 0 || valueGbp === null || valueGbp <= 0) {
      setError('Введите сумму больше нуля');
      return;
    }
    setError('');
    const nextTyped = { minor: value, currency };
    setTyped(nextTyped);
    if (valueGbp !== build.budgetMinor) onBudgetChange(valueGbp);
    else setDraft(budgetText(nextTyped));
  }

  function handleFocus() {
    if (!error) setDraft(budgetText(typed));
    setFocused(true);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    editedRef.current = true;
    setDraft(event.target.value);
  }

  function handleBlur() {
    setFocused(false);
    if (editedRef.current) commit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (editedRef.current) commit();
    }
  }

  return (
    <section className={styles.summary} aria-labelledby="build-summary-title">
      <h2 className={styles.title} id="build-summary-title">
        Стоимость
      </h2>
      <p className={styles.count}>
        {totals.count ? `Выбрано ${countText(totals.count, DETAIL_FORMS)}` : 'Детали пока не выбраны'}
      </p>
      <div className={styles.total}>
        {totals.mixedCurrencies ? (
          <>
            <p className={styles.totalLabel}>Стоимость известных позиций</p>
            <p className={styles.totalMixed}>Цены в разных валютах — общую сумму не считаем</p>
          </>
        ) : (
          <>
            {totals.unknownCount > 0 && <p className={styles.totalLabel}>Стоимость известных позиций</p>}
            <p className={styles.totalValue}>{priceText(totals.knownTotalMinor, totals.currency, money)}</p>
            {totals.unknownCount > 0 && (
              <p className={styles.totalMissing}>
                Для {countText(totals.unknownCount, DETAIL_FORMS_GENITIVE)} цена не указана
              </p>
            )}
          </>
        )}
      </div>
      <p className={styles.rateNote} hidden={!note}>
        {note}
      </p>
      <div className={styles.budget}>
        <div className={styles.budgetRow}>
          <label className={styles.budgetLabel} htmlFor="build-budget-input">
            Бюджет, {CURRENCIES[currency].symbol}
          </label>
          <input
            className={styles.budgetInput}
            id="build-budget-input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Не задан"
            aria-describedby="build-budget-error build-budget-status"
            aria-invalid={error ? 'true' : undefined}
            value={focused || error ? draft : budgetText(typed)}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        </div>
        <p className={styles.budgetError} id="build-budget-error" hidden={!error}>
          {error}
        </p>
        <div
          className={`${styles.progress} ${budget.kind === 'over' ? styles.progressOver : ''}`}
          aria-hidden="true"
          hidden={!showProgress}
        >
          <span className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>
        <div id="build-budget-status">
          {budget.kind === 'none' && <p className={styles.budgetHint}>Укажите бюджет</p>}
          {budget.kind === 'incomplete' && (
            <p className={styles.budgetHint}>Остаток появится, когда у всех деталей будет цена</p>
          )}
          {budget.kind === 'left' && (
            <p className={styles.budgetLeft}>Остаётся {formatMoney(budget.diff, budget.currency)}</p>
          )}
          {budget.kind === 'over' && (
            <p className={styles.budgetOver}>
              <Icon name="warning" />
              <span>Бюджет превышен на {formatMoney(budget.diff, budget.currency)}</span>
            </p>
          )}
        </div>
      </div>
      <Button className={styles.save} variant="light" block onClick={onSave}>
        Сохранить сборку
      </Button>
      <button className={styles.download} type="button" onClick={onDownload}>
        <Icon name="download" />
        <span>Скачать список</span>
      </button>
    </section>
  );
}
