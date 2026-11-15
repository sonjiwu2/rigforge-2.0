import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { FieldError } from '../../components/ui';
import styles from './BuildNameField.module.css';

const NAME_MAX = 80;

interface BuildNameFieldProps {
  name: string;
  onRename: (name: string) => void;
}

export function BuildNameField({ name, onRename }: BuildNameFieldProps) {
  const [draft, setDraft] = useState(name);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');

  function commit() {
    const next = draft.trim();
    if (!next) {
      setError('Введите название сборки');
      return;
    }
    if (next.length > NAME_MAX) {
      setError(`Название не длиннее ${NAME_MAX} символов`);
      return;
    }
    setError('');
    setDraft(next);
    if (next !== name) onRename(next);
  }

  function handleFocus() {
    if (!error) setDraft(name);
    setFocused(true);
  }

  function handleBlur() {
    setFocused(false);
    commit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      setDraft(name);
      setError('');
    }
  }

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="build-name-input">
        Название сборки
      </label>
      <input
        className={styles.input}
        id="build-name-input"
        type="text"
        maxLength={NAME_MAX}
        autoComplete="off"
        spellCheck={false}
        aria-describedby="build-name-error"
        aria-invalid={error ? 'true' : undefined}
        value={focused || error ? draft : name}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <FieldError className={styles.error} id="build-name-error" hidden={!error}>
        {error}
      </FieldError>
    </div>
  );
}
