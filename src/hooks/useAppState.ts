import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createBuildCopy,
  getAddedText,
  getAddLabel,
  getNextBuildName,
  getProductAction,
  insertBuild,
  isBuildDirty,
  isProductInBuild,
  refreshSnapshots,
  saveToList,
  setBuildSlot,
  toOpenedBuild,
  touchBuild,
} from '../core/builds';
import { toSnapshot } from '../core/products';
import { addReview, createReview, getRatingSummary, getRatingsMap, removeReview } from '../core/reviews';
import { createEmptyBuild, loadAppState, persistAppState, WARNING_UNAVAILABLE } from '../core/storage';
import { downloadAllBuilds, downloadBuild } from '../features/build/export';
import { useMoney } from './useMoney';
import type {
  Build,
  CategoryId,
  ConfirmRequest,
  CurrencyCode,
  DetailsTarget,
  Money,
  NewReview,
  Product,
  ProductAction,
  ProductSnapshot,
  RatingSummary,
  RatingsMap,
  Review,
  ReviewsMap,
  ToastMessage,
} from '../types';

interface AppData {
  build: Build;
  saved: Build[];
  reviews: ReviewsMap;
}

interface RemovedSlot {
  buildId: string;
  slotId: CategoryId;
  snapshot: ProductSnapshot;
}

interface AnnounceOptions {
  actionLabel?: string;
  onAction?: () => void;
}

export interface UseAppStateResult {
  build: Build;
  saved: Build[];
  reviews: ReviewsMap;
  ratings: RatingsMap;
  currentSavedId: string | null;
  storageWarning: string | null;
  money: Money;
  rateNote: string;
  setCurrency: (code: CurrencyCode) => void;
  isDirty: () => boolean;
  nextBuildName: () => string;
  addProduct: (product: DetailsTarget) => void;
  removeSlot: (slotId: CategoryId) => void;
  renameBuild: (name: string) => void;
  setBudget: (budgetMinor: number | null) => void;
  startNewBuild: () => Promise<void>;
  saveCurrentBuild: () => void;
  openSaved: (id: string) => Promise<void>;
  renameSaved: (id: string, name: string) => void;
  duplicateSaved: (id: string) => void;
  deleteSaved: (id: string) => void;
  downloadCurrent: () => void;
  downloadSaved: (id: string) => void;
  downloadAll: () => void;
  goToBuild: () => void;
  getAction: (product: DetailsTarget) => ProductAction;
  getAddLabel: (product: DetailsTarget) => string;
  isInBuild: (product: DetailsTarget) => boolean;
  getRating: (productId: string) => RatingSummary;
  getReviews: (productId: string) => Review[];
  onAddReview: (productId: string, data: NewReview) => boolean;
  onDeleteReview: (productId: string, reviewId: string) => void;
  refreshSnapshots: (items: Product[]) => void;
  toast: ToastMessage | null;
  announce: (text: string, options?: AnnounceOptions) => void;
  closeToast: () => void;
  confirmRequest: ConfirmRequest | null;
  onConfirmResult: (ok: boolean) => void;
}

function goToBuild(): void {
  window.location.hash = '#build';
}

function useToast(initialText: string | null) {
  const [toast, setToast] = useState<ToastMessage | null>(initialText ? { id: 1, text: initialText } : null);
  const idRef = useRef(1);

  function announce(text: string, options: AnnounceOptions = {}): void {
    idRef.current += 1;
    setToast({ id: idRef.current, text, actionLabel: options.actionLabel, onAction: options.onAction });
  }

  return { toast, announce, closeToast: () => setToast(null) };
}

function useConfirm() {
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  function askConfirm(title: string, text: string, okLabel: string): Promise<boolean> {
    resolveRef.current?.(false);
    setConfirmRequest({ title, text, okLabel });
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }

  function onConfirmResult(ok: boolean): void {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setConfirmRequest(null);
    resolve?.(ok);
  }

  return { confirmRequest, askConfirm, onConfirmResult };
}

