import { Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api, errorMessage } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function FavoriteButton({ countryCode }: { countryCode: string }): React.JSX.Element {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: ({ signal }) => api.listFavorites(signal) });
  const isFavorite = favorites.data?.data.some((item) => item.countryCode === countryCode) ?? false;

  const mutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await api.removeFavorite(countryCode);
      } else {
        await api.addFavorite(countryCode);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(isFavorite ? t('country.removeFavorite') : t('country.addFavorite'));
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Button
      variant={isFavorite ? 'secondary' : 'outline'}
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending || favorites.isLoading}
      aria-pressed={isFavorite}
    >
      <Star
        aria-hidden="true"
        className={cn(isFavorite && 'fill-amber-400 text-amber-500')}
      />
      {isFavorite ? t('country.removeFavorite') : t('country.addFavorite')}
    </Button>
  );
}
