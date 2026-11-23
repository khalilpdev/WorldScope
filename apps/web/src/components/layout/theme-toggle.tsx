import { Moon, Sun } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';

export function ThemeToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const next = theme === 'dark' ? t('theme.light') : t('theme.dark');

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`${t('theme.toggle')}: ${next}`}
      title={`${t('theme.toggle')}: ${next}`}
    >
      {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}
