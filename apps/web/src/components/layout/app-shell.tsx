import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

export function AppShell(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t('nav.skipToContent')}
      </a>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-10">
        <Outlet />
      </main>
      <SiteFooter />
      <nav aria-label="Mobile" className="border-t border-border bg-card sm:hidden">
        <ul className="flex items-center justify-around py-2 text-xs">
          <MobileLink to="/" label={t('nav.dashboard')} />
          <MobileLink to="/explore" label={t('nav.explore')} />
          <MobileLink to="/compare" label={t('nav.compare')} />
          <MobileLink to="/library" label={t('nav.library')} />
        </ul>
      </nav>
    </div>
  );
}

function MobileLink({ to, label }: { to: string; label: string }): React.JSX.Element {
  return (
    <li>
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          `rounded-md px-3 py-2 font-medium ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`
        }
      >
        {label}
      </NavLink>
    </li>
  );
}
