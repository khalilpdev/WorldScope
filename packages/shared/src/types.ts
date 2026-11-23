export interface DataSourceInfo {
  /** Stable identifier, e.g. "country-catalog", "world-bank", "open-meteo". */
  id: string;
  name: string;
  url: string;
  /** ISO 8601 timestamp of when the upstream payload was retrieved. */
  retrievedAt: string;
  license?: string;
  note?: string;
}

export interface FlagRef {
  emoji: string | null;
  png: string;
  svg: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string | null;
}

export interface LanguageInfo {
  /** ISO 639-3 code when provided by the dataset. */
  code: string;
  name: string;
}

export interface CountrySummary {
  /** ISO 3166-1 alpha-3 code. */
  code: string;
  alpha2: string;
  name: string;
  officialName: string;
  capital: string | null;
  region: string;
  subregion: string | null;
  nativeName: string | null;
  population: number | null;
  /** Reference year of the population value; null when unavailable. */
  populationYear: string | null;
  areaKm2: number | null;
  /** People per square kilometre; null when population or area is missing. */
  densityPerKm2: number | null;
  flag: FlagRef;
}

export interface CountryDetail extends CountrySummary {
  coordinates: Coordinates | null;
  languages: LanguageInfo[];
  currencies: CurrencyInfo[];
  /** ISO alpha-3 codes of bordering countries. */
  borders: string[];
  incomeLevel: string | null;
  /** World Bank region name, when the country is covered by the World Bank. */
  worldBankRegion: string | null;
  sources: DataSourceInfo[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CountryFacets {
  regions: string[];
  subregions: string[];
}

export interface PaginatedCountries {
  data: CountrySummary[];
  meta: PaginationMeta;
  /** Filter options derived from the full catalogue, not just the current page. */
  facets: CountryFacets;
  sources: DataSourceInfo[];
  /** True when the response was served from cache. */
  cached: boolean;
}

export interface CountryDetailResponse {
  data: CountryDetail;
  cached: boolean;
}

export interface IndicatorPoint {
  year: number;
  value: number | null;
}

export interface IndicatorSeries {
  id: string;
  label: string;
  unit: string;
  description: string;
  /** Newest year first. Missing years are represented with value: null. */
  points: IndicatorPoint[];
}

export interface CountryIndicatorsResponse {
  data: {
    code: string;
    countryName: string;
    series: IndicatorSeries[];
    sources: DataSourceInfo[];
  };
  cached: boolean;
}

export interface CurrentWeather {
  time: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPercent: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  weatherCode: number | null;
  description: string;
}

export interface DailyForecast {
  date: string;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  precipitationMm: number | null;
  weatherCode: number | null;
  description: string;
}

export interface WeatherResponse {
  data: {
    code: string;
    countryName: string;
    capital: string | null;
    coordinates: Coordinates | null;
    timezone: string | null;
    current: CurrentWeather | null;
    daily: DailyForecast[];
    sources: DataSourceInfo[];
    /** Explains why weather is unavailable, e.g. missing capital coordinates. */
    unavailableReason: string | null;
  };
  cached: boolean;
}

export interface ComparisonMetric {
  indicatorId: string;
  label: string;
  unit: string;
  value: number | null;
  year: number | null;
}

export interface ComparisonCountry {
  code: string;
  name: string;
  flag: FlagRef;
  population: number | null;
  populationYear: string | null;
  areaKm2: number | null;
  densityPerKm2: number | null;
  metrics: ComparisonMetric[];
}

export interface CompareResponse {
  data: {
    countries: ComparisonCountry[];
    /** Indicators where at least one selected country has a value. */
    indicators: Array<{ id: string; label: string; unit: string }>;
    sources: DataSourceInfo[];
  };
  cached: boolean;
}

export interface RegionAggregate {
  region: string;
  countryCount: number;
  population: number | null;
}

export interface OverviewResponse {
  data: {
    totals: {
      countries: number;
      regions: number;
      subregions: number;
      population: number | null;
      populationYear: string | null;
    };
    regions: RegionAggregate[];
    highlights: CountrySummary[];
  };
  sources: DataSourceInfo[];
  cached: boolean;
}

export interface HealthDependency {
  status: 'up' | 'down' | 'disabled';
  latencyMs: number | null;
  driver: string;
  detail?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  dependencies: {
    database: HealthDependency;
    cache: HealthDependency;
  };
}

export interface FavoriteCountryRecord {
  id: string;
  countryCode: string;
  createdAt: string;
}

export interface SavedComparisonRecord {
  id: string;
  name: string | null;
  countryCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FavoritesResponse {
  data: FavoriteCountryRecord[];
}

export interface SavedComparisonsResponse {
  data: SavedComparisonRecord[];
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  /** Request path that produced the error. */
  path: string;
  timestamp: string;
}
