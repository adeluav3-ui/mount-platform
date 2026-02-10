// src/components/seo/ServicesHubPage.jsx - MOBILE OPTIMIZED
import React from 'react';
import { Link } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import logo from '../../assets/logo.png';

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
            <SimpleHelmet
                title="Home Services in Ogun State | Electricians, Plumbers, Cleaners & More | Mount"
                description="Find verified home service professionals in Ogun State. Book electricians, plumbers, cleaners, painters, AC repair, and more with secure payments and quality guarantees."
                canonical="https://mountltd.com/services"
            />

            {/* Mobile-Optimized Layout */}
            <div className="min-h-screen bg-white">

                {/* Modern Header with Logo */}
                <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between py-4">
                            {/* Logo */}
                            <Link to="/" className="flex items-center space-x-3">
                                <img
                                    src={logo}
                                    alt="Mount - Nigeria's Trusted Home Services Marketplace"
                                    className="h-10 w-auto md:h-12"
                                />
                                <div className="hidden md:block">
                                    <div className="font-bold text-xl text-gray-800">Mount</div>
                                    <div className="text-xs text-gray-500">Trusted Home Services</div>
                                </div>
                            </Link>

                            {/* Navigation */}
                            <nav className="hidden md:flex items-center space-x-8">
                                <Link to="/services" className="font-medium text-gray-700 hover:text-naijaGreen transition">
                                    Services
                                </Link>
                                <Link to="/how-it-works" className="font-medium text-gray-700 hover:text-naijaGreen transition">
                                    How It Works
                                </Link>
                                <Link to="/for-customers" className="font-medium text-gray-700 hover:text-naijaGreen transition">
                                    For Customers
                                </Link>
                                <Link to="/for-providers" className="font-medium text-gray-700 hover:text-naijaGreen transition">
                                    For Providers
                                </Link>
                            </nav>

                            {/* Mobile Menu Button */}
                            <button className="md:hidden text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Responsive */}
                <section className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white">
                    <div className="container mx-auto px-4 py-12 md:py-16">
                        <div className="max-w-6xl mx-auto">
                            {/* Logo in Hero for Mobile */}
                            <div className="mb-8 md:hidden flex justify-center">
                                <img
                                    src={logo}
                                    alt="Mount"
                                    className="h-16 w-auto bg-white p-3 rounded-2xl shadow-lg"
                                />
                            </div>

                            {/* Mobile: Stack, Desktop: Side-by-side */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div className="lg:w-2/3 mb-8 lg:mb-0">
                                    <div className="mb-4">
                                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-1 rounded-full text-sm font-medium mb-3">
                                            Nigeria's Trusted Home Services Marketplace
                                        </span>
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                                        Home Services in Ogun State
                                    </h1>
                                    <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-3xl opacity-95 leading-relaxed">
                                        Find verified professionals for all your home service needs. Book with confidence using Mount's secure payment system.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <a
                                            href="/#postJob"
                                            className="inline-flex items-center justify-center bg-white text-naijaGreen px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition text-center text-base shadow-lg hover:shadow-xl"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Book a Service Now
                                        </a>
                                        <a
                                            href="/how-it-works"
                                            className="inline-flex items-center justify-center border-2 border-white text-white px-6 py-3 rounded-xl font-bold hover:bg-white hover:text-naijaGreen transition text-center text-base"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            How It Works
                                        </a>
                                    </div>
                                </div>
                                <div className="lg:w-1/3 lg:pl-12">
                                    {/* Desktop Logo */}
                                    <div className="hidden lg:block bg-white p-6 rounded-2xl shadow-2xl">
                                        <img
                                            src={logo}
                                            alt="Mount"
                                            className="h-24 w-auto mx-auto mb-4"
                                        />
                                        <div className="text-center">
                                            <h3 className="font-bold text-gray-800 text-xl mb-2">Mount</h3>
                                            <p className="text-gray-600 text-sm">
                                                Nigeria's #1 home services marketplace
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Banner */}
                <div className="bg-white border-y border-gray-100 py-6">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { number: '500+', label: 'Verified Professionals' },
                                { number: '10+', label: 'Service Categories' },
                                { number: '98%', label: 'Customer Satisfaction' },
                                { number: '24/7', label: 'Support Available' }
                            ].map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-naijaGreen mb-1">{stat.number}</div>
                                    <div className="text-sm text-gray-600">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Services Grid - Responsive Columns */}
                <section className="py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">

                            {/* Section Header with Logo */}
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center justify-center bg-gray-50 p-3 rounded-full mb-4">
                                    <img
                                        src={logo}
                                        alt="Mount"
                                        className="h-8 w-auto"
                                    />
                                </div>
                                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                                    Popular Home Services
                                </h2>
                                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                                    Choose from our verified professionals across Ogun State
                                </p>
                            </div>

                            {/* Responsive Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {services.map((service) => (
                                    <Link
                                        key={service.slug}
                                        to={`/services/${service.slug}`}
                                        className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-2xl hover:border-naijaGreen transition-all duration-300 transform hover:-translate-y-2"
                                    >
                                        <div className="flex items-start">
                                            {/* Icon - Modern Card */}
                                            <div className="text-3xl sm:text-4xl md:text-5xl mr-5 flex-shrink-0 p-3 bg-gray-50 rounded-xl group-hover:bg-naijaGreen/10 transition">
                                                {service.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 leading-tight">
                                                    {service.name}
                                                </h3>
                                                <p className="text-gray-600 mb-5 text-base leading-relaxed">
                                                    {service.description}
                                                </p>

                                                {/* Modern CTA Link */}
                                                <span className="inline-flex items-center text-naijaGreen font-semibold text-base group-hover:text-darkGreen transition">
                                                    Find Providers
                                                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trust Indicators - Modern Design */}
                <section className="bg-gradient-to-br from-gray-50 to-white py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center justify-center bg-white p-3 rounded-full shadow-sm mb-4">
                                    <img
                                        src={logo}
                                        alt="Mount"
                                        className="h-8 w-auto"
                                    />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                                    Why Choose Mount?
                                </h2>
                                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                                    We're building trust in Nigeria's home services industry
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                                {[
                                    {
                                        icon: '✅',
                                        title: 'Verified Professionals',
                                        description: 'Every provider is background-checked and verified for quality assurance.',
                                        color: 'text-green-600'
                                    },
                                    {
                                        icon: '🔒',
                                        title: 'Secure Escrow Payments',
                                        description: 'Your payment is held securely until work is completed to your satisfaction.',
                                        color: 'text-blue-600'
                                    },
                                    {
                                        icon: '⭐',
                                        title: 'Quality Guarantee',
                                        description: 'Not satisfied? We work with the provider to fix it at no extra cost.',
                                        color: 'text-yellow-600'
                                    },
                                    {
                                        icon: '📱',
                                        title: 'Real-time Tracking',
                                        description: 'Track your job progress and communicate directly with your provider.',
                                        color: 'text-purple-600'
                                    }
                                ].map((feature, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-2xl p-6 md:p-8 text-center border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300"
                                    >
                                        <div className={`text-4xl md:text-5xl mb-4 ${feature.color}`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="font-bold text-gray-800 mb-3 text-xl">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 text-base">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Modern Footer with Logo */}
                <footer className="bg-gray-900 text-white py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                                <div className="mb-6 md:mb-0">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <img
                                            src={logo}
                                            alt="Mount"
                                            className="h-12 w-auto bg-white p-2 rounded-lg"
                                        />
                                        <div>
                                            <div className="font-bold text-xl">Mount</div>
                                            <div className="text-gray-400 text-sm">Nigeria's Trusted Home Services</div>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 max-w-md">
                                        Connecting verified service professionals with homeowners through secure payments and quality guarantees.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                    <div>
                                        <h4 className="font-bold mb-4">Services</h4>
                                        <ul className="space-y-2">
                                            <li><a href="/services/electrician" className="text-gray-400 hover:text-white transition">Electricians</a></li>
                                            <li><a href="/services/plumber" className="text-gray-400 hover:text-white transition">Plumbers</a></li>
                                            <li><a href="/services/cleaning" className="text-gray-400 hover:text-white transition">Cleaning</a></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-4">Company</h4>
                                        <ul className="space-y-2">
                                            <li><a href="/how-it-works" className="text-gray-400 hover:text-white transition">How It Works</a></li>
                                            <li><a href="/for-customers" className="text-gray-400 hover:text-white transition">For Customers</a></li>
                                            <li><a href="/for-providers" className="text-gray-400 hover:text-white transition">For Providers</a></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-4">Support</h4>
                                        <ul className="space-y-2">
                                            <li><a href="/contact" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
                                            <li><a href="/help" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                                            <li><a href="/privacy" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                                <p>© {new Date().getFullYear()} Mount. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}