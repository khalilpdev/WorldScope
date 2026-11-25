// Explicit re-exports keep the CommonJS build's named exports statically
// visible to Vite's CJS-to-ESM interop (`export *` emits a dynamic __exportStar
// loop, which breaks named imports such as THEME_STORAGE_KEY in the browser).

export {
  CACHE_TTL_SECONDS,
  CLIENT_ID_STORAGE_KEY,
  COMPARISON_INDICATOR_IDS,
  DEFAULT_PAGE_SIZE,
  INDICATORS,
  MAX_COMPARE_COUNTRIES,
  MAX_PAGE_SIZE,
  MIN_COMPARE_COUNTRIES,
  SORTABLE_FIELDS,
  THEME_STORAGE_KEY,
  WORLD_BANK_AGGREGATE_NOTE,
} from './constants';
export type {
  IndicatorDefinition,
  IndicatorId,
  SortableField,
  SortOrder,
} from './constants';

export type {
  ApiErrorBody,
  CompareResponse,
  ComparisonCountry,
  ComparisonMetric,
  Coordinates,
  CountryDetail,
  CountryDetailResponse,
  CountryFacets,
  CountryIndicatorsResponse,
  CountrySummary,
  CurrentWeather,
  DailyForecast,
  DataSourceInfo,
  FavoritesResponse,
  FavoriteCountryRecord,
  FlagRef,
  HealthDependency,
  HealthResponse,
  IndicatorPoint,
  IndicatorSeries,
  LanguageInfo,
  OverviewResponse,
  PaginatedCountries,
  PaginationMeta,
  RegionAggregate,
  SavedComparisonsResponse,
  SavedComparisonRecord,
  WeatherResponse,
  CurrencyInfo,
} from './types';
