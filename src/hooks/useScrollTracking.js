// src/hooks/useScrollTracking.js - FIXED VERSION
import { useEffect } from 'react';
import { trackScrollDepth } from '../utils/ga4';

export const useScrollTracking = (pageUrl) => {
    useEffect(() => {
        // Early return inside useEffect is fine
        if (!pageUrl) return;

        let tracked25 = false, tracked50 = false, tracked75 = false, tracked90 = false;

        const handleScroll = () => {
            const scrollTop = window.pageYOffset;
            const windowHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;

            const scrollPercent = (scrollTop / (docHeight - windowHeight)) * 100;

            if (scrollPercent >= 25 && !tracked25) {
                trackScrollDepth(25, pageUrl);
                tracked25 = true;
            }
            if (scrollPercent >= 50 && !tracked50) {
                trackScrollDepth(50, pageUrl);
                tracked50 = true;
            }
            if (scrollPercent >= 75 && !tracked75) {
                trackScrollDepth(75, pageUrl);
                tracked75 = true;
            }
            if (scrollPercent >= 90 && !tracked90) {
                trackScrollDepth(90, pageUrl);
                tracked90 = true;
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [pageUrl]); // ✅ pageUrl is in dependency array
};