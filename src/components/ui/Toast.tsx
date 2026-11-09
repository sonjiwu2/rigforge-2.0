import { useEffect, useRef } from 'react';
import type { ToastMessage } from '../../types';
import styles from './Toast.module.css';

const TOAST_DURATION = 7000;

interface ToastProps {
  message: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const onCloseRef = useRef(onClose);
  const messageId = message?.id;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (messageId === undefined) return;

    const timer = setTimeout(() => onCloseRef.current(), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [messageId]);

  function handleAction() {
    onClose();
    message?.onAction?.();
  }

  return (
    <div className={styles.region} aria-live="polite">
      {message && (
        <div key={message.id} className={styles.toast}>
          <p className={styles.text}>{message.text}</p>
          {message.actionLabel && (
            <button className={styles.action} type="button" onClick={handleAction}>
              {message.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
