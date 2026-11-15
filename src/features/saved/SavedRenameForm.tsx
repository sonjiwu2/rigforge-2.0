import { useId } from 'react';
import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import { Button, FieldError, FieldLabel, TextInput } from '../../components/ui';
import styles from './SavedRenameForm.module.css';

interface SavedRenameFormProps {
  draft: string;
  error: string;
  maxLength: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (draft: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function SavedRenameForm({
  draft,
  error,
  maxLength,
  inputRef,
  onDraftChange,
  onSubmit,
  onCancel,
}: SavedRenameFormProps) {
  const inputId = useId();
  const errorId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form className={styles.form} noValidate onSubmit={handleSubmit}>
      <FieldLabel htmlFor={inputId}>Название сборки</FieldLabel>
      <TextInput
        ref={inputRef}
        id={inputId}
        maxLength={maxLength}
        autoComplete="off"
        aria-describedby={errorId}
        aria-invalid={error ? 'true' : undefined}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <FieldError className={styles.error} id={errorId} hidden={!error}>
        {error}
      </FieldError>
      <div className={styles.actions}>
        <Button variant="primary" size="sm" type="submit">
          Сохранить
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
