import { Fragment } from 'react';
import { FieldError, fieldLabelClass, visuallyHiddenClass, VisuallyHidden } from '../../components/ui';
import { pluralRu } from '../../utils/format';
import type { RatingSummary } from '../../types';
import styles from './Stars.module.css';

const STAR_VALUES = [1, 2, 3, 4, 5];

export function formatRating(value: number): string {
  return value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

interface StarsProps {
  rating: number;
  label?: string;
  large?: boolean;
}

export function Stars({ rating, label, large = false }: StarsProps) {
  const percent = rating * 20;
  const classNames = [styles.stars];
  if (large) classNames.push(styles.large);

  return (
    <span
      className={classNames.join(' ')}
      style={{
        backgroundImage: `linear-gradient(90deg, var(--rf-star) ${percent}%, var(--rf-star-empty) ${percent}%)`,
      }}
      role="img"
      aria-label={label || `Оценка ${formatRating(rating)} из 5`}
    />
  );
}

export function RatingLine({ rating }: { rating: RatingSummary }) {
  if (!rating.count || rating.average === null) {
    return <p className={`${styles.rating} ${styles.ratingEmpty}`}>Нет отзывов</p>;
  }

  return (
    <p className={styles.rating}>
      <Stars rating={rating.average} />
      <span>
        {formatRating(rating.average)} · {rating.count} {pluralRu(rating.count, ['отзыв', 'отзыва', 'отзывов'])}
      </span>
    </p>
  );
}

interface StarsInputProps {
  name: string;
  value: number;
  error: string;
  onChange: (value: number) => void;
}

export function StarsInput({ name, value, error, onChange }: StarsInputProps) {
  const errorId = `${name}-error`;
  const classNames = [styles.input];
  if (error) classNames.push(styles.invalid);

  return (
    <fieldset className={classNames.join(' ')}>
      <legend className={fieldLabelClass}>Оценка</legend>
      <span className={styles.options}>
        {STAR_VALUES.map((star) => (
          <Fragment key={star}>
            <input
              className={visuallyHiddenClass}
              type="radio"
              name={name}
              id={`${name}-${star}`}
              value={star}
              checked={value === star}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? 'true' : undefined}
              onChange={() => onChange(star)}
            />
            <label htmlFor={`${name}-${star}`}>
              <span aria-hidden="true">★</span>
              <VisuallyHidden>{star} из 5</VisuallyHidden>
            </label>
          </Fragment>
        ))}
      </span>
      <FieldError className={styles.error} id={errorId} hidden={!error}>
        {error}
      </FieldError>
    </fieldset>
  );
}
