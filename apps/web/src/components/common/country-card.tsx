import type { CountrySummary } from '@worldscope/shared';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatArea, formatPopulation } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

export function CountryCard({ country }: { country: CountrySummary }): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <img
          src={country.flag.png}
          alt=""
          loading="lazy"
          width={56}
          height={40}
          className="h-10 w-14 rounded border border-border object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold leading-tight">
            <Link
              to={`/countries/${country.code}`}
              className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {country.name}
            </Link>
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {country.code} · {country.region}
            {country.subregion ? ` · ${country.subregion}` : ''}
          </p>
        </div>
        <Badge variant="outline">{country.code}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t('country.population')}</dt>
          <dd className="font-medium tabular-nums">{formatPopulation(country.population)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('country.area')}</dt>
          <dd className="font-medium tabular-nums">{formatArea(country.areaKm2)}</dd>
        </div>
      </dl>

      <Link
        to={`/countries/${country.code}`}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
        aria-label={`${t('common.viewDetails')}: ${country.name}`}
      >
        {t('common.viewDetails')}
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </article>
  );
}
