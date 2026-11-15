import { Button, Icon, panelClass, visuallyHiddenClass } from '../../components/ui';
import { PageHead } from '../../components/layout';
import { CATEGORIES } from '../../data/catalog';
import { BudgetPanel } from './BudgetPanel';
import { BuildNameField } from './BuildNameField';
import { BuildRow } from './BuildRow';
import { calculateBuildTotals, countText } from './totals';
import type { Build, CategoryId, Money, ProductSnapshot } from '../../types';
import styles from './BuildView.module.css';

const POSITION_FORMS = ['позиция', 'позиции', 'позиций'];

export interface BuildViewProps {
  build: Build;
  money: Money;
  storageWarning: string | null;
  onRenameBuild: (name: string) => void;
  onBudgetChange: (budgetMinor: number | null) => void;
  onReplace: (slotId: CategoryId) => void;
  onChoose: (slotId: CategoryId) => void;
  onRemove: (slotId: CategoryId) => void;
  onOpenDetails: (part: ProductSnapshot, trigger: HTMLElement) => void;
  onSave: () => void;
  onNewBuild: () => void;
  onDownload: () => void;
}

export function BuildView({
  build,
  money,
  storageWarning,
  onRenameBuild,
  onBudgetChange,
  onReplace,
  onChoose,
  onRemove,
  onOpenDetails,
  onSave,
  onNewBuild,
  onDownload,
}: BuildViewProps) {
  const totals = calculateBuildTotals(build);

  return (
    <div className={styles.page}>
      <PageHead className={styles.head}>
        <h1 className={visuallyHiddenClass}>Сборка</h1>
        <BuildNameField key={build.id} name={build.name} onRename={onRenameBuild} />
        <Button className={styles.newBuild} variant="secondary" icon="plus" onClick={onNewBuild}>
          Новая сборка
        </Button>
      </PageHead>

      <div className={styles.warning} role="status" hidden={!storageWarning}>
        {storageWarning && (
          <>
            <Icon name="warning" />
            <span>{storageWarning}</span>
          </>
        )}
      </div>

      <div className={styles.layout}>
        <div className={styles.side}>
          <BudgetPanel
            key={build.id}
            build={build}
            money={money}
            onBudgetChange={onBudgetChange}
            onSave={onSave}
            onDownload={onDownload}
          />
          <p className={styles.note}>
            <Icon name="info" />
            <span>Совместимость не проверена. Сверьте требования деталей перед покупкой.</span>
          </p>
        </div>

        <section className={`${panelClass} ${styles.parts}`} aria-labelledby="build-parts-title">
          <div className={styles.partsHead}>
            <h2 className={styles.partsTitle} id="build-parts-title">
              Комплектующие
            </h2>
            <p className={styles.partsCount}>{countText(totals.count, POSITION_FORMS)}</p>
          </div>
          <ul className={styles.list} role="list">
            {CATEGORIES.map((category) => (
              <BuildRow
                key={category.id}
                category={category}
                part={build.slots[category.id]}
                money={money}
                onOpenDetails={onOpenDetails}
                onReplace={onReplace}
                onChoose={onChoose}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
