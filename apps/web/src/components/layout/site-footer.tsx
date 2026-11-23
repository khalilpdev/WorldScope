import { ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const repositories = [
  { label: 'mledoze/countries', href: 'https://github.com/mledoze/countries' },
  { label: 'World Bank Open Data', href: 'https://data.worldbank.org/' },
  { label: 'Open-Meteo', href: 'https://open-meteo.com/' },
  { label: 'flagcdn.com', href: 'https://flagcdn.com/' },
] as const;

export function SiteFooter(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-6">
        <p>{t('footer.sources')}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span>{t('footer.built')}</span>
          {repositories.map((source) => (
            <a
              key={source.label}
              href={source.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 rounded-sm underline-offset-4 hover:text-foreground hover:underline"
            >
              {source.label}
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
