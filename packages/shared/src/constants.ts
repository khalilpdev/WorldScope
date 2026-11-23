/**
 * Values shared by the API and the web client so both sides agree on labels,
 * units and limits without duplicating constants.
 */

export const MAX_COMPARE_COUNTRIES = 4;
export const MIN_COMPARE_COUNTRIES = 2;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Cache TTLs in seconds. Overridable through environment variables in the API. */
export const CACHE_TTL_SECONDS = {
  catalog: 24 * 60 * 60,
  indicators: 24 * 60 * 60,
  weather: 30 * 60,
} as const;

export interface IndicatorDefinition {
  /** World Bank indicator code. */
  id: string;
  label: string;
  shortLabel: string;
  unit: string;
  description: string;
}

/**
 * Every indicator is expressed in a single unit per series, which is what makes
 * cross-country comparison safe. GDP and population are absolute values; the
 * remaining series are rates or per-capita values.
 */
export const INDICATORS = [
  {
    id: 'SP.POP.TOTL',
    label: 'Population',
    shortLabel: 'Population',
    unit: 'people',
    description: 'Total population, de facto definition.',
  },
  {
    id: 'NY.GDP.MKTP.CD',
    label: 'GDP (current US$)',
    shortLabel: 'GDP',
    unit: 'current US$',
    description: 'Gross domestic product at purchasers’ prices, current US dollars.',
  },
  {
    id: 'NY.GDP.PCAP.CD',
    label: 'GDP per capita (current US$)',
    shortLabel: 'GDP per capita',
    unit: 'current US$',
    description: 'Gross domestic product divided by midyear population, current US dollars.',
  },
  {
    id: 'SL.UEM.TOTL.ZS',
    label: 'Unemployment rate',
    shortLabel: 'Unemployment',
    unit: '% of labour force',
    description: 'Share of the labour force that is without work but available for and seeking employment.',
  },
  {
    id: 'FP.CPI.TOTL.ZG',
    label: 'Inflation, consumer prices',
    shortLabel: 'Inflation',
    unit: 'annual %',
    description: 'Annual percentage change in the consumer price index.',
  },
] as const satisfies readonly IndicatorDefinition[];

export type IndicatorId = (typeof INDICATORS)[number]['id'];

/** Indicators compared side by side; all share the same unit per metric. */
export const COMPARISON_INDICATOR_IDS = [
  'NY.GDP.PCAP.CD',
  'NY.GDP.MKTP.CD',
  'SL.UEM.TOTL.ZS',
  'FP.CPI.TOTL.ZG',
] as const satisfies readonly IndicatorId[];

export const SORTABLE_FIELDS = ['name', 'population', 'area', 'density'] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];

export type SortOrder = 'asc' | 'desc';

export const THEME_STORAGE_KEY = 'worldscope-theme';
export const CLIENT_ID_STORAGE_KEY = 'worldscope-client-id';

/**
 * World Bank aggregates (regions, income groups) are returned alongside real
 * countries. They are filtered out by requiring a valid ISO 3166-1 alpha-3 code
 * present in the country catalogue, so this list only documents the intent.
 */
export const WORLD_BANK_AGGREGATE_NOTE =
  'World Bank responses include regional aggregates; WorldScope keeps only codes that exist in the ISO country catalogue.';
