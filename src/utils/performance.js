// src/utils/performance.js
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';
import { trackEvent } from './ga4';

// Performance thresholds (Google's Core Web Vitals targets)
const PERFORMANCE_THRESHOLDS = {
    CLS_GOOD: 0.1,    // Cumulative Layout Shift (should be < 0.1)
    LCP_GOOD: 2500,   // Largest Contentful Paint (should be < 2.5s)
    FID_GOOD: 100,    // First Input Delay (should be < 100ms)
    FCP_GOOD: 1800,   // First Contentful Paint (should be < 1.8s)
    TTFB_GOOD: 800,   // Time to First Byte (should be < 800ms)
};

// Track performance metrics
export const initPerformanceTracking = () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('🛠️ Performance tracking disabled in development');
        return;
    }

    console.log('📊 Initializing performance tracking...');

    // Track Largest Contentful Paint (LCP)
    onLCP((metric) => {
        const pageUrl = window.location.pathname;
        const performance = metric.value < PERFORMANCE_THRESHOLDS.LCP_GOOD ? 'good' : 'poor';

        trackEvent('Performance', 'LCP', `${performance} - ${pageUrl}`, Math.round(metric.value));

        console.log('📊 LCP:', {
            value: metric.value,
            rating: performance,
            page: pageUrl
        });
    });

    // Track Cumulative Layout Shift (CLS)
    onCLS((metric) => {
        const pageUrl = window.location.pathname;
        const performance = metric.value < PERFORMANCE_THRESHOLDS.CLS_GOOD ? 'good' : 'poor';

        trackEvent('Performance', 'CLS', `${performance} - ${pageUrl}`, metric.value);

        console.log('📊 CLS:', {
            value: metric.value,
            rating: performance,
            page: pageUrl
        });
    });

    // Track First Input Delay (FID)
    onFID((metric) => {
        const pageUrl = window.location.pathname;
        const performance = metric.value < PERFORMANCE_THRESHOLDS.FID_GOOD ? 'good' : 'poor';

        trackEvent('Performance', 'FID', `${performance} - ${pageUrl}`, Math.round(metric.value));

        console.log('📊 FID:', {
            value: metric.value,
            rating: performance,
            page: pageUrl
        });
    });

    // Track First Contentful Paint (FCP)
    onFCP((metric) => {
        const pageUrl = window.location.pathname;
        const performance = metric.value < PERFORMANCE_THRESHOLDS.FCP_GOOD ? 'good' : 'poor';

        trackEvent('Performance', 'FCP', `${performance} - ${pageUrl}`, Math.round(metric.value));

        console.log('📊 FCP:', {
            value: metric.value,
            rating: performance,
            page: pageUrl
        });
    });

    // Track Time to First Byte (TTFB)
    onTTFB((metric) => {
        const pageUrl = window.location.pathname;
        const performance = metric.value < PERFORMANCE_THRESHOLDS.TTFB_GOOD ? 'good' : 'poor';

        trackEvent('Performance', 'TTFB', `${performance} - ${pageUrl}`, Math.round(metric.value));

        console.log('📊 TTFB:', {
            value: metric.value,
            rating: performance,
            page: pageUrl
        });
    });
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

// Manual performance check for page loads
export const trackPageLoad = () => {
    if ('performance' in window) {
        const timing = performance.getEntriesByType('navigation')[0];
        if (timing) {
            const loadTime = timing.loadEventEnd - timing.fetchStart;
            const pageUrl = window.location.pathname;

            logPerformance('PageLoad', Math.round(loadTime), pageUrl);

            if (process.env.NODE_ENV === 'production') {
                trackEvent('Performance', 'PageLoad', pageUrl, Math.round(loadTime));
            }
        }
    }
};