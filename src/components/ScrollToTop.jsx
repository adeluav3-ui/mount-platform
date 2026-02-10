// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top on route change
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant' // Use 'instant' instead of 'smooth' for immediate scroll
        });

        // Also try these as fallbacks
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

    }, [pathname]);

    return null;
}