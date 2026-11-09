import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { joinClasses } from '../ui/joinClasses';
import styles from './Page.module.css';

export function PageHead({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClasses(styles.head, className)} {...props} />;
}

export const PageTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function PageTitle(
  { className, ...props },
  ref,
) {
  return <h1 ref={ref} className={joinClasses(styles.title, className)} {...props} />;
});

export function PageSub({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={joinClasses(styles.sub, className)} {...props} />;
}
