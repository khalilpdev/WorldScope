import { useDeferredValue, useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

/**
 * Search box that adds a country to a comparison. It queries the list endpoint
 * and only offers codes that are not already selected.
 */
export function CountryPicker({
  selected,
  max,
  onSelect,
}: {
  selected: string[];
  max: number;
  onSelect: (code: string) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());

  const results = useQuery({
    queryKey: ['countries', 'picker', deferredSearch],
    queryFn: ({ signal }) => api.listCountries({ search: deferredSearch, limit: 8, sortBy: 'name' }, signal),
    enabled: deferredSearch.length >= 2 && selected.length < max,
  });

  const options = (results.data?.data ?? []).filter((country) => !selected.includes(country.code));

  return (
    <div className="space-y-2">
      <label htmlFor="compare-search" className="text-sm font-medium">
        {t('compare.add')}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="compare-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('compare.searchPlaceholder')}
          className="pl-9"
          disabled={selected.length >= max}
          autoComplete="off"
        />
      </div>
      {selected.length >= max ? (
        <p className="text-xs text-muted-foreground">{t('compare.limit', { max })}</p>
      ) : null}
      {deferredSearch.length >= 2 ? (
        <ul className="max-h-56 overflow-auto rounded-md border border-border bg-card p-1 shadow-sm">
          {results.isLoading ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('common.loading')}</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t('common.empty.title')}</li>
          ) : (
            options.map((country) => (
              <li key={country.code}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(country.code);
                    setSearch('');
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img src={country.flag.png} alt="" width={24} height={16} className="h-4 w-6 rounded-sm border border-border object-cover" />
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-xs text-muted-foreground">{country.code}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
