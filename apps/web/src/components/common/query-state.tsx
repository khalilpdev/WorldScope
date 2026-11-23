import type { ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { errorMessage } from '@/lib/api';

export function LoadingState({ label }: { label?: string }): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{label ?? t('common.loading')}</span>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-12 text-center">
      <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">{t('common.error.title')}</p>
        <p className="max-w-lg text-sm text-muted-foreground">{errorMessage(error)}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('common.error.retry')}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-12 text-center">
      <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">{title ?? t('common.empty.title')}</p>
        <p className="text-sm text-muted-foreground">{description ?? t('common.empty.description')}</p>
      </div>
      {action}
    </div>
  );
}
