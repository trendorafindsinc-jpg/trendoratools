import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initTheme } from './lib/theme';
import { analytics } from './lib/analytics';
import { installAnalyticsStoreTracking } from './lib/analytics-store';
import { initNativeShell } from './lib/native';

initTheme();
installAnalyticsStoreTracking();
void initNativeShell();

function AnalyticsBootstrap() {
  useEffect(() => analytics.boot(), []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AnalyticsBootstrap />
    <App />
  </React.StrictMode>
);
