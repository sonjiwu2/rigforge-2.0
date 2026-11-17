import { CATEGORIES, getCategory } from '../data/catalog';
import type { Build, BuildSlots, CategoryId, DetailsTarget, Product, ProductAction, ProductSnapshot } from '../types';

const NAME_MAX = 80;

function makeId(): string {
  return 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function buildContent(build: Build): string {
  return JSON.stringify({ name: build.name, budgetMinor: build.budgetMinor, slots: build.slots });
}

function hasParts(build: Build): boolean {
  return Object.values(build.slots).some(Boolean);
}

function accusativeOf(categoryId: CategoryId): string {
  const category = getCategory(categoryId);
  return category ? category.accusative : '';
}

export function isBuildDirty(build: Build, saved: Build[]): boolean {
  const current = saved.find((item) => item.id === build.id);
  if (!current) return hasParts(build);
  return buildContent(current) !== buildContent(build);
}

export function getNextBuildName(build: Build, saved: Build[]): string {
  const names = new Set(saved.map((item) => item.name));
  names.add(build.name);
  let number = saved.length + 1;
  while (names.has('Сборка №' + number)) number += 1;
  return 'Сборка №' + number;
}

export function touchBuild(build: Build): Build {
  return { ...build, updatedAt: new Date().toISOString() };
}

export function setBuildSlot(build: Build, slotId: CategoryId, snapshot: ProductSnapshot | null): Build {
  return touchBuild({ ...build, slots: { ...build.slots, [slotId]: snapshot } });
}

export function isProductInBuild(build: Build, product: DetailsTarget): boolean {
  return build.slots[product.category]?.id === product.id;
}

export function getAddLabel(build: Build, product: DetailsTarget): string {
  if (isProductInBuild(build, product)) return 'В сборке';
  if (build.slots[product.category]) return 'Заменить';
  return 'В сборку';
}

export function getProductAction(build: Build, product: DetailsTarget): ProductAction {
  if (isProductInBuild(build, product)) return { label: 'В сборке', inBuild: true, disabled: true };
  if (build.slots[product.category]) {
    return { label: 'Заменить ' + accusativeOf(product.category), inBuild: false, disabled: false };
  }
  return { label: 'В сборку', inBuild: false, disabled: false };
}

export function getAddedText(product: DetailsTarget, replaced: boolean): string {
  return replaced
    ? 'Заменили ' + accusativeOf(product.category) + ': ' + product.name
    : 'Добавлено в сборку: ' + product.name;
}

export function saveToList(saved: Build[], build: Build): Build[] {
  const copy: Build = { ...build, savedAt: new Date().toISOString() };
  const index = saved.findIndex((item) => item.id === copy.id);
  return index >= 0 ? saved.map((item, i) => (i === index ? copy : item)) : [copy, ...saved];
}

export function toOpenedBuild(saved: Build): Build {
  const opened: Build = { ...saved };
  delete opened.savedAt;
  return touchBuild(opened);
}

export function createBuildCopy(build: Build): Build {
  return {
    ...build,
    id: makeId(),
    name: (build.name + ' (копия)').slice(0, NAME_MAX),
    savedAt: new Date().toISOString(),
  };
}

export function insertBuild(saved: Build[], index: number, build: Build): Build[] {
  const position = Math.min(index, saved.length);
  return [...saved.slice(0, position), build, ...saved.slice(position)];
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

export function refreshSnapshots(
  build: Build,
  saved: Build[],
  items: Product[],
): { build: Build; saved: Build[] } | null {
  const byId = new Map(items.map((item) => [item.id, item]));
  const nextBuild = refreshBuild(build, byId);
  const nextSaved = saved.map((item) => refreshBuild(item, byId));
  const changed = nextBuild !== build || nextSaved.some((item, index) => item !== saved[index]);
  return changed ? { build: nextBuild, saved: nextSaved } : null;
}
