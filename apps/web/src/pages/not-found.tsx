import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

export function NotFoundPage(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t('notFound.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('notFound.description')}</p>
      </div>
      <Button asChild>
        <Link to="/">{t('notFound.home')}</Link>
      </Button>
    </div>
  );
}
