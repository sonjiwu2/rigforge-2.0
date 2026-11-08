import type { ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

interface VisuallyHiddenProps {
  children: ReactNode;
  id?: string;
  htmlFor?: string;
}

export const visuallyHiddenClass = styles.hidden;

export function VisuallyHidden({ children, id, htmlFor }: VisuallyHiddenProps) {
  if (htmlFor) {
    return (
      <label className={styles.hidden} id={id} htmlFor={htmlFor}>
        {children}
      </label>
    );
  }

  return (
    <span className={styles.hidden} id={id}>
      {children}
    </span>
  );
}
