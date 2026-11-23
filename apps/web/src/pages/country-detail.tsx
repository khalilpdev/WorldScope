import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CloudSun,
  Droplets,
  Languages,
  MapPin,
  Scale,
  Thermometer,
  Users,
  Wind,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { LineChart } from '@/components/charts/line-chart';
import { ErrorState } from '@/components/common/query-state';
import { SourceList } from '@/components/common/source-list';
import { FavoriteButton } from '@/components/country/favorite-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { formatArea, formatDate, formatDecimal, formatPopulation } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

export function CountryDetailPage(): React.JSX.Element {
  const { t } = useTranslation();
  const params = useParams<{ code: string }>();
  const code = (params.code ?? '').toUpperCase();

  const detail = useQuery({
    queryKey: ['country', code],
    queryFn: ({ signal }) => api.getCountry(code, signal),
    enabled: code.length === 3,
  });
  const indicators = useQuery({
    queryKey: ['indicators', code],
    queryFn: ({ signal }) => api.getIndicators(code, 12, signal),
    enabled: code.length === 3,
  });
  const weather = useQuery({
    queryKey: ['weather', code],
    queryFn: ({ signal }) => api.getWeather(code, signal),
    enabled: code.length === 3,
  });

  const [seriesId, setSeriesId] = useState<string | null>(null);

  if (detail.isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-52 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      </div>
    );
  }

  const country = detail.data.data;
  const series = indicators.data?.data.series ?? [];
  const activeSeries = series.find((item) => item.id === seriesId) ?? series[0];
  const weatherData = weather.data?.data;
  const sources = [...(country.sources ?? []), ...(weatherData?.sources ?? [])].filter(
    (source, index, list) => list.findIndex((entry) => entry.id === source.id) === index,
  );

  return (
    <div className="space-y-6">
      <BackLink />

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <img
            src={country.flag.svg}
            alt={`${country.name} flag`}
            className="h-20 w-32 rounded-lg border border-border object-cover"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{country.name}</h1>
              <Badge variant="outline">{country.code}</Badge>
              <Badge variant="secondary">{country.region}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('country.officialName')}: {country.officialName}
              {country.nativeName ? ` · ${t('country.nativeName')}: ${country.nativeName}` : ''}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('country.capital')}: {country.capital ?? t('common.na')} · {country.subregion ?? t('common.na')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FavoriteButton countryCode={country.code} />
            <Button variant="outline" asChild>
              <Link to={`/compare?codes=${country.code}`}>{t('country.compare')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-label={t('country.population')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact icon={<Users className="size-4" aria-hidden="true" />} label={t('country.population')} value={formatPopulation(country.population)} hint={country.populationYear ? t('country.populationYear', { year: country.populationYear }) : undefined} />
        <Fact icon={<Scale className="size-4" aria-hidden="true" />} label={t('country.area')} value={formatArea(country.areaKm2)} />
        <Fact icon={<MapPin className="size-4" aria-hidden="true" />} label={t('country.density')} value={country.densityPerKm2 === null ? t('common.na') : `${formatDecimal(country.densityPerKm2)} /km²`} />
        <Fact icon={<Languages className="size-4" aria-hidden="true" />} label={t('country.languages')} value={country.languages.map((language) => language.name).join(', ') || t('common.na')} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('country.indicators')}</CardTitle>
            {indicators.data ? (
              <Badge variant="muted">{indicators.data.cached ? t('common.cached') : t('common.live')}</Badge>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {indicators.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : indicators.isError ? (
              <ErrorState error={indicators.error} onRetry={() => void indicators.refetch()} />
            ) : series.length === 0 || !activeSeries ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('country.noIndicators')}</p>
            ) : (
              <>
                <div className="max-w-sm">
                  <label htmlFor="indicator" className="mb-1 block text-xs font-medium text-muted-foreground">
                    {t('country.indicators')}
                  </label>
                  <Select
                    id="indicator"
                    value={activeSeries.id}
                    onChange={(event) => setSeriesId(event.target.value)}
                  >
                    {series.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <LineChart
                  ariaLabel={activeSeries.label}
                  unit={activeSeries.unit}
                  series={[
                    {
                      name: activeSeries.label,
                      points: [...activeSeries.points].reverse(),
                    },
                  ]}
                />
                <p className="text-xs text-muted-foreground">{activeSeries.description}</p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudSun className="size-4" aria-hidden="true" />
                {t('country.weather')}
              </CardTitle>
              {weatherData?.capital ? <p className="text-sm text-muted-foreground">{weatherData.capital}</p> : null}
            </CardHeader>
            <CardContent>
              {weather.isLoading ? (
                <Skeleton className="h-36 w-full" />
              ) : weather.isError ? (
                <p className="text-sm text-muted-foreground">{t('country.weatherUnavailable')}</p>
              ) : !weatherData?.current ? (
                <p className="text-sm text-muted-foreground">
                  {weatherData?.unavailableReason ?? t('country.weatherUnavailable')}
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-3xl font-semibold tabular-nums">
                    {weatherData.current.temperatureC === null ? '—' : `${formatDecimal(weatherData.current.temperatureC)}°C`}
                  </p>
                  <p className="text-sm text-muted-foreground">{weatherData.current.description}</p>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <WeatherFact icon={<Thermometer className="size-3.5" aria-hidden="true" />} label={t('country.feelsLike')} value={weatherData.current.apparentTemperatureC === null ? '—' : `${formatDecimal(weatherData.current.apparentTemperatureC)}°C`} />
                    <WeatherFact icon={<Droplets className="size-3.5" aria-hidden="true" />} label={t('country.humidity')} value={weatherData.current.humidityPercent === null ? '—' : `${formatDecimal(weatherData.current.humidityPercent)}%`} />
                    <WeatherFact icon={<Wind className="size-3.5" aria-hidden="true" />} label={t('country.wind')} value={weatherData.current.windSpeedKmh === null ? '—' : `${formatDecimal(weatherData.current.windSpeedKmh)} km/h`} />
                    <WeatherFact icon={<Droplets className="size-3.5" aria-hidden="true" />} label={t('country.precipitation')} value={weatherData.current.precipitationMm === null ? '—' : `${formatDecimal(weatherData.current.precipitationMm)} mm`} />
                  </dl>
                </div>
              )}
            </CardContent>
          </Card>

          {weatherData?.daily.length ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('country.forecast')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {weatherData.daily.slice(0, 7).map((day) => (
                    <li key={day.date} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{formatDate(day.date)}</span>
                      <span className="tabular-nums">
                        {day.temperatureMaxC === null ? '—' : `${formatDecimal(day.temperatureMaxC)}°`}
                        {' / '}
                        {day.temperatureMinC === null ? '—' : `${formatDecimal(day.temperatureMinC)}°`}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('country.currencies')}</CardTitle>
          </CardHeader>
          <CardContent>
            {country.currencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('common.na')}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {country.currencies.map((currency) => (
                  <li key={currency.code}>
                    <span className="font-medium">{currency.code}</span> — {currency.name}
                    {currency.symbol ? ` (${currency.symbol})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('country.borders')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {country.borders.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('common.na')}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {country.borders.map((border) => (
                  <li key={border}>
                    <Link
                      to={`/countries/${border}`}
                      className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
                    >
                      {border}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {t('country.incomeLevel')}: {country.incomeLevel ?? t('common.na')}
              {country.worldBankRegion ? ` · ${country.worldBankRegion}` : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('country.coordinates')}:{' '}
              {country.coordinates
                ? `${formatDecimal(country.coordinates.lat)}, ${formatDecimal(country.coordinates.lng)}`
                : t('common.na')}
            </p>
          </CardContent>
        </Card>
      </section>

      <SourceList sources={sources} cached={detail.data.cached} />
    </div>
  );
}

function BackLink(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Link
      to="/explore"
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t('country.back')}
    </Link>
  );
}

function Fact({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function WeatherFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
