// src/components/seo/ServicesHubPage.jsx - MOBILE OPTIMIZED
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function ServicesHubPage() {
    const services = [
        {
            slug: 'electrician',
            name: 'Electrician',
            icon: '⚡',
            description: 'Find certified electricians for wiring, repairs, installations, and maintenance.'
        },
        {
            slug: 'plumber',
            name: 'Plumber',
            icon: '🔧',
            description: 'Professional plumbing services including leaks, installations, and drainage systems.'
        },
        {
            slug: 'cleaning',
            name: 'Cleaning',
            icon: '🧹',
            description: 'Home cleaning, office cleaning, deep cleaning, and post-construction cleaning.'
        },
        {
            slug: 'painting',
            name: 'Painting',
            icon: '🎨',
            description: 'Interior and exterior painting, wall finishing, and decorative painting services.'
        },
        {
            slug: 'ac-repair',
            name: 'AC Repair',
            icon: '❄️',
            description: 'AC installation, maintenance, gas refilling, and repair services.'
        },
        {
            slug: 'carpenter',
            name: 'Carpenter',
            icon: '🪚',
            description: 'Furniture making, repairs, wood installations, and custom carpentry work.'
        },
        {
            slug: 'pest-control',
            name: 'Pest Control',
            icon: '🐜',
            description: 'Fumigation, rodent control, insect elimination, and preventive pest management.'
        },
        {
            slug: 'roofing',
            name: 'Roofing',
            icon: '🏠',
            description: 'Roof repair, installation, leak fixing, and roof maintenance services.'
        },
        {
            slug: 'logistics',
            name: 'Logistics',
            icon: '🚚',
            description: 'Pickup and delivery services within and outside Ogun State.'
        },
        {
            slug: 'hair-styling',
            name: 'Hair Styling',
            icon: '💇',
            description: 'Professional hairstyling, haircuts, braiding, and salon services at home.'
        },
    ];

    return (
        <>
            <Helmet>
                <title>Home Services in Ogun State | Electricians, Plumbers, Cleaners & More | Mount</title>
                <meta
                    name="description"
                    content="Find verified home service professionals in Ogun State. Book electricians, plumbers, cleaners, painters, AC repair, and more with secure payments and quality guarantees."
                />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="canonical" href="https://mountltd.com/services" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "itemListElement": services.map((service, index) => ({
                            "@type": "ListItem",
                            "position": index + 1,
                            "item": {
                                "@type": "Service",
                                "name": service.name,
                                "url": `https://mountltd.com/services/${service.slug}`,
                                "description": service.description
                            }
                        }))
                    })}
                </script>
            </Helmet>

            {/* Mobile-Optimized Layout */}
            <div className="min-h-screen bg-white">

                {/* Hero Section - Responsive */}
                <section className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white">
                    <div className="container mx-auto px-4 py-8 md:py-12">
                        <div className="max-w-6xl mx-auto">
                            {/* Mobile: Stack, Desktop: Side-by-side */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div className="lg:w-2/3 mb-6 lg:mb-0">
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4 leading-tight">
                                        Home Services in Ogun State
                                    </h1>
                                    <p className="text-base sm:text-lg md:text-xl mb-6 max-w-3xl opacity-95 leading-relaxed">
                                        Find verified professionals for all your home service needs. Book with confidence using Mount's secure payment system.
                                    </p>
                                </div>
                                <div className="lg:w-1/3">
                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                                        <a
                                            href="/#postJob"
                                            className="bg-white text-naijaGreen px-5 py-3 rounded-lg font-bold hover:bg-gray-100 transition text-center text-sm sm:text-base flex-1"
                                        >
                                            Book a Service Now
                                        </a>
                                        <a
                                            href="/how-it-works"
                                            className="border-2 border-white text-white px-5 py-3 rounded-lg font-bold hover:bg-white hover:text-naijaGreen transition text-center text-sm sm:text-base flex-1"
                                        >
                                            How It Works
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Grid - Responsive Columns */}
                <section className="py-8 md:py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">

                            {/* Grid Title */}
                            <div className="mb-6 md:mb-8">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 text-center">
                                    Popular Home Services
                                </h2>
                                <p className="text-gray-600 text-center mt-2 text-sm md:text-base">
                                    Choose from our verified professionals
                                </p>
                            </div>

                            {/* Responsive Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {services.map((service) => (
                                    <Link
                                        key={service.slug}
                                        to={`/services/${service.slug}`}
                                        className="block bg-white border border-gray-200 rounded-xl p-5 md:p-6 hover:shadow-lg hover:border-naijaGreen transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-start">
                                            {/* Icon - Responsive sizing */}
                                            <div className="text-2xl sm:text-3xl md:text-4xl mr-4 flex-shrink-0">
                                                {service.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0"> {/* Prevents text overflow */}
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 leading-tight">
                                                    {service.name}
                                                </h3>
                                                <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed">
                                                    {service.description}
                                                </p>

                                                {/* CTA Link */}
                                                <span className="text-naijaGreen font-medium inline-flex items-center text-sm sm:text-base">
                                                    Find Providers
                                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Mobile: Show fewer items initially with "Load More" */}
                            <div className="mt-6 md:mt-8 lg:hidden">
                                <p className="text-center text-gray-500 text-sm">
                                    Scroll to see all services
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Indicators - Responsive */}
                <section className="bg-gray-50 py-8 md:py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-6 md:mb-8">
                                Why Choose Mount?
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                {[
                                    {
                                        icon: '✅',
                                        title: 'Verified Professionals',
                                        description: 'All providers thoroughly vetted'
                                    },
                                    {
                                        icon: '🔒',
                                        title: 'Secure Payments',
                                        description: 'Payment protection for both parties'
                                    },
                                    {
                                        icon: '⭐',
                                        title: 'Quality Guaranteed',
                                        description: 'Work satisfaction or we fix it'
                                    },
                                    {
                                        icon: '📱',
                                        title: 'Real-time Tracking',
                                        description: 'Track your job from start to finish'
                                    }
                                ].map((feature, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-xl p-4 md:p-5 text-center border border-gray-100"
                                    >
                                        <div className="text-2xl md:text-3xl mb-3">{feature.icon}</div>
                                        <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 text-xs md:text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section - Responsive */}
                <section className="py-8 md:py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-naijaGreen/10 to-darkGreen/10 rounded-2xl p-6 md:p-8">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 md:mb-4">
                                Ready to Book a Service?
                            </h2>
                            <p className="text-gray-600 mb-6 text-sm md:text-base max-w-2xl mx-auto">
                                Join Mount for secure, reliable home services with guaranteed satisfaction.
                            </p>

                            {/* Responsive CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <a
                                    href="/login"
                                    className="bg-naijaGreen text-white px-6 py-3 rounded-lg font-bold hover:bg-darkGreen transition text-sm md:text-base flex-1 sm:flex-none sm:px-8"
                                >
                                    Get Started Free
                                </a>
                                <a
                                    href="/how-it-works"
                                    className="border-2 border-naijaGreen text-naijaGreen px-6 py-3 rounded-lg font-bold hover:bg-naijaGreen hover:text-white transition text-sm md:text-base flex-1 sm:flex-none sm:px-8"
                                >
                                    Learn More
                                </a>
                            </div>

                            {/* Additional Info - Mobile compact */}
                            <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-4">
                                <div className="flex items-center text-gray-600 text-xs md:text-sm">
                                    <span className="text-green-500 mr-1">✓</span>
                                    No hidden fees
                                </div>
                                <div className="flex items-center text-gray-600 text-xs md:text-sm">
                                    <span className="text-green-500 mr-1">✓</span>
                                    Secure escrow
                                </div>
                                <div className="flex items-center text-gray-600 text-xs md:text-sm">
                                    <span className="text-green-500 mr-1">✓</span>
                                    Quality guaranteed
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
export { ServicesHubPage as default };