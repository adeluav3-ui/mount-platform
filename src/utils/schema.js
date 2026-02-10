// src/utils/schema.js

// Service categories with their schema types
export const SERVICE_SCHEMA_TYPES = {
    'electrician': 'Electrician',
    'plumber': 'Plumber',
    'cleaning': 'CleaningService',
    'painting': 'PaintingService',
    'ac-repair': 'HVACBusiness',
    'carpenter': 'Carpenter',
    'pest-control': 'PestControlService',
    'roofing': 'RoofingContractor',
    'logistics': 'MovingCompany',
    'hair-styling': 'HairSalon'
};

// Generate LocalBusiness schema for the platform
export const getPlatformSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'Mount',
        'description': "Nigeria's trusted home services marketplace connecting verified service professionals with homeowners through secure escrow payments, quality guarantees, and real-time job tracking.",
        'url': 'https://mountltd.com',
        'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Ogun State',
            'addressRegion': 'NG',
            'addressCountry': 'Nigeria'
        },
        'areaServed': {
            '@type': 'State',
            'name': 'Ogun State'
        },
        'serviceArea': {
            '@type': 'State',
            'name': 'Ogun State'
        },
        'priceRange': '₦₦₦',
        'telephone': '+2348000000000',
        'email': 'contact@mountltd.com',
        'sameAs': [
            'https://facebook.com/mountltd',
            'https://twitter.com/mountltd',
            'https://instagram.com/mountltd'
        ],
        'openingHoursSpecification': {
            '@type': 'OpeningHoursSpecification',
            'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            'opens': '08:00',
            'closes': '20:00'
        },
        'service': Object.values(SERVICE_SCHEMA_TYPES).map(serviceType => ({
            '@type': serviceType
        })),
        'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'reviewCount': '150',
            'bestRating': '5',
            'worstRating': '1'
        }
    };
};

// Generate Service schema for individual service pages
export const getServiceSchema = (serviceSlug, serviceData) => {
    const serviceType = SERVICE_SCHEMA_TYPES[serviceSlug] || 'Service';

    return {
        '@context': 'https://schema.org',
        '@type': serviceType,
        'name': serviceData?.name || `${serviceSlug.charAt(0).toUpperCase() + serviceSlug.slice(1)} Services`,
        'description': serviceData?.description || `Professional ${serviceSlug} services in Ogun State, Nigeria.`,
        'provider': {
            '@type': 'LocalBusiness',
            'name': 'Mount',
            'url': 'https://mountltd.com'
        },
        'areaServed': {
            '@type': 'State',
            'name': 'Ogun State'
        },
        'serviceType': serviceSlug,
        'offers': {
            '@type': 'AggregateOffer',
            'lowPrice': serviceData?.priceRange?.min || '5000',
            'highPrice': serviceData?.priceRange?.max || '500000',
            'priceCurrency': 'NGN',
            'offerCount': '50'
        },
        'availableChannel': {
            '@type': 'ServiceChannel',
            'serviceUrl': `https://mountltd.com/services/${serviceSlug}`
        }
    };
};

// Generate FAQ schema for pages with FAQs
export const getFAQSchema = (faqs) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': faq.answer
            }
        }))
    };
};

// Generate HowTo schema for How It Works page
export const getHowToSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': 'How to Book Home Services on Mount',
        'description': 'Step-by-step guide to booking trusted home services in Ogun State, Nigeria.',
        'totalTime': 'PT10M',
        'estimatedCost': {
            '@type': 'MonetaryAmount',
            'currency': 'NGN',
            'value': 'Varies by service'
        },
        'step': [
            {
                '@type': 'HowToStep',
                'position': 1,
                'name': 'Select Your Service',
                'text': 'Choose from 10+ home services including electrician, plumber, cleaning, and more.',
                'url': 'https://mountltd.com/services'
            },
            {
                '@type': 'HowToStep',
                'position': 2,
                'name': 'Post Your Job',
                'text': 'Describe your job requirements and upload photos if needed.',
                'url': 'https://mountltd.com/login'
            },
            {
                '@type': 'HowToStep',
                'position': 3,
                'name': 'Get Quotes',
                'text': 'Receive quotes from verified service professionals in your area.',
                'url': 'https://mountltd.com/dashboard'
            },
            {
                '@type': 'HowToStep',
                'position': 4,
                'name': 'Secure Payment',
                'text': 'Pay 50% deposit through our secure escrow system.',
                'url': 'https://mountltd.com/payment'
            },
            {
                '@type': 'HowToStep',
                'position': 5,
                'name': 'Job Completion',
                'text': 'Professional completes the job to your satisfaction.',
                'url': 'https://mountltd.com/dashboard'
            },
            {
                '@type': 'HowToStep',
                'position': 6,
                'name': 'Release Payment',
                'text': 'Release remaining payment and leave a review.',
                'url': 'https://mountltd.com/review'
            }
        ]
    };
};

// Helper to inject schema into page head
export const injectSchema = (schemaData) => {
    // Remove existing schema if any
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
        existingScript.remove();
    }

    // Create new script tag
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData, null, 2);

    // Add to head
    document.head.appendChild(script);

    return script;
};