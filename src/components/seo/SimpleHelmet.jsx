// src/components/seo/SimpleHelmet.jsx
import React from 'react';

export default function SimpleHelmet({ title, description, canonical }) {
    React.useEffect(() => {
        // Update document title
        if (title) {
            document.title = title;
        }

        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        if (description) {
            metaDescription.content = description;
        }

        // Update canonical link
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.rel = 'canonical';
                document.head.appendChild(canonicalLink);
            }
            canonicalLink.href = canonical;
        }
    }, [title, description, canonical]);

    return null; // This component doesn't render anything
}