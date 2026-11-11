import type { RatingSummary, RatingsMap, Review, ReviewsMap } from '../types';

export interface Problems {
  count: number;
}

interface ReviewInput {
  rating?: unknown;
  text?: unknown;
  author?: unknown;
}

export const REVIEW_TEXT_MAX = 1000;
export const REVIEW_AUTHOR_MAX = 40;
export const REVIEWS_PER_PRODUCT = 50;

function makeId(): string {
  return 'r-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function isRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function isProductId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]+:\S{1,120}$/i.test(value);
}

export function createReview({ rating, text = '', author = '' }: ReviewInput): Review {
  const value = typeof rating === 'string' ? Number(rating) : rating;
  if (!isRating(value)) {
    throw new Error('Выберите оценку от 1 до 5 звёзд');
  }
  if (typeof text !== 'string' || typeof author !== 'string') {
    throw new Error('Не удалось прочитать отзыв');
  }
  const cleanText = text.trim();
  const cleanAuthor = author.trim();
  if (cleanText.length > REVIEW_TEXT_MAX) {
    throw new Error(`Текст отзыва не длиннее ${REVIEW_TEXT_MAX} символов`);
  }
  if (cleanAuthor.length > REVIEW_AUTHOR_MAX) {
    throw new Error(`Имя не длиннее ${REVIEW_AUTHOR_MAX} символов`);
  }
  return {
    id: makeId(),
    rating: value,
    text: cleanText,
    author: cleanAuthor,
    createdAt: new Date().toISOString(),
  };
}

export function cleanReview(value: unknown): Review | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const { id, rating, text, author, createdAt } = value as Record<string, unknown>;
  if (typeof id !== 'string' || id.length < 1 || id.length > 60) return null;
  if (!isRating(rating)) return null;
  if (typeof text !== 'string' || text.length > REVIEW_TEXT_MAX) return null;
  if (typeof author !== 'string' || author.length > REVIEW_AUTHOR_MAX) return null;
  if (typeof createdAt !== 'string' || createdAt.length > 40 || Number.isNaN(Date.parse(createdAt))) return null;
  return { id, rating, text, author, createdAt };
}

function limitReviews(list: Review[]): Review[] {
  if (list.length <= REVIEWS_PER_PRODUCT) return list;
  return [...list]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, REVIEWS_PER_PRODUCT);
}

export function cleanReviewsMap(value: unknown, problems: Problems = { count: 0 }): ReviewsMap {
  const result: ReviewsMap = {};
  if (value === null || value === undefined) return result;
  if (typeof value !== 'object' || Array.isArray(value)) {
    problems.count++;
    return result;
  }
  for (const [productId, list] of Object.entries(value)) {
    if (!isProductId(productId) || !Array.isArray(list)) {
      problems.count++;
      continue;
    }
    const reviews: Review[] = [];
    const ids = new Set<string>();
    for (const item of list) {
      const review = cleanReview(item);
      if (!review || ids.has(review.id)) {
        problems.count++;
        continue;
      }
      ids.add(review.id);
      reviews.push(review);
    }
    if (reviews.length) result[productId] = limitReviews(reviews);
  }
  return result;
}

export function addReview(reviewsMap: ReviewsMap, productId: string, review: Review): ReviewsMap {
  const list = reviewsMap[productId] || [];
  return { ...reviewsMap, [productId]: limitReviews([review, ...list]) };
}

export function removeReview(reviewsMap: ReviewsMap, productId: string, reviewId: string): ReviewsMap {
  const list = (reviewsMap[productId] || []).filter((item) => item.id !== reviewId);
  const next = { ...reviewsMap };
  if (list.length) next[productId] = list;
  else delete next[productId];
  return next;
}

export function getRatingSummary(reviewsMap: ReviewsMap, productId: string): RatingSummary {
  const list = reviewsMap[productId];
  if (!Array.isArray(list) || !list.length) return { average: null, count: 0 };
  const sum = list.reduce((total, review) => total + review.rating, 0);
  return { average: Math.round((sum / list.length) * 10) / 10, count: list.length };
}

export function getRatingsMap(reviewsMap: ReviewsMap): RatingsMap {
  const result: RatingsMap = {};
  for (const productId of Object.keys(reviewsMap)) {
    const summary = getRatingSummary(reviewsMap, productId);
    if (summary.count > 0) result[productId] = summary;
  }
  return result;
}
