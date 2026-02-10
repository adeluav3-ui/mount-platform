// src/utils/ga4.js - UPDATED VERSION WITHOUT REACT-GA4

// Track page views
export const trackPageView = (path) => {
    if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('config', 'G-26F05C9YMS', {
            page_path: path,
            page_title: document.title
        });
        console.log('📊 GA4 Pageview:', path);
    }
};

// Track events (signups, job posts, etc.)
export const trackEvent = (category, action, label = '', value = 0) => {
    if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value
        });
        console.log('🎯 GA4 Event:', { category, action, label, value });
    }
};

// Track exceptions/errors
export const trackError = (description, fatal = false) => {
    if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('event', 'exception', {
            description: description,
            fatal: fatal
        });
    }
};

// ✅ SEO-SPECIFIC EVENT TRACKING

// Track clicks from SEO pages to app
export const trackSEOClick = (sourcePage, buttonType) => {
    trackEvent('SEO Navigation', 'Click to App', `${sourcePage} - ${buttonType}`);
};

// Track signup from SEO traffic
export const trackSEOSignup = (userType, sourcePage) => {
    trackEvent('SEO Conversion', 'Signup', `${userType} from ${sourcePage}`, 1);
};

// Track job post start from SEO
export const trackSEOJobStart = (serviceType, sourcePage) => {
    trackEvent('SEO Conversion', 'Job Post Started', `${serviceType} from ${sourcePage}`);
};

// Track button clicks on SEO pages
export const trackSEOButtonClick = (buttonText, pageUrl) => {
    trackEvent('SEO Engagement', 'Button Click', `${buttonText} on ${pageUrl}`);
};

// Track scroll depth on SEO pages
export const trackScrollDepth = (depth, pageUrl) => {
    if (depth === 25 || depth === 50 || depth === 75 || depth === 90) {
        trackEvent('SEO Engagement', 'Scroll Depth', `${depth}% on ${pageUrl}`);
    }
};

// Remove the old initializeGA4 function since we're using gtag.js in index.html
// Just export an empty initialization for compatibility
export const initializeGA4 = () => {
    console.log('✅ GA4 initialized via gtag.js in index.html');
};