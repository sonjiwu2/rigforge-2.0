import { StateMessage } from '../../components/ui';
import type { CatalogError } from '../../types';

interface CatalogStatusProps {
  loading: boolean;
  empty: boolean;
  error: CatalogError | null;
  showError: boolean;
  onReset: () => void;
  onRetry: () => void;
}

function CatalogErrorMessage({ error, onRetry }: { error: CatalogError | null; onRetry: () => void }) {
  const isRate = error !== null && (error.kind === 'rate' || error.retryAfter !== null);
  const title = isRate ? 'Слишком много запросов. Попробуйте позже' : 'Не удалось загрузить каталог';
  let text = isRate ? '' : (error && error.message) || 'Попробуйте ещё раз.';
  if (isRate && error.retryAfter) text = `Повторить можно примерно через ${error.retryAfter} с.`;
  const canRetry = !error || error.canRetry !== false;

  return <StateMessage kind="error" title={title} text={text} onAction={canRetry ? onRetry : undefined} />;
}

export function CatalogStatus({ loading, empty, error, showError, onReset, onRetry }: CatalogStatusProps) {
  if (showError) return <CatalogErrorMessage error={error} onRetry={onRetry} />;
  if (loading) return <StateMessage kind="loading" title="Загрузка…" text="Загружаем комплектующие." />;
  if (empty) {
    return (
      <StateMessage
        kind="empty"
        title="Ничего не найдено"
        text="Измените запрос или сбросьте фильтры."
        actionLabel="Сбросить фильтры"
        onAction={onReset}
      />
    );
  }
  return null;
}
