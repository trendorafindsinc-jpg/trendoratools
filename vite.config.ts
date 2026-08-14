import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/favicon-32.png',
        'icons/apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png'
      ],
      manifest: {
        name: 'TrendoraTools',
        short_name: 'Trendora',
        description: 'TrendoraTools by Trendora Inc. — Budget, Expenses & Savings under the LUCIA brand.',
        theme_color: '#07070A',
        background_color: '#07070A',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: './',
        scope: './',
        lang: 'en',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Cache the entire app shell so it works fully offline after first visit
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    target: 'es2020'
  }
});
