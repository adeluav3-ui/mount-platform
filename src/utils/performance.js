// src/utils/performance.js - SIMPLIFIED VERSION WITHOUT WEB-VITALS
import { trackEvent } from './ga4';

// Simple performance monitoring using browser APIs
export const initPerformanceTracking = () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('🛠️ Performance tracking disabled in development');
        return;
    }

    console.log('📊 Initializing simplified performance tracking...');

    // Track page load time
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const timing = performance.getEntriesByType('navigation')[0];
                if (timing) {
                    const loadTime = timing.loadEventEnd - timing.fetchStart;
                    const pageUrl = window.location.pathname;

                    trackEvent('Performance', 'PageLoad', pageUrl, Math.round(loadTime));
                    console.log('📊 Page Load Time:', Math.round(loadTime), 'ms');

                    // Track Core Web Vitals-like metrics
                    trackFPAndFCP();
                    trackLCP();
                    trackCLS();
                }
            }, 1000);
        });
    }
};

// Track First Paint and First Contentful Paint
const trackFPAndFCP = () => {
    if ('performance' in window) {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
                trackEvent('Performance', 'FirstPaint', window.location.pathname, Math.round(entry.startTime));
            }
            if (entry.name === 'first-contentful-paint') {
                trackEvent('Performance', 'FirstContentfulPaint', window.location.pathname, Math.round(entry.startTime));
            }
        });
    }
};

// Track Largest Contentful Paint (simplified)
const trackLCP = () => {
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];

                trackEvent('Performance', 'LargestContentfulPaint', window.location.pathname, Math.round(lastEntry.renderTime || lastEntry.loadTime));
            });

            observer.observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {
            console.log('LCP tracking not supported:', e);
        }
    }
};

// Track Cumulative Layout Shift (simplified)
const trackCLS = () => {
    if ('PerformanceObserver' in window) {
        try {
            let clsValue = 0;

            const observer = new PerformanceObserver((entryList) => {
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }

                // Report CLS when page is hidden (user navigating away)
                if (document.visibilityState === 'hidden') {
                    trackEvent('Performance', 'CumulativeLayoutShift', window.location.pathname, clsValue);
                }
            });

            observer.observe({ type: 'layout-shift', buffered: true });
        } catch (e) {
            console.log('CLS tracking not supported:', e);
        }
    }
};

// Manual performance check for page loads
export const trackPageLoad = () => {
    if ('performance' in window) {
        const timing = performance.getEntriesByType('navigation')[0];
        if (timing) {
            const loadTime = timing.loadEventEnd - timing.fetchStart;
            const pageUrl = window.location.pathname;

            console.log('⏱️ PageLoad:', Math.round(loadTime), 'ms on', pageUrl);

            if (process.env.NODE_ENV === 'production') {
                trackEvent('Performance', 'PageLoad', pageUrl, Math.round(loadTime));
            }
        }
    }
};

// Simple performance logger for development
export const logPerformance = (metricName, value, page = window.location.pathname) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        metric: metricName,
        value,
        page,
        userAgent: navigator.userAgent
    };

    // Store in localStorage for debugging (max 50 entries)
    try {
        const logs = JSON.parse(localStorage.getItem('perf_logs') || '[]');
        logs.unshift(logEntry);
        if (logs.length > 50) logs.pop();
        localStorage.setItem('perf_logs', JSON.stringify(logs));
    } catch (e) {
        console.error('Failed to log performance:', e);
    }

    console.log(`⏱️ ${metricName}: ${value}ms on ${page}`);
};