import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { App } from './App';
import { I18nProvider } from './lib/i18n';
import { queryClient } from './lib/query-client';
import { ThemeProvider } from './lib/theme';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root was not found in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
            <Toaster position="bottom-right" richColors closeButton />
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);
