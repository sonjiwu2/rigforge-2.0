import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui';
import type { ProductAction } from '../../types';
import styles from './DetailsActions.module.css';

const DEFAULT_ACTION: ProductAction = { label: 'В сборку', inBuild: false, disabled: false };

interface DetailsActionsProps {
  action: ProductAction | null;
  onAction: () => void;
  onGoToBuild: () => void;
}

export function DetailsActions({ action, onAction, onGoToBuild }: DetailsActionsProps) {
  const [done, setDone] = useState(false);
  const goBuildRef = useRef<HTMLButtonElement>(null);
  const current = action || DEFAULT_ACTION;

  useEffect(() => {
    if (done && goBuildRef.current) goBuildRef.current.focus();
  }, [done]);

  function handleAction() {
    if (current.inBuild) return;
    onAction();
    setDone(true);
  }

  return (
    <footer className={styles.actions}>
      <Button
        className={styles.action}
        variant={current.inBuild ? 'done' : 'primary'}
        icon={current.inBuild ? 'check' : undefined}
        aria-disabled={current.inBuild ? 'true' : undefined}
        disabled={!current.inBuild && current.disabled}
        onClick={handleAction}
      >
        {current.inBuild ? 'В сборке' : current.label || 'В сборку'}
      </Button>
      <Button
        ref={goBuildRef}
        className={styles.action}
        variant="secondary"
        hidden={!(done || current.inBuild)}
        onClick={onGoToBuild}
      >
        К сборке
      </Button>
    </footer>
  );
}
