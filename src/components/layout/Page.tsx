import type { ComponentProps } from 'react';
import { joinClasses } from '../ui/joinClasses';
import styles from './Page.module.css';

export function PageHead({ className, ...props }: ComponentProps<'div'>) {
  return <div className={joinClasses(styles.head, className)} {...props} />;
}

export function PageTitle({ className, ...props }: ComponentProps<'h1'>) {
  return <h1 className={joinClasses(styles.title, className)} {...props} />;
}

export function PageSub({ className, ...props }: ComponentProps<'p'>) {
  return <p className={joinClasses(styles.sub, className)} {...props} />;
}
