import { useEffect, useRef, useState } from 'react';
import { Layout } from './components/layout';
import { ConfirmDialog, Toast } from './components/ui';
import { BuildView } from './features/build/BuildView';
import { CatalogView } from './features/catalog/CatalogView';
import { useCatalog } from './features/catalog/useCatalog';
import { DetailsDialog } from './features/details/DetailsDialog';
import { SavedView } from './features/saved/SavedView';
import { useAppState } from './hooks/useAppState';
import { useHashView } from './hooks/useHashView';
import type { DetailsTarget } from './types';

export default function App() {
  const view = useHashView();
  const app = useAppState();
  const catalog = useCatalog({
    active: view === 'catalog',
    ratings: app.ratings,
    onItemsLoaded: app.refreshSnapshots,
  });
  const [detailsTarget, setDetailsTarget] = useState<DetailsTarget | null>(null);
  const [detailsTrigger, setDetailsTrigger] = useState<HTMLElement | null>(null);
  const focusAfterDetailsRef = useRef<HTMLElement | null>(null);
  const catalogStarted = view === 'catalog' || catalog.catalog.status !== 'idle';

  useEffect(() => {
    if (detailsTarget) return;
    const back = focusAfterDetailsRef.current;
    focusAfterDetailsRef.current = null;
    if (back && back.isConnected) back.focus();
  }, [detailsTarget]);

  function addProduct(product: DetailsTarget) {
    app.addProduct(product);
    if (catalog.catalog.targetSlot === product.category) catalog.clearTargetSlot();
  }

  function openDetails(product: DetailsTarget, trigger: HTMLElement) {
    setDetailsTrigger(trigger);
    setDetailsTarget(product);
  }

  function closeDetails() {
    setDetailsTarget(null);
    setDetailsTrigger(null);
  }

  function goToBuildFromDetails() {
    focusAfterDetailsRef.current = detailsTrigger;
    app.goToBuild();
  }

  return (
    <>
      <Layout view={view} currency={app.money.currency} rateNote={app.rateNote} onCurrencyChange={app.setCurrency}>
        <section aria-label="Сборка" hidden={view !== 'build'}>
          <BuildView
            build={app.build}
            money={app.money}
            storageWarning={app.storageWarning}
            onRenameBuild={app.renameBuild}
            onBudgetChange={app.setBudget}
            onReplace={(slot) => catalog.chooseForSlot(slot, true)}
            onChoose={(slot) => catalog.chooseForSlot(slot, false)}
            onRemove={app.removeSlot}
            onOpenDetails={openDetails}
            onSave={app.saveCurrentBuild}
            onNewBuild={app.startNewBuild}
            onDownload={app.downloadCurrent}
          />
        </section>
        <section aria-label="Каталог" hidden={view !== 'catalog'}>
          {catalogStarted && (
            <CatalogView
              catalog={catalog.catalog}
              money={app.money}
              build={app.build}
              search={catalog.search}
              setCategory={catalog.setCategory}
              applyFilters={catalog.applyFilters}
              resetFilters={catalog.resetFilters}
              setSort={catalog.setSort}
              retry={catalog.retry}
              clearTargetSlot={catalog.clearTargetSlot}
              isInBuild={app.isInBuild}
              getAddLabel={app.getAddLabel}
              getRating={app.getRating}
              onAdd={addProduct}
              onOpenDetails={openDetails}
              onGoToBuild={app.goToBuild}
            />
          )}
        </section>
        <section aria-label="Сохранённые сборки" hidden={view !== 'saved'}>
          <SavedView
            saved={app.saved}
            money={app.money}
            currentSavedId={app.currentSavedId}
            storageWarning={app.storageWarning}
            onOpenSaved={app.openSaved}
            onRenameSaved={app.renameSaved}
            onDuplicateSaved={app.duplicateSaved}
            onDeleteSaved={app.deleteSaved}
            onDownloadSaved={app.downloadSaved}
            onDownloadAll={app.downloadAll}
            onNewBuild={app.startNewBuild}
            onGoToBuild={app.goToBuild}
          />
        </section>
      </Layout>
      <DetailsDialog
        target={detailsTarget}
        trigger={detailsTrigger}
        money={app.money}
        reviews={detailsTarget ? app.getReviews(detailsTarget.id) : []}
        rating={detailsTarget ? app.getRating(detailsTarget.id) : { average: null, count: 0 }}
        action={detailsTarget ? app.getAction(detailsTarget) : null}
        onAction={addProduct}
        onAddReview={app.onAddReview}
        onDeleteReview={app.onDeleteReview}
        onGoToBuild={goToBuildFromDetails}
        onClose={closeDetails}
      />
      <Toast message={app.toast} onClose={app.closeToast} />
      <ConfirmDialog request={app.confirmRequest} onResult={app.onConfirmResult} />
    </>
  );
}
