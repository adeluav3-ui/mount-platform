// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/ga4'; // Add this import

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Track page view in GA4
        trackPageView(pathname);

        // Scroll to top on route change
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'
        });

        // Also try these as fallbacks
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

    }, [pathname]);

    return null;
}