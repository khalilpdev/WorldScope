import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { CountryCard } from '@/components/common/country-card';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagination';
import { EmptyState, ErrorState } from '@/components/common/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type CountryListParams } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { DEFAULT_PAGE_SIZE, SORTABLE_FIELDS, type SortOrder, type SortableField } from '@worldscope/shared';

export function ExplorePage(): React.JSX.Element {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const params: Required<Pick<CountryListParams, 'page' | 'limit' | 'sortBy' | 'order'>> & CountryListParams = {
    page: toPositiveInt(searchParams.get('page')) ?? 1,
    limit: DEFAULT_PAGE_SIZE,
    search: searchParams.get('search') ?? undefined,
    region: searchParams.get('region') ?? undefined,
    subregion: searchParams.get('subregion') ?? undefined,
    sortBy: toSortField(searchParams.get('sortBy')),
    order: toSortOrder(searchParams.get('order')),
  };

  const [searchInput, setSearchInput] = useState(params.search ?? '');

  const setParam = useCallback(
    (key: string, value: string | number | undefined) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (value === undefined || value === '') next.delete(key);
          else next.set(key, String(value));
          if (key !== 'page') next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === (params.search ?? '')) return;
    const timer = window.setTimeout(() => setParam('search', trimmed || undefined), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, params.search, setParam]);

  const countries = useQuery({
    queryKey: ['countries', params],
    queryFn: ({ signal }) => api.listCountries(params, signal),
  });

  const hasFilters = Boolean(params.search || params.region || params.subregion);
  const results = countries.data;
  const facets = results?.facets;

  return (
    <div>
      <PageHeader
        title={t('explore.title')}
        description={t('explore.subtitle')}
        actions={
          <>
            {results ? <Badge variant="muted">{t('explore.results', { count: results.meta.total })}</Badge> : null}
            {results?.cached ? <Badge variant="secondary">{t('common.cached')}</Badge> : null}
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams(new URLSearchParams(), { replace: true });
                }}
              >
                <X aria-hidden="true" />
                {t('explore.clear')}
              </Button>
            ) : null}
          </>
        }
      />

      <section
        aria-label={t('explore.title')}
        className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="relative sm:col-span-2 lg:col-span-2">
          <label htmlFor="search" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('explore.search')}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2.5 left-3 size-4 text-muted-foreground"
          />
          <Input
            id="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('explore.searchPlaceholder')}
            className="pl-9"
            type="search"
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="region" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('explore.region')}
          </label>
          <Select
            id="region"
            value={params.region ?? ''}
            onChange={(event) => setParam('region', event.target.value || undefined)}
          >
            <option value="">{t('explore.allRegions')}</option>
            {facets?.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="subregion" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t('explore.subregion')}
          </label>
          <Select
            id="subregion"
            value={params.subregion ?? ''}
            onChange={(event) => setParam('subregion', event.target.value || undefined)}
          >
            <option value="">{t('explore.allSubregions')}</option>
            {facets?.subregions.map((subregion) => (
              <option key={subregion} value={subregion}>
                {subregion}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sortBy" className="mb-1 block text-xs font-medium text-muted-foreground">
              {t('explore.sortBy')}
            </label>
            <Select
              id="sortBy"
              value={params.sortBy}
              onChange={(event) => setParam('sortBy', event.target.value)}
            >
              {SORTABLE_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {t(`explore.sort.${field}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="order" className="mb-1 block text-xs font-medium text-muted-foreground">
              {t('explore.order')}
            </label>
            <Select
              id="order"
              value={params.order}
              onChange={(event) => setParam('order', event.target.value)}
            >
              <option value="asc">{t('explore.order.asc')}</option>
              <option value="desc">{t('explore.order.desc')}</option>
            </Select>
          </div>
        </div>
      </section>

      {countries.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : countries.isError ? (
        <ErrorState error={countries.error} onRetry={() => void countries.refetch()} />
      ) : !results || results.data.length === 0 ? (
        <EmptyState
          description={t('common.empty.description')}
          action={
            <Button variant="outline" size="sm" onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}>
              {t('explore.clear')}
            </Button>
          }
        />
      ) : (
        <>
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {results.data.map((country) => (
              <li key={country.code}>
                <CountryCard country={country} />
              </li>
            ))}
          </ul>
          <Pagination meta={results.meta} onPageChange={(page) => setParam('page', page)} />
        </>
      )}
    </div>
  );
}

function toPositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toSortField(value: string | null): SortableField {
  return SORTABLE_FIELDS.includes(value as SortableField) ? (value as SortableField) : 'name';
}

function toSortOrder(value: string | null): SortOrder {
  return value === 'desc' ? 'desc' : 'asc';
}
