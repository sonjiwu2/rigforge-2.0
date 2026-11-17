import { Button } from './Button';
import { joinClasses } from './joinClasses';
import styles from './StateMessage.module.css';

interface StateMessageProps {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
  titleTag?: 'p' | 'h2';
  className?: string;
}

export function StateMessage({
  kind,
  title,
  text,
  actionLabel = 'Повторить',
  onAction,
  titleTag: TitleElement = 'p',
  className,
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
    </div>
  );
}
