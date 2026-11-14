import { useEffect, useRef, useState } from 'react';
import type { FormEvent, RefObject } from 'react';
import { Button, Field, FieldLabel, TextArea, TextInput, VisuallyHidden } from '../../components/ui';
import { formatRating, Stars, StarsInput } from '../catalog/Stars';
import { pluralRu } from '../../utils/format';
import type { NewReview, RatingSummary, Review } from '../../types';
import { Muted, Subtitle } from './DetailsText';
import styles from './ReviewsBlock.module.css';

const REVIEW_TEXT_MAX = 1000;
const REVIEW_AUTHOR_MAX = 40;
const RATING_NAME = 'details-rating';

interface ReviewsBlockProps {
  productId: string;
  reviews: Review[];
  rating: RatingSummary;
  panelRef: RefObject<HTMLDivElement | null>;
  onAddReview: (productId: string, review: NewReview) => boolean;
  onDeleteReview: (productId: string, reviewId: string) => void;
}

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function ReviewsBlock({ productId, reviews, rating, panelRef, onAddReview, onDeleteReview }: ReviewsBlockProps) {
  const [stars, setStars] = useState(0);
  const [starsError, setStarsError] = useState('');
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('');
  const listRef = useRef<HTMLUListElement>(null);
  const focusIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const index = focusIndexRef.current;
    if (index === null) return;
    focusIndexRef.current = null;
    const buttons = listRef.current ? listRef.current.querySelectorAll('button') : [];
    const next = buttons[Math.min(index, buttons.length - 1)];
    if (next) next.focus();
    else if (panelRef.current) panelRef.current.focus();
  }, [reviews, panelRef]);

  function handleStarsChange(value: number) {
    setStars(value);
    setStarsError('');
    setStatus('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('');
    if (!stars) {
      setStarsError('Выберите оценку от 1 до 5 звёзд');
      document.getElementById(`${RATING_NAME}-1`)?.focus();
      return;
    }
    const saved = onAddReview(productId, {
      rating: stars,
      text: text.trim().slice(0, REVIEW_TEXT_MAX),
      author: author.trim().slice(0, REVIEW_AUTHOR_MAX),
    });
    if (saved === false) {
      setStatus('Не удалось сохранить отзыв');
      return;
    }
    setStars(0);
    setStarsError('');
    setText('');
    setAuthor('');
    setStatus('Отзыв добавлен');
  }

  function handleDelete(reviewId: string, index: number) {
    focusIndexRef.current = index;
    onDeleteReview(productId, reviewId);
    setStatus('Отзыв удалён');
  }

  return (
    <>
      <div className={styles.summary}>
        {rating.count > 0 && rating.average !== null ? (
          <>
            <Stars rating={rating.average} large />
            <span className={styles.average}>{formatRating(rating.average)} из 5</span>
            <Muted className={styles.summaryMuted}>
              {rating.count} {pluralRu(rating.count, ['отзыв', 'отзыва', 'отзывов'])}
            </Muted>
          </>
        ) : (
          <Muted className={styles.summaryMuted}>Отзывов пока нет. Ваш будет первым.</Muted>
        )}
      </div>
      <ul ref={listRef} className={styles.list} aria-label="Отзывы" hidden={reviews.length === 0}>
        {reviews.map((review, index) => {
          const name = review.author || 'Без имени';
          const date = formatReviewDate(review.createdAt);
          return (
            <li key={review.id} className={styles.review}>
              <div className={styles.head}>
                <p className={styles.author}>{name}</p>
                <Stars rating={review.rating} label={`Оценка ${review.rating} из 5`} />
                {date && (
                  <time className={styles.date} dateTime={review.createdAt}>
                    {date}
                  </time>
                )}
              </div>
              {review.text && <p className={styles.text}>{review.text}</p>}
              <Button
                className={styles.delete}
                variant="secondary"
                size="sm"
                onClick={() => handleDelete(review.id, index)}
              >
                <span>Удалить</span>
                <VisuallyHidden> отзыв: {name}{date ? `, ${date}` : ''}</VisuallyHidden>
              </Button>
            </li>
          );
        })}
      </ul>
      <form className={styles.form} noValidate aria-labelledby="details-review-form-title" onSubmit={handleSubmit}>
        <Subtitle className={styles.formTitle} id="details-review-form-title">
          Оставить отзыв
        </Subtitle>
        <StarsInput name={RATING_NAME} value={stars} error={starsError} onChange={handleStarsChange} />
        <Field>
          <FieldLabel htmlFor="details-review-text">Текст отзыва</FieldLabel>
          <TextArea
            id="details-review-text"
            rows={4}
            maxLength={REVIEW_TEXT_MAX}
            aria-describedby="details-review-counter"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <p className={styles.counter} id="details-review-counter">
            {text.length} / {REVIEW_TEXT_MAX}
          </p>
        </Field>
        <Field>
          <FieldLabel htmlFor="details-review-author">Имя (необязательно)</FieldLabel>
          <TextInput
            id="details-review-author"
            maxLength={REVIEW_AUTHOR_MAX}
            autoComplete="nickname"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
          />
        </Field>
        <Button className={styles.submit} type="submit" variant="primary">
          Отправить отзыв
        </Button>
        <p className={styles.status} role="status">
          {status}
        </p>
      </form>
      <Muted className={styles.local}>Отзывы хранятся в этом браузере</Muted>
    </>
  );
}
