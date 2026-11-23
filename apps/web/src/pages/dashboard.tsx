import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Globe2, Layers, Map, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart } from '@/components/charts/bar-chart';
import { CountryCard } from '@/components/common/country-card';
import { PageHeader } from '@/components/common/page-header';
import { ErrorState } from '@/components/common/query-state';
import { SourceList } from '@/components/common/source-list';
import { StatCard } from '@/components/common/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatCompact } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

export function DashboardPage(): React.JSX.Element {
  const { t } = useTranslation();
  const overview = useQuery({ queryKey: ['overview'], queryFn: ({ signal }) => api.getOverview(signal) });

  if (overview.isLoading) {
    return <DashboardSkeleton />;
  }

  if (overview.isError || !overview.data) {
    return (
      <>
        <PageHeader title={t('dashboard.title')} description={t('dashboard.subtitle')} />
        <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />
      </>
    );
  }

  const { data, sources, cached } = overview.data;
  const { totals, regions, highlights } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.subtitle')}
        actions={
          <>
            {cached ? <Badge variant="muted">{t('common.cached')}</Badge> : null}
            <Button asChild>
              <Link to="/explore">
                {t('dashboard.viewAll')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label={t('dashboard.title')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t('dashboard.stat.countries')}
          value={formatCompact(totals.countries)}
          hint={t('common.source') + ': mledoze/countries'}
          icon={<Globe2 className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label={t('dashboard.stat.population')}
          value={formatCompact(totals.population)}
          hint={totals.populationYear ? t('dashboard.dataYear', { year: totals.populationYear }) : t('common.na')}
          icon={<Users className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label={t('dashboard.stat.regions')}
          value={formatCompact(totals.regions)}
          icon={<Map className="size-4" aria-hidden="true" />}
        />
        <StatCard
          label={t('dashboard.stat.subregions')}
          value={formatCompact(totals.subregions)}
          icon={<Layers className="size-4" aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 font-semibold">{t('dashboard.regions')}</h2>
          <BarChart
            ariaLabel={t('dashboard.regions')}
            horizontal
            data={regions.map((region) => ({ label: region.region, value: region.countryCount }))}
            unit="countries"
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 font-semibold">{t('dashboard.populationByRegion')}</h2>
          <BarChart
            ariaLabel={t('dashboard.populationByRegion')}
            horizontal
            data={regions
              .filter((region) => region.population !== null)
              .map((region) => ({ label: region.region, value: region.population ?? 0 }))}
            unit="people"
          />
        </div>
      </section>

      <section aria-label={t('dashboard.highlights')}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{t('dashboard.highlights')}</h2>
          <Link to="/explore?sortBy=population&order=desc" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((country) => (
            <CountryCard key={country.code} country={country} />
          ))}
        </div>
      </section>

      <SourceList sources={sources} cached={cached} />
    </div>
  );
}

function DashboardSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
