import { ExternalLink } from 'lucide-react';
import type { DataSourceInfo } from '@worldscope/shared';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';
import { formatDateTime } from '@/lib/format';

export function SourceList({
  sources,
  cached,
}: {
  sources: DataSourceInfo[];
  cached?: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <section aria-label={t('country.sources')} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{t('country.sources')}</h2>
        {cached !== undefined ? (
          <Badge variant="muted">{cached ? t('common.cached') : t('common.live')}</Badge>
        ) : null}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {sources.map((source) => (
          <li key={`${source.id}-${source.retrievedAt}`} className="rounded-lg border border-border bg-card p-3 text-xs">
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
            >
              {source.name}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
            <p className="mt-1 text-muted-foreground">
              {t('country.sourceUpdated', { date: formatDateTime(source.retrievedAt) })}
            </p>
            {source.license ? <p className="mt-0.5 text-muted-foreground">{source.license}</p> : null}
            {source.note ? <p className="mt-1 text-muted-foreground">{source.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
