import type { ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

interface VisuallyHiddenProps {
  children: ReactNode;
  htmlFor?: string;
}

export const visuallyHiddenClass = styles.hidden;

export function VisuallyHidden({ children, htmlFor }: VisuallyHiddenProps) {
  if (htmlFor) {
    return (
      <label className={styles.hidden} htmlFor={htmlFor}>
        {children}
      </label>
    );
  }

  return <span className={styles.hidden}>{children}</span>;
}
