import { forwardRef } from 'react';
import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { joinClasses } from './joinClasses';
import styles from './Field.module.css';

export const fieldLabelClass = styles.label;

export function Field({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={joinClasses(styles.field, className)} {...props} />;
}

export function FieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={joinClasses(styles.label, className)} {...props} />;
}

export function FieldHint({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={joinClasses(styles.hint, className)} {...props} />;
}

export function FieldError({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={joinClasses(styles.error, className)} {...props} />;
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { type = 'text', className, ...props },
  ref,
) {
  return <input ref={ref} type={type} className={joinClasses(styles.control, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={joinClasses(styles.control, styles.select, className)} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} className={joinClasses(styles.control, styles.textarea, className)} {...props} />;
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox(
  { type = 'checkbox', className, children, ...props },
  ref,
) {
  return (
    <label className={joinClasses(styles.checkbox, className)}>
      <input ref={ref} type={type} {...props} />
      {children}
    </label>
  );
});
