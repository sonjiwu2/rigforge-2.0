import type { Spec } from '../../types';
import { Muted } from './DetailsText';
import styles from './SpecsList.module.css';

export function SpecsList({ specs }: { specs: Spec[] }) {
  if (!specs.length) return <Muted>Характеристики не указаны</Muted>;

  return (
    <dl className={styles.list}>
      {specs.map((spec) => (
        <div key={spec.key} className={styles.row}>
          <dt>{spec.label || spec.key}</dt>
          <dd>{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
