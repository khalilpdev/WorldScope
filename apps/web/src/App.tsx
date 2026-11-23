import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/app-shell';
import { ComparePage } from './pages/compare';
import { CountryDetailPage } from './pages/country-detail';
import { DashboardPage } from './pages/dashboard';
import { ExplorePage } from './pages/explore';
import { LibraryPage } from './pages/library';
import { NotFoundPage } from './pages/not-found';

export function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="countries/:code" element={<CountryDetailPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="library" element={<LibraryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
