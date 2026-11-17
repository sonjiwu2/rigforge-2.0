import type { DetailsTarget } from '../../types';
import { BodyText, Muted } from './DetailsText';
import { isFullProduct } from './isFullProduct';

export function DescriptionText({ product }: { product: DetailsTarget }) {
  if (!isFullProduct(product)) return <Muted>Загрузка…</Muted>;
  if (!product.description) return <Muted>Описание модели не указано</Muted>;
  return <BodyText lang="en">{product.description}</BodyText>;
}
