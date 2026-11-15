import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, getCategory } from '../data/catalog';
import { toSnapshot } from '../core/products';
import { addReview, createReview, getRatingSummary, getRatingsMap, removeReview } from '../core/reviews';
import { createEmptyBuild, loadAppState, persistAppState, WARNING_UNAVAILABLE } from '../core/storage';
import { downloadAllBuilds, downloadBuild } from '../features/build/export';
import { useMoney } from './useMoney';
import type {
  Build,
  BuildSlots,
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

function makeId(): string {
  return 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function buildContent(build: Build): string {
  return JSON.stringify({ name: build.name, budgetMinor: build.budgetMinor, slots: build.slots });
}

function hasParts(build: Build): boolean {
  return Object.values(build.slots).some(Boolean);
}

function touched(build: Build): Build {
  return { ...build, updatedAt: new Date().toISOString() };
}

function goToBuild(): void {
  window.location.hash = '#build';
}

function refreshBuild(build: Build, byId: Map<string, Product>): Build {
  const slots: BuildSlots = { ...build.slots };
  let changed = false;
  for (const { id } of CATEGORIES) {
    const snapshot = slots[id];
    const fresh = snapshot && byId.get(snapshot.id);
    if (snapshot && fresh && fresh.imageUrl && !snapshot.imageUrl) {
      slots[id] = { ...snapshot, imageUrl: fresh.imageUrl };
      changed = true;
    }
  }
  return changed ? { ...build, slots } : build;
}

export function useAppState(): UseAppStateResult {
  const [stored] = useState(loadAppState);
  const [data, setData] = useState<AppData>({ build: stored.build, saved: stored.saved, reviews: stored.reviews });
  const [storageWarning, setStorageWarning] = useState(stored.warning);
  const [toast, setToast] = useState<ToastMessage | null>(stored.warning ? { id: 1, text: stored.warning } : null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  const dataRef = useRef(data);
  const currencyRef = useRef(stored.settings.currency);
  const toastIdRef = useRef(1);
  const lastRemovedRef = useRef<RemovedSlot | null>(null);
  const confirmResolveRef = useRef<((ok: boolean) => void) | null>(null);

  function announce(text: string, options: AnnounceOptions = {}): void {
    toastIdRef.current += 1;
    setToast({ id: toastIdRef.current, text, actionLabel: options.actionLabel, onAction: options.onAction });
  }

  function closeToast(): void {
    setToast(null);
  }

  const { money, setCurrency: changeCurrency, rateNote } = useMoney(stored.settings.currency, announce);
  const moneyRef = useRef(money);

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

  function askConfirm(title: string, text: string, okLabel: string): Promise<boolean> {
    confirmResolveRef.current?.(false);
    setConfirmRequest({ title, text, okLabel });
    return new Promise((resolve) => {
      confirmResolveRef.current = resolve;
    });
  }

  function onConfirmResult(ok: boolean): void {
    const resolve = confirmResolveRef.current;
    confirmResolveRef.current = null;
    setConfirmRequest(null);
    resolve?.(ok);
  }

  function isDirty(): boolean {
    const { build, saved } = dataRef.current;
    const current = saved.find((item) => item.id === build.id);
    if (!current) return hasParts(build);
    return buildContent(current) !== buildContent(build);
  }

  function nextBuildName(): string {
    const { build, saved } = dataRef.current;
    const names = new Set(saved.map((item) => item.name));
    names.add(build.name);
    let number = saved.length + 1;
    while (names.has('Сборка №' + number)) number += 1;
    return 'Сборка №' + number;
  }

  function isInBuild(product: DetailsTarget): boolean {
    return data.build.slots[product.category]?.id === product.id;
  }

  function getAddLabel(product: DetailsTarget): string {
    if (isInBuild(product)) return 'В сборке';
    if (data.build.slots[product.category]) return 'Заменить';
    return 'В сборку';
  }

  function getAction(product: DetailsTarget): ProductAction {
    if (isInBuild(product)) return { label: 'В сборке', inBuild: true, disabled: true };
    if (data.build.slots[product.category]) {
      const category = getCategory(product.category);
      return { label: 'Заменить ' + (category ? category.accusative : ''), inBuild: false, disabled: false };
    }
    return { label: 'В сборку', inBuild: false, disabled: false };
  }

  function addProduct(product: DetailsTarget): void {
    const { build } = dataRef.current;
    if (build.slots[product.category]?.id === product.id) return;
    const replaced = Boolean(build.slots[product.category]);

    commit({ build: touched({ ...build, slots: { ...build.slots, [product.category]: toSnapshot(product) } }) });

    const category = getCategory(product.category);
    const text = replaced
      ? 'Заменили ' + (category ? category.accusative : '') + ': ' + product.name
      : 'Добавлено в сборку: ' + product.name;
    announce(text, { actionLabel: 'К сборке', onAction: goToBuild });
  }

  function undoRemove(): void {
    const removed = lastRemovedRef.current;
    const { build } = dataRef.current;
    if (!removed || removed.buildId !== build.id) return;
    if (build.slots[removed.slotId]) return;
    lastRemovedRef.current = null;
    commit({ build: touched({ ...build, slots: { ...build.slots, [removed.slotId]: removed.snapshot } }) });
  }

  function removeSlot(slotId: CategoryId): void {
    const { build } = dataRef.current;
    const snapshot = build.slots[slotId];
    if (!snapshot) return;
    lastRemovedRef.current = { buildId: build.id, slotId, snapshot };
    commit({ build: touched({ ...build, slots: { ...build.slots, [slotId]: null } }) });
    announce('Убрано из сборки: ' + snapshot.name, { actionLabel: 'Отменить', onAction: undoRemove });
  }

  function renameBuild(name: string): void {
    commit({ build: touched({ ...dataRef.current.build, name }) });
  }

  function setBudget(budgetMinor: number | null): void {
    commit({ build: touched({ ...dataRef.current.build, budgetMinor }) });
  }

  async function startNewBuild(): Promise<void> {
    if (isDirty()) {
      const ok = await askConfirm('Создать новую сборку?', 'Текущие изменения не сохранены.', 'Создать');
      if (!ok) return;
    }
    commit({ build: touched(createEmptyBuild(nextBuildName())) });
    goToBuild();
    announce('Создана новая сборка');
  }

  function downloadCurrent(): void {
    downloadBuild(dataRef.current.build, moneyRef.current);
  }

  function saveCurrentBuild(): void {
    const { build, saved } = dataRef.current;
    const copy: Build = { ...build, savedAt: new Date().toISOString() };
    const index = saved.findIndex((item) => item.id === copy.id);
    const nextSaved = index >= 0 ? saved.map((item, i) => (i === index ? copy : item)) : [copy, ...saved];

    if (commit({ saved: nextSaved })) {
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
    const target = saved.find((item) => item.id === id);
    if (!target) return;
    if (target.id !== build.id && isDirty()) {
      const ok = await askConfirm('Открыть другую сборку?', 'Текущие изменения не сохранены.', 'Открыть');
      if (!ok) return;
    }
    const latest = dataRef.current.saved.find((item) => item.id === id);
    if (!latest) return;
    const opened: Build = { ...latest };
    delete opened.savedAt;
    commit({ build: touched(opened) });
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
    const copy: Build = {
      ...saved[index],
      id: makeId(),
      name: (saved[index].name + ' (копия)').slice(0, 80),
      savedAt: new Date().toISOString(),
    };
    commit({ saved: [...saved.slice(0, index + 1), copy, ...saved.slice(index + 1)] });
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
        const position = Math.min(index, current.length);
        commit({ saved: [...current.slice(0, position), removed, ...current.slice(position)] });
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

  function getRating(productId: string): RatingSummary {
    return getRatingSummary(data.reviews, productId);
  }

  function getReviews(productId: string): Review[] {
    return data.reviews[productId] || [];
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

  function refreshSnapshots(items: Product[]): void {
    const byId = new Map(items.map((item) => [item.id, item]));
    const { build, saved } = dataRef.current;
    const nextBuild = refreshBuild(build, byId);
    const nextSaved = saved.map((item) => refreshBuild(item, byId));
    if (nextBuild !== build || nextSaved.some((item, index) => item !== saved[index])) {
      commit({ build: nextBuild, saved: nextSaved });
    }
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
    getAction,
    getAddLabel,
    isInBuild,
    getRating,
    getReviews,
    onAddReview,
    onDeleteReview,
    refreshSnapshots,
    toast,
    announce,
    closeToast,
    confirmRequest,
    onConfirmResult,
  };
}
