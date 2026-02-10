// src/components/seo/SchemaMarkup.jsx
import React, { useEffect } from 'react';
import {
    getPlatformSchema,
    getServiceSchema,
    getFAQSchema,
    getHowToSchema,
    injectSchema
} from '../../utils/schema';

const SchemaMarkup = ({ type, serviceSlug, serviceData, faqs }) => {
    useEffect(() => {
        let schema;

        switch (type) {
            case 'platform':
                schema = getPlatformSchema();
                break;

            case 'service':
                schema = getServiceSchema(serviceSlug, serviceData);
                break;

            case 'faq':
                schema = getFAQSchema(faqs || []);
                break;

            case 'howto':
                schema = getHowToSchema();
                break;

            default:
                schema = getPlatformSchema();
        }

        const script = injectSchema(schema);

        // Cleanup on unmount
        return () => {
            if (script && script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [type, serviceSlug, serviceData, faqs]);

    return null; // This component doesn't render anything
};

export default SchemaMarkup;