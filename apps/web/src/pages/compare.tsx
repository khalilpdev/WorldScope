import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MAX_COMPARE_COUNTRIES, MIN_COMPARE_COUNTRIES, type CompareResponse } from '@worldscope/shared';
import { BarChart } from '@/components/charts/bar-chart';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/query-state';
import { CountryPicker } from '@/components/country/country-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api, errorMessage } from '@/lib/api';
import { formatMetric } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

const ISO3 = /^[A-Z]{3}$/;

export function ComparePage(): React.JSX.Element {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [metricId, setMetricId] = useState<string | null>(null);

  const selected = useMemo(() => parseCodes(searchParams.get('codes')), [searchParams]);

  const setCodes = useCallback(
    (next: string[]) => {
      const params = new URLSearchParams();
      if (next.length > 0) params.set('codes', next.join(','));
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const selectedDetails = useQueries({
    queries: selected.map((code) => ({
      queryKey: ['country', code],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.getCountry(code, signal),
    })),
  });

  const comparison = useQuery({
    queryKey: ['compare', selected.join(',')],
    queryFn: ({ signal }) => api.compare(selected, signal),
    enabled: selected.length >= MIN_COMPARE_COUNTRIES && selected.length <= MAX_COMPARE_COUNTRIES,
    retry: false,
  });

  const save = useMutation({
    mutationFn: () => api.saveComparison(selected, name),
    onSuccess: async () => {
      toast.success(t('compare.saved'));
      setName('');
      await queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const add = (code: string) => {
    if (selected.includes(code) || selected.length >= MAX_COMPARE_COUNTRIES) return;
    setCodes([...selected, code]);
  };

  const remove = (code: string) => setCodes(selected.filter((item) => item !== code));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('compare.title')}
        description={t('compare.subtitle')}
        actions={
          <>
            <Badge variant="muted">
              {selected.length} / {MAX_COMPARE_COUNTRIES}
            </Badge>
            {comparison.data?.cached ? <Badge variant="secondary">{t('common.cached')}</Badge> : null}
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <CountryPicker selected={selected} max={MAX_COMPARE_COUNTRIES} onSelect={add} />

          <div className="space-y-2">
            <span className="text-sm font-medium">{t('compare.title')}</span>
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('compare.empty')}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {selected.map((code, index) => {
                  const detail = selectedDetails[index]?.data?.data;
                  return (
                    <li
                      key={code}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-sm"
                    >
                      {detail ? (
                        <img src={detail.flag.png} alt="" width={20} height={14} className="h-3.5 w-5 rounded-sm object-cover" />
                      ) : null}
                      <span className="font-medium">{detail?.name ?? code}</span>
                      <button
                        type="button"
                        onClick={() => remove(code)}
                        aria-label={`${t('compare.remove')}: ${detail?.name ?? code}`}
                        className="rounded-full p-0.5 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {selected.length < MIN_COMPARE_COUNTRIES ? (
        <EmptyState
          title={t('compare.empty')}
          description={t('compare.subtitle')}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/explore">{t('explore.title')}</Link>
            </Button>
          }
        />
      ) : comparison.isLoading ? (
        <LoadingState />
      ) : comparison.isError || !comparison.data ? (
        <ErrorState error={comparison.error} onRetry={() => void comparison.refetch()} />
      ) : (
        <ComparisonResult
          result={comparison.data}
          metricId={metricId}
          onMetricChange={setMetricId}
          name={name}
          onNameChange={setName}
          onSave={() => save.mutate()}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function ComparisonResult({
  result,
  metricId,
  onMetricChange,
  name,
  onNameChange,
  onSave,
  saving,
}: {
  result: CompareResponse;
  metricId: string | null;
  onMetricChange: (id: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  onSave: () => void;
  saving: boolean;
}): React.JSX.Element {
  const { t } = useTranslation();
  const { countries, indicators, sources } = result.data;
  const activeMetric = indicators.find((indicator) => indicator.id === metricId) ?? indicators[0];

  const chartData = activeMetric
    ? countries
        .map((country) => ({
          label: country.name,
          value: country.metrics.find((metric) => metric.indicatorId === activeMetric.id)?.value ?? null,
        }))
        .filter((entry): entry is { label: string; value: number } => entry.value !== null)
    : [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{t('compare.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('compare.yearMismatch')}</p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48">
              <label htmlFor="saved-name" className="mb-1 block text-xs font-medium text-muted-foreground">
                {t('compare.saveName')}
              </label>
              <Input id="saved-name" value={name} onChange={(event) => onNameChange(event.target.value)} maxLength={80} />
            </div>
            <Button onClick={onSave} disabled={saving}>
              <Save aria-hidden="true" />
              {t('compare.save')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-4 font-medium text-muted-foreground">
                  {t('compare.metric')}
                </th>
                <th scope="col" className="py-2 pr-4 font-medium text-muted-foreground">
                  {t('compare.unit')}
                </th>
                {countries.map((country) => (
                  <th key={country.code} scope="col" className="py-2 pr-4 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <img src={country.flag.png} alt="" width={20} height={14} className="h-3.5 w-5 rounded-sm object-cover" />
                      {country.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <MetricRow
                label={t('country.population')}
                unit="people"
                countries={countries.map((country) => ({
                  code: country.code,
                  value: country.population,
                  year: country.populationYear,
                }))}
              />
              <MetricRow
                label={t('country.area')}
                unit="km²"
                countries={countries.map((country) => ({
                  code: country.code,
                  value: country.areaKm2,
                  year: null,
                }))}
              />
              <MetricRow
                label={t('country.density')}
                unit="/km²"
                countries={countries.map((country) => ({
                  code: country.code,
                  value: country.densityPerKm2,
                  year: null,
                }))}
              />
              {indicators.map((indicator) => (
                <MetricRow
                  key={indicator.id}
                  label={indicator.label}
                  unit={indicator.unit}
                  countries={countries.map((country) => {
                    const metric = country.metrics.find((entry) => entry.indicatorId === indicator.id);
                    return { code: country.code, value: metric?.value ?? null, year: metric?.year ?? null };
                  })}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {activeMetric ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <CardTitle>{activeMetric.label}</CardTitle>
            <div className="min-w-56">
              <label htmlFor="compare-metric" className="mb-1 block text-xs font-medium text-muted-foreground">
                {t('compare.metric')}
              </label>
              <Select id="compare-metric" value={activeMetric.id} onChange={(event) => onMetricChange(event.target.value)}>
                {indicators.map((indicator) => (
                  <option key={indicator.id} value={indicator.id}>
                    {indicator.label}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('common.na')}</p>
            ) : (
              <BarChart ariaLabel={activeMetric.label} data={chartData} unit={activeMetric.unit} />
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {t('common.source')}: {sources.map((source) => source.name).join(', ')}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function MetricRow({
  label,
  unit,
  countries,
}: {
  label: string;
  unit: string;
  countries: Array<{ code: string; value: number | null; year: string | number | null }>;
}): React.JSX.Element {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <th scope="row" className="py-2 pr-4 text-left font-medium">
        {label}
      </th>
      <td className="py-2 pr-4 text-muted-foreground">{unit}</td>
      {countries.map((entry) => (
        <td key={entry.code} className="py-2 pr-4 tabular-nums">
          {formatMetric(unit, entry.value)}
          {entry.year ? <span className="ml-1 text-xs text-muted-foreground">({entry.year})</span> : null}
        </td>
      ))}
    </tr>
  );
}

function parseCodes(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const part of raw.split(',')) {
    const code = part.trim().toUpperCase();
    if (!ISO3.test(code) || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes.slice(0, MAX_COMPARE_COUNTRIES);
}
