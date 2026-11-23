import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState, ErrorState } from '@/components/common/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { useTranslation } from '@/lib/i18n';

export function LibraryPage(): React.JSX.Element {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const favorites = useQuery({ queryKey: ['favorites'], queryFn: ({ signal }) => api.listFavorites(signal) });
  const comparisons = useQuery({ queryKey: ['comparisons'], queryFn: ({ signal }) => api.listComparisons(signal) });

  const favoriteDetails = useQueries({
    queries: (favorites.data?.data ?? []).map((favorite) => ({
      queryKey: ['country', favorite.countryCode],
      queryFn: ({ signal }: { signal: AbortSignal }) => api.getCountry(favorite.countryCode, signal),
    })),
  });

  const removeFavorite = useMutation({
    mutationFn: (code: string) => api.removeFavorite(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(t('country.removeFavorite'));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const removeComparison = useMutation({
    mutationFn: (id: string) => api.deleteComparison(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comparisons'] });
      toast.success(t('library.delete'));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t('library.title')} description={t('library.subtitle')} />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Star className="size-4" aria-hidden="true" />
            {t('library.favorites')}
          </CardTitle>
          {favorites.data ? <Badge variant="muted">{favorites.data.data.length}</Badge> : null}
        </CardHeader>
        <CardContent>
          {favorites.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          ) : favorites.isError ? (
            <ErrorState error={favorites.error} onRetry={() => void favorites.refetch()} />
          ) : (favorites.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              title={t('library.emptyFavorites')}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/explore">{t('explore.title')}</Link>
                </Button>
              }
            />
          ) : (
            <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
              {favorites.data?.data.map((favorite, index) => {
                const detail = favoriteDetails[index]?.data?.data;
                return (
                  <li
                    key={favorite.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    {detail ? (
                      <img src={detail.flag.png} alt="" width={40} height={28} className="h-7 w-10 rounded border border-border object-cover" />
                    ) : (
                      <Skeleton className="h-7 w-10" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/countries/${favorite.countryCode}`}
                        className="block truncate text-sm font-medium underline-offset-4 hover:underline"
                      >
                        {detail?.name ?? favorite.countryCode}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {favorite.countryCode} · {formatDateTime(favorite.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFavorite.mutate(favorite.countryCode)}
                      disabled={removeFavorite.isPending}
                      aria-label={`${t('library.delete')}: ${detail?.name ?? favorite.countryCode}`}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle>{t('library.savedComparisons')}</CardTitle>
          {comparisons.data ? <Badge variant="muted">{comparisons.data.data.length}</Badge> : null}
        </CardHeader>
        <CardContent>
          {comparisons.isLoading ? (
            <Skeleton className="h-20 w-full rounded-lg" />
          ) : comparisons.isError ? (
            <ErrorState error={comparisons.error} onRetry={() => void comparisons.refetch()} />
          ) : (comparisons.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              title={t('library.emptyComparisons')}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/compare">{t('compare.title')}</Link>
                </Button>
              }
            />
          ) : (
            <ul className="list-none space-y-2 p-0">
              {comparisons.data?.data.map((comparison) => (
                <li
                  key={comparison.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {comparison.name ?? t('library.unnamed')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {comparison.countryCodes.join(', ')} · {formatDateTime(comparison.updatedAt)}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/compare?codes=${comparison.countryCodes.join(',')}`}>
                      <ExternalLink aria-hidden="true" />
                      {t('compare.openSaved')}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeComparison.mutate(comparison.id)}
                    disabled={removeComparison.isPending}
                    aria-label={`${t('library.delete')}: ${comparison.name ?? t('library.unnamed')}`}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
