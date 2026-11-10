import type { ReactNode } from 'react';
import { Button } from './Button';
import { joinClasses } from './joinClasses';
import styles from './StateMessage.module.css';

type TitleTag = 'p' | 'h2' | 'h3';

interface StateMessageProps {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  titleTag?: TitleTag;
  className?: string;
  children?: ReactNode;
}

export function StateMessage({
  kind,
  title,
  text,
  actionLabel = 'Повторить',
  onAction,
  titleTag: TitleElement = 'p',
  className,
  children,
}: StateMessageProps) {
  return (
    <div
      className={joinClasses(styles.state, kind === 'loading' && styles.loading, kind === 'error' && styles.error, className)}
      role={kind === 'error' ? 'alert' : undefined}
    >
      <TitleElement className={styles.title}>{title}</TitleElement>
      {text && <p className={styles.text}>{text}</p>}
      {onAction && (
        <Button className={styles.action} variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}

interface NoticeProps {
  title: string;
  text?: string;
  titleTag?: TitleTag;
  role?: 'status' | 'alert';
  className?: string;
  children?: ReactNode;
}

export function Notice({ title, text, titleTag: TitleElement = 'p', role, className, children }: NoticeProps) {
  return (
    <div className={joinClasses(styles.state, styles.warning, className)} role={role}>
      <TitleElement className={styles.title}>{title}</TitleElement>
      {text && <p className={styles.text}>{text}</p>}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span className={joinClasses(styles.skeleton, className)} aria-hidden="true" />;
}
