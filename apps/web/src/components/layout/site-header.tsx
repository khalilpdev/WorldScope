import { Globe2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

const links = [
  { to: '/', key: 'nav.dashboard' },
  { to: '/explore', key: 'nav.explore' },
  { to: '/compare', key: 'nav.compare' },
  { to: '/library', key: 'nav.library' },
] as const;

export function SiteHeader(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Globe2 className="size-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">{t('app.name')}</span>
            <span className="hidden text-[11px] text-muted-foreground sm:block">{t('app.tagline')}</span>
          </span>
        </NavLink>

        <nav aria-label="Primary" className="ml-auto hidden sm:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                    )
                  }
                >
                  {t(link.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto sm:ml-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
