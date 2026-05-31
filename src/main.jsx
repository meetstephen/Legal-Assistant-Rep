import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './lexi/components/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register the service worker for offline support (production builds only).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is a progressive enhancement */
    });
  });
}

// Keep-alive: prevent the app from sleeping due to inactivity.
// Sends a tiny self-ping every 4 minutes so the tab stays active and
// connections (Supabase realtime, service worker) don't drop.
(function keepAlive() {
  const INTERVAL = 4 * 60 * 1000; // 4 minutes
  setInterval(() => {
    // Touch the DOM to signal the browser the tab is active
    document.dispatchEvent(new Event('lexi:keepalive'));
    // If service worker is registered, ping it to stay warm
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'keepalive' });
    }
  }, INTERVAL);
})();
