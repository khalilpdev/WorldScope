import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

/**
 * The MVP ships English only. The dictionary is the single place to add a new
 * locale later; components never hard-code user-facing copy.
 */
const en = {
  'app.name': 'WorldScope',
  'app.tagline': 'Global Data Intelligence',
  'nav.dashboard': 'Dashboard',
  'nav.explore': 'Explore',
  'nav.compare': 'Compare',
  'nav.library': 'Library',
  'nav.skipToContent': 'Skip to content',
  'theme.toggle': 'Toggle theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  'dashboard.title': 'Global overview',
  'dashboard.subtitle':
    'Public country data aggregated from the country catalogue, the World Bank and Open-Meteo.',
  'dashboard.stat.countries': 'Countries',
  'dashboard.stat.population': 'Combined population',
  'dashboard.stat.regions': 'Regions',
  'dashboard.stat.subregions': 'Subregions',
  'dashboard.highlights': 'Most populous countries',
  'dashboard.regions': 'Countries per region',
  'dashboard.populationByRegion': 'Population by region',
  'dashboard.dataYear': 'Data year {year}',
  'dashboard.viewAll': 'Explore all countries',

  'explore.title': 'Explore countries',
  'explore.subtitle': 'Search, filter and sort the full country catalogue.',
  'explore.search': 'Search countries',
  'explore.searchPlaceholder': 'e.g. Brazil, Japan, FRA',
  'explore.region': 'Region',
  'explore.subregion': 'Subregion',
  'explore.sortBy': 'Sort by',
  'explore.order': 'Order',
  'explore.allRegions': 'All regions',
  'explore.allSubregions': 'All subregions',
  'explore.sort.name': 'Name',
  'explore.sort.population': 'Population',
  'explore.sort.area': 'Area',
  'explore.sort.density': 'Density',
  'explore.order.asc': 'Ascending',
  'explore.order.desc': 'Descending',
  'explore.results': '{count} countries',
  'explore.clear': 'Clear filters',
  'explore.page': 'Page {page} of {total}',

  'country.capital': 'Capital',
  'country.region': 'Region',
  'country.subregion': 'Subregion',
  'country.population': 'Population',
  'country.area': 'Area',
  'country.density': 'Density',
  'country.languages': 'Languages',
  'country.currencies': 'Currencies',
  'country.coordinates': 'Coordinates',
  'country.borders': 'Borders',
  'country.incomeLevel': 'Income level',
  'country.indicators': 'Economic indicators',
  'country.weather': 'Weather in the capital',
  'country.weatherUnavailable': 'Weather is unavailable',
  'country.forecast': 'Seven-day forecast',
  'country.feelsLike': 'Feels like',
  'country.humidity': 'Humidity',
  'country.wind': 'Wind',
  'country.precipitation': 'Precipitation',
  'country.sources': 'Sources and freshness',
  'country.sourceUpdated': 'Retrieved {date}',
  'country.addFavorite': 'Add to favourites',
  'country.removeFavorite': 'Remove from favourites',
  'country.compare': 'Compare this country',
  'country.back': 'Back to countries',
  'country.populationYear': 'Population reference year {year}',
  'country.noIndicators': 'No indicator series are available for this country yet.',
  'country.nativeName': 'Native name',
  'country.officialName': 'Official name',

  'compare.title': 'Compare countries',
  'compare.subtitle': 'Select two to four countries. Each metric keeps a single unit.',
  'compare.add': 'Add a country',
  'compare.searchPlaceholder': 'Search by name or ISO code',
  'compare.empty': 'Choose at least two countries to compare.',
  'compare.limit': 'You can compare up to {max} countries.',
  'compare.metric': 'Metric',
  'compare.unit': 'Unit',
  'compare.yearMismatch': 'Values may refer to different years; the year is shown per country.',
  'compare.save': 'Save comparison',
  'compare.saved': 'Comparison saved',
  'compare.saveName': 'Name (optional)',
  'compare.remove': 'Remove',
  'compare.openSaved': 'Open',

  'library.title': 'Your library',
  'library.subtitle':
    'Favourites and saved comparisons are stored in this browser and linked to an anonymous identifier. They are not private.',
  'library.favorites': 'Favourite countries',
  'library.savedComparisons': 'Saved comparisons',
  'library.emptyFavorites': 'No favourites yet. Add countries from their detail page.',
  'library.emptyComparisons': 'No saved comparisons yet. Build one on the compare page.',
  'library.delete': 'Delete',
  'library.unnamed': 'Untitled comparison',
  'library.codes': '{count} countries',

  'common.loading': 'Loading…',
  'common.error.title': 'Something went wrong',
  'common.error.retry': 'Try again',
  'common.error.notFound': 'The requested resource does not exist.',
  'common.empty.title': 'No data',
  'common.empty.description': 'There is nothing to display for these filters.',
  'common.cached': 'Served from cache',
  'common.live': 'Fetched just now',
  'common.previous': 'Previous',
  'common.next': 'Next',
  'common.of': 'of',
  'common.na': 'Not available',
  'common.source': 'Source',
  'common.updated': 'Updated',
  'common.close': 'Close',
  'common.viewDetails': 'View details',
  'common.dismiss': 'Dismiss',

  'notFound.title': 'Page not found',
  'notFound.description': 'The page you are looking for does not exist.',
  'notFound.home': 'Go to dashboard',

  'footer.sources':
    'Data: mledoze/countries (ODbL 1.0), World Bank Open Data (CC BY 4.0), Open-Meteo (CC BY 4.0), flags by flagcdn.com.',
  'footer.built': 'Open-source portfolio project.',
} as const;

export type TranslationKey = keyof typeof en;
type Locale = 'en';

const dictionaries: Record<Locale, Record<string, string>> = { en };
const supportedLocales: Locale[] = ['en'];

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  locales: Locale[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const locale: Locale = 'en';

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = dictionaries[locale][key] ?? en[key] ?? key;
      if (!vars) return template;
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template,
      );
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, t, locales: supportedLocales }),
    [locale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used inside I18nProvider');
  return context;
}
