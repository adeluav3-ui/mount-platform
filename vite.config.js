import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['logo.png', 'icons/logo192.png', 'icons/logo512.png'],
            manifest: {
                name: "Mount - Nigeria's Trusted Home Services",
                short_name: "Mount",
                description: "Nigeria's trusted home services marketplace connecting verified service professionals with homeowners",
                theme_color: "#10B981",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait-primary",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "icons/logo192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable"
                    },
                    {
                        src: "icons/logo512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable"
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'supabase-api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 // 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            },
            // CRITICAL FIX: Disable auto service worker registration
            injectRegister: null, // This prevents VitePWA from registering its own service worker
            devOptions: {
                enabled: false
            }
        })
    ],
    build: {
        rollupOptions: {
            input: {
                main: './index.html'
            }
        },
        sourcemap: true
    },
    server: {
        historyApiFallback: true,
        port: 3000,
        host: true
    },
    preview: {
        port: 3000,
        host: true
    }
})