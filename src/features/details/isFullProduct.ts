import type { DetailsTarget, Product } from '../../types';

export function isFullProduct(product: DetailsTarget): product is Product {
  return 'offers' in product && Array.isArray(product.offers);
}
