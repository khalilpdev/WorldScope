import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@worldscope/shared';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const canGoBack = meta.page > 1;
  const canGoForward = meta.page < meta.totalPages;

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">{t('explore.page', { page: meta.page, total: meta.totalPages })}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoBack}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          {t('common.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!canGoForward}
          onClick={() => onPageChange(meta.page + 1)}
        >
          {t('common.next')}
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
