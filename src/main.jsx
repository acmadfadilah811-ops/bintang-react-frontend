import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App.jsx';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^https:\/\/bintang-adv\.duckdns\.org\/api/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {sentryDsn ? (
      <Sentry.ErrorBoundary
        fallback={
          <div className="p-6 max-w-md mx-auto my-10 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center space-y-3 shadow-sm">
            <h2 className="font-bold text-base">Terjadi Kesalahan Sistem</h2>
            <p className="text-xs text-red-600">
              Aplikasi mendeteksi error yang tidak terduga. Silakan muat ulang halaman atau coba
              lagi nanti.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        }
      >
        <App />
      </Sentry.ErrorBoundary>
    ) : (
      <App />
    )}
  </StrictMode>
);