export function useAppState(): UseAppStateResult {
  const [stored] = useState(loadAppState);
  const [data, setData] = useState<AppData>({ build: stored.build, saved: stored.saved, reviews: stored.reviews });
  const [storageWarning, setStorageWarning] = useState(stored.warning);
  const { toast, announce, closeToast } = useToast(stored.warning);
  const { confirmRequest, askConfirm, onConfirmResult } = useConfirm();
  const { money, setCurrency: changeCurrency, rateNote } = useMoney(stored.settings.currency, announce);

  const dataRef = useRef(data);
  const currencyRef = useRef(stored.settings.currency);
  const moneyRef = useRef(money);
  const lastRemovedRef = useRef<RemovedSlot | null>(null);

  useEffect(() => {
    moneyRef.current = money;
  }, [money]);

  function save(): boolean {
    const { build, saved, reviews } = dataRef.current;
    const ok = persistAppState({ build, saved, reviews, settings: { currency: currencyRef.current } });
    if (!ok) setStorageWarning((current) => current ?? WARNING_UNAVAILABLE);
    return ok;
  }

  function commit(changes: Partial<AppData>): boolean {
    dataRef.current = { ...dataRef.current, ...changes };
    const ok = save();
    setData(dataRef.current);
    return ok;
  }

  function setCurrency(code: CurrencyCode): void {
    currencyRef.current = code;
    changeCurrency(code);
    save();
  }

  function isDirty(): boolean {
    return isBuildDirty(dataRef.current.build, dataRef.current.saved);
  }

  function nextBuildName(): string {
    return getNextBuildName(dataRef.current.build, dataRef.current.saved);
  }

  function addProduct(product: DetailsTarget): void {
    const { build } = dataRef.current;
    if (isProductInBuild(build, product)) return;
    const replaced = Boolean(build.slots[product.category]);
    commit({ build: setBuildSlot(build, product.category, toSnapshot(product)) });
    announce(getAddedText(product, replaced), { actionLabel: 'К сборке', onAction: goToBuild });
  }

  function undoRemove(): void {
    const removed = lastRemovedRef.current;
    const { build } = dataRef.current;
    if (!removed || removed.buildId !== build.id) return;
    if (build.slots[removed.slotId]) return;
    lastRemovedRef.current = null;
    commit({ build: setBuildSlot(build, removed.slotId, removed.snapshot) });
  }

  function removeSlot(slotId: CategoryId): void {
    const { build } = dataRef.current;
    const snapshot = build.slots[slotId];
    if (!snapshot) return;
    lastRemovedRef.current = { buildId: build.id, slotId, snapshot };
    commit({ build: setBuildSlot(build, slotId, null) });
    announce('Убрано из сборки: ' + snapshot.name, { actionLabel: 'Отменить', onAction: undoRemove });
  }

  function renameBuild(name: string): void {
    commit({ build: touchBuild({ ...dataRef.current.build, name }) });
  }

  function setBudget(budgetMinor: number | null): void {
    commit({ build: touchBuild({ ...dataRef.current.build, budgetMinor }) });
  }

  async function startNewBuild(): Promise<void> {
    if (isDirty()) {
      const ok = await askConfirm('Создать новую сборку?', 'Текущие изменения не сохранены.', 'Создать');
      if (!ok) return;
    }
    commit({ build: touchBuild(createEmptyBuild(nextBuildName())) });
    goToBuild();
    announce('Создана новая сборка');
  }

  function downloadCurrent(): void {
    downloadBuild(dataRef.current.build, moneyRef.current);
  }

  function saveCurrentBuild(): void {
    const { build, saved } = dataRef.current;
    if (commit({ saved: saveToList(saved, build) })) {
      announce('Сборка сохранена');
    } else {
      announce('Не удалось сохранить сборку. Скачайте список, чтобы не потерять его', {
        actionLabel: 'Скачать',
        onAction: downloadCurrent,
      });
    }
  }

  async function openSaved(id: string): Promise<void> {
    const { build, saved } = dataRef.current;
    if (!saved.some((item) => item.id === id)) return;
    if (id !== build.id && isDirty()) {
      const ok = await askConfirm('Открыть другую сборку?', 'Текущие изменения не сохранены.', 'Открыть');
      if (!ok) return;
    }
    const latest = dataRef.current.saved.find((item) => item.id === id);
    if (!latest) return;
    commit({ build: toOpenedBuild(latest) });
    goToBuild();
  }

  function renameSaved(id: string, name: string): void {
    const { build, saved } = dataRef.current;
    if (!saved.some((item) => item.id === id)) return;
    commit({
      saved: saved.map((item) => (item.id === id ? { ...item, name } : item)),
      build: build.id === id ? { ...build, name } : build,
    });
    announce('Сборка переименована');
  }

  function duplicateSaved(id: string): void {
    const { saved } = dataRef.current;
    const index = saved.findIndex((item) => item.id === id);
    if (index < 0) return;
    const copy = createBuildCopy(saved[index]);
    commit({ saved: insertBuild(saved, index + 1, copy) });
    announce('Создана копия: ' + copy.name);
  }

  function deleteSaved(id: string): void {
    const { saved } = dataRef.current;
    const index = saved.findIndex((item) => item.id === id);
    if (index < 0) return;
    const removed = saved[index];
    commit({ saved: saved.filter((item) => item.id !== id) });
    announce('Сборка удалена', {
      actionLabel: 'Отменить',
      onAction: () => {
        const current = dataRef.current.saved;
        if (current.some((item) => item.id === removed.id)) return;
        commit({ saved: insertBuild(current, index, removed) });
      },
    });
  }

  function downloadSaved(id: string): void {
    const target = dataRef.current.saved.find((item) => item.id === id);
    if (target) downloadBuild(target, moneyRef.current);
  }

  function downloadAll(): void {
    downloadAllBuilds(dataRef.current.saved, moneyRef.current);
  }

  function onAddReview(productId: string, review: NewReview): boolean {
    let created: Review;
    try {
      created = createReview(review);
    } catch (error) {
      announce(error instanceof Error ? error.message : 'Не удалось прочитать отзыв');
      return false;
    }
    commit({ reviews: addReview(dataRef.current.reviews, productId, created) });
    announce('Отзыв добавлен');
    return true;
  }

  function onDeleteReview(productId: string, reviewId: string): void {
    commit({ reviews: removeReview(dataRef.current.reviews, productId, reviewId) });
    announce('Отзыв удалён');
  }

  function refreshProductSnapshots(items: Product[]): void {
    const refreshed = refreshSnapshots(dataRef.current.build, dataRef.current.saved, items);
    if (refreshed) commit(refreshed);
  }

  const ratings = useMemo(() => getRatingsMap(data.reviews), [data.reviews]);
  const currentSavedId = data.saved.some((item) => item.id === data.build.id) ? data.build.id : null;

  return {
    build: data.build,
    saved: data.saved,
    reviews: data.reviews,
    ratings,
    currentSavedId,
    storageWarning,
    money,
    rateNote,
    setCurrency,
    isDirty,
    nextBuildName,
    addProduct,
    removeSlot,
    renameBuild,
    setBudget,
    startNewBuild,
    saveCurrentBuild,
    openSaved,
    renameSaved,
    duplicateSaved,
    deleteSaved,
    downloadCurrent,
    downloadSaved,
    downloadAll,
    goToBuild,
    getAction: (product) => getProductAction(data.build, product),
    getAddLabel: (product) => getAddLabel(data.build, product),
    isInBuild: (product) => isProductInBuild(data.build, product),
    getRating: (productId) => getRatingSummary(data.reviews, productId),
    getReviews: (productId) => data.reviews[productId] || [],
    onAddReview,
    onDeleteReview,
    refreshSnapshots: refreshProductSnapshots,
    toast,
    announce,
    closeToast,
    confirmRequest,
    onConfirmResult,
  };
}
