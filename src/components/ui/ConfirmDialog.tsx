import { useEffect, useRef } from 'react';
import { Button } from './Button';
import type { ConfirmRequest } from '../../types';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  request: ConfirmRequest | null;
  onResult: (ok: boolean) => void;
}

export function ConfirmDialog({ request, onResult }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (request && !dialog.open) {
      dialog.returnValue = 'cancel';
      dialog.showModal();
      cancelRef.current?.focus();
    }
    if (!request && dialog.open) {
      dialog.close();
    }
  }, [request]);

  function handleClose() {
    if (!request) return;
    onResult(dialogRef.current?.returnValue === 'ok');
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={handleClose}>
      <form method="dialog">
        <h2 className={styles.title}>{request?.title}</h2>
        <p className={styles.text}>{request?.text}</p>
        <div className={styles.actions}>
          <Button ref={cancelRef} type="submit" variant="secondary" value="cancel">
            Отмена
          </Button>
          <Button type="submit" variant="primary" value="ok">
            {request?.okLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
