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
                }
            }, 1000);
        });
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