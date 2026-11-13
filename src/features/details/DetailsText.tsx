import type { HTMLAttributes } from 'react';
import { joinClasses } from '../../components/ui/joinClasses';
import styles from './DetailsText.module.css';

export function Muted({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={joinClasses(styles.muted, className)} {...props} />;
}

export function Subtitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={joinClasses(styles.subtitle, className)} {...props} />;
}

export function BodyText({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={joinClasses(styles.text, className)} {...props} />;
}
