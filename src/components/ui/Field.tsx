import type { ComponentProps } from 'react';
import { joinClasses } from './joinClasses';
import styles from './Field.module.css';

export const fieldLabelClass = styles.label;

export function Field({ className, ...props }: ComponentProps<'div'>) {
  return <div className={joinClasses(styles.field, className)} {...props} />;
}

export function FieldLabel({ className, ...props }: ComponentProps<'label'>) {
  return <label className={joinClasses(styles.label, className)} {...props} />;
}

export function FieldError({ className, ...props }: ComponentProps<'p'>) {
  return <p className={joinClasses(styles.error, className)} {...props} />;
}

export function TextInput({ type = 'text', className, ...props }: ComponentProps<'input'>) {
  return <input type={type} className={joinClasses(styles.control, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={joinClasses(styles.control, styles.select, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={joinClasses(styles.control, styles.textarea, className)} {...props} />;
}

export function Checkbox({ className, children, ...props }: ComponentProps<'input'>) {
  return (
    <label className={joinClasses(styles.checkbox, className)}>
      <input type="checkbox" {...props} />
      {children}
    </label>
  );
}
