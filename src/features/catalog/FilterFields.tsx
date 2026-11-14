import type { KeyboardEvent } from 'react';
import { Checkbox, Field, FieldLabel, TextInput } from '../../components/ui';
import type { FilterOptions } from '../../types';
import type { FilterDraft } from './filterForm';
import styles from './FilterFields.module.css';

interface FilterFieldsProps {
  idPrefix: string;
  options: FilterOptions | null;
  draft: FilterDraft;
  legend: string;
  invalidMin: boolean;
  invalidMax: boolean;
  errorId?: string;
  onCheckboxChange: (draft: FilterDraft) => void;
  onPriceChange: (draft: FilterDraft) => void;
  onPriceEnter: () => void;
  onPriceBlur?: () => void;
}

export function FilterFields({
  idPrefix,
  options,
  draft,
  legend,
  invalidMin,
  invalidMax,
  errorId,
  onCheckboxChange,
  onPriceChange,
  onPriceEnter,
  onPriceBlur,
}: FilterFieldsProps) {
  const brands = options ? options.brands : [];
  const specs = options ? options.specs : {};
  const specKeys = Object.keys(specs)
    .filter((key) => specs[key].values.length > 0)
    .slice(0, 2);

  function toggleBrand(value: string, checked: boolean) {
    const next = brands.filter((brand) => (brand === value ? checked : draft.brands.includes(brand)));
    onCheckboxChange({ ...draft, brands: next });
  }

  function toggleSpec(key: string, value: string, checked: boolean) {
    const selected = draft.specs[key] || [];
    const next = specs[key].values.filter((item) => (item === value ? checked : selected.includes(item)));
    const nextSpecs = { ...draft.specs };
    if (next.length) nextSpecs[key] = next;
    else delete nextSpecs[key];
    onCheckboxChange({ ...draft, specs: nextSpecs });
  }

  function handlePriceKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onPriceEnter();
    }
  }

  return (
    <div className={styles.fields}>
      {brands.length > 0 && (
        <fieldset className={styles.group}>
          <legend className={styles.legend}>Производитель</legend>
          {brands.map((brand, index) => (
            <Checkbox
              key={brand}
              className={styles.checkbox}
              id={`${idPrefix}-brand-${index}`}
              value={brand}
              checked={draft.brands.includes(brand)}
              onChange={(event) => toggleBrand(brand, event.target.checked)}
            >
              <span>{brand}</span>
            </Checkbox>
          ))}
        </fieldset>
      )}
      {specKeys.map((key) => (
        <fieldset key={key} className={styles.group}>
          <legend className={styles.legend}>{specs[key].label || key}</legend>
          {specs[key].values.map((value, index) => (
            <Checkbox
              key={value}
              className={styles.checkbox}
              id={`${idPrefix}-spec-${key.replace(/\W+/g, '')}-${index}`}
              value={value}
              checked={(draft.specs[key] || []).includes(value)}
              onChange={(event) => toggleSpec(key, value, event.target.checked)}
            >
              <span>{value}</span>
            </Checkbox>
          ))}
        </fieldset>
      ))}
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{legend}</legend>
        <div className={styles.priceRow}>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-price-min`}>Цена от</FieldLabel>
            <TextInput
              id={`${idPrefix}-price-min`}
              inputMode="decimal"
              autoComplete="off"
              value={draft.minText}
              aria-invalid={invalidMin ? 'true' : undefined}
              aria-describedby={errorId}
              onChange={(event) => onPriceChange({ ...draft, minText: event.target.value })}
              onKeyDown={handlePriceKeyDown}
              onBlur={onPriceBlur}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-price-max`}>Цена до</FieldLabel>
            <TextInput
              id={`${idPrefix}-price-max`}
              inputMode="decimal"
              autoComplete="off"
              value={draft.maxText}
              aria-invalid={invalidMax ? 'true' : undefined}
              aria-describedby={errorId}
              onChange={(event) => onPriceChange({ ...draft, maxText: event.target.value })}
              onKeyDown={handlePriceKeyDown}
              onBlur={onPriceBlur}
            />
          </Field>
        </div>
      </fieldset>
    </div>
  );
}
