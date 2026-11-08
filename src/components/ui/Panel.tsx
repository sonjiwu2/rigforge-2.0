import type { HTMLAttributes } from 'react';
import { joinClasses } from './joinClasses';
import styles from './Panel.module.css';

export const panelClass = styles.panel;

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClasses(styles.panel, className)} {...props} />;
}
