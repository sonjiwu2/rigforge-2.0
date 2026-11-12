import manifest from '../data/assets-manifest.json';
import type { CategoryId, DetailsTarget } from '../types';

export interface ArtworkImage {
  src: string;
  width: number;
  height: number;
}

export interface ProductArtwork extends ArtworkImage {
  alt: string;
  gallery: ArtworkImage[];
  isPlaceholder: boolean;
  sourceKind: string | null;
  fallbackSrc: string;
  mpn: string | null;
  creator: string | null;
  rightsStatus: string | null;
  attribution: string | null;
  licenseUrl: string | null;
  licensePath: string | null;
  licenseFileUrl: string;
  sourceUrl: string | null;
}

interface ManifestAsset {
  provider: string;
  providerId: string;
  image: string;
  width: number;
  height: number;
  galleryDimensions?: { path: string; width: number; height: number }[];
  fallback?: string;
  sourceKind?: string;
  mpn?: string;
  creator?: string;
  rightsStatus?: string;
  attribution?: string;
  licenseUrl?: string;
  licensePath?: string;
  sourceUrl?: string;
}

export const PLACEHOLDER_ALT = 'Фотография модели отсутствует';

const productAssets = manifest.productAssets as ManifestAsset[];
const placeholders: Record<string, string> = manifest.placeholders;

const PLACEHOLDER_KEYS: Record<CategoryId, string> = {
  cpu: 'cpu',
  motherboard: 'motherboard',
  gpu: 'gpu',
  ram: 'ram',
  ssd: 'storage',
  hdd: 'storage',
  psu: 'psu',
  case: 'case',
  cooler: 'cooler',
};

function localUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}

function findAsset(product: DetailsTarget): ManifestAsset | null {
  if (!product.provider || !product.providerId) return null;
  return (
    productAssets.find(
      (asset) => asset.provider === product.provider && asset.providerId === product.providerId,
    ) || null
  );
}

export function getPlaceholderSrc(categoryId: CategoryId): string {
  const key = PLACEHOLDER_KEYS[categoryId];
  return key ? localUrl(placeholders[key]) : '';
}

function isVantaspecImage(url: string | null): url is string {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'cdn.vantaspec.com';
  } catch {
    return false;
  }
}

function productPageUrl(product: DetailsTarget): string {
  if ('sourceUrl' in product && product.sourceUrl) return product.sourceUrl;
  if (product.slug) return `https://vantaspec.com/products/${encodeURIComponent(product.slug)}`;
  return 'https://vantaspec.com';
}

function productTitle(product: DetailsTarget): string {
  const brand = product.manufacturer || '';
  const model = product.model || '';
  if (!model) return product.name || brand;
  if (brand && model.toLowerCase().startsWith(brand.toLowerCase())) return model;
  return `${brand} ${model}`.trim();
}

export function getProductArtwork(product: DetailsTarget): ProductArtwork {
  const asset = findAsset(product);

  if (asset) {
    return {
      src: localUrl(asset.image),
      alt: productTitle(product),
      width: asset.width,
      height: asset.height,
      gallery: (asset.galleryDimensions || []).map((item) => ({
        src: localUrl(item.path),
        width: item.width,
        height: item.height,
      })),
      isPlaceholder: false,
      sourceKind: asset.sourceKind || 'commons',
      fallbackSrc: localUrl(asset.fallback) || getPlaceholderSrc(product.category),
      mpn: asset.mpn || null,
      creator: asset.creator || null,
      rightsStatus: asset.rightsStatus || null,
      attribution: asset.attribution || null,
      licenseUrl: asset.licenseUrl || null,
      licensePath: asset.licensePath || null,
      licenseFileUrl: localUrl(asset.licensePath),
      sourceUrl: asset.sourceUrl || null,
    };
  }

  if (isVantaspecImage(product.imageUrl)) {
    return {
      src: product.imageUrl,
      alt: productTitle(product),
      width: 600,
      height: 400,
      gallery: [],
      isPlaceholder: false,
      sourceKind: 'vantaspec',
      fallbackSrc: getPlaceholderSrc(product.category),
      mpn: null,
      creator: null,
      rightsStatus: 'права у производителя',
      attribution: 'Фото: VantaSpec',
      licenseUrl: null,
      licensePath: null,
      licenseFileUrl: '',
      sourceUrl: productPageUrl(product),
    };
  }

  return {
    src: getPlaceholderSrc(product.category),
    alt: PLACEHOLDER_ALT,
    width: 128,
    height: 128,
    gallery: [],
    isPlaceholder: true,
    sourceKind: null,
    fallbackSrc: '',
    mpn: null,
    creator: null,
    rightsStatus: null,
    attribution: null,
    licenseUrl: null,
    licensePath: null,
    licenseFileUrl: '',
    sourceUrl: null,
  };
}
