// src/components/seo/ServicesHubPage.jsx - MOBILE OPTIMIZED
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import logo from '../../assets/logo.png';
import { trackSEOButtonClick, trackSEOClick } from '../../utils/ga4';
import { useScrollTracking } from '../../hooks/useScrollTracking';
import SchemaMarkup from '../seo/SchemaMarkup';

export default function ServicesHubPage() {

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

    <SchemaMarkup type="platform" />

    const handleGetStartedClick = () => {
        trackSEOButtonClick('Get Started', '/services');
        trackSEOClick('services-hub', 'get-started');
        // Your existing navigation code here
        navigate('/app', { state: { from: 'seo-services-hub' } });
    };
    useScrollTracking(window.location.pathname);
    return (
        <>
            <SimpleHelmet
                title="Home Services in Ogun State | Electricians, Plumbers, Cleaners & More | Mount"
                description="Find verified home service professionals in Ogun State. Book electricians, plumbers, cleaners, painters, AC repair, and more with secure payments and quality guarantees."
                canonical="https://mountltd.com/services"
            />

            {/* Mobile-Optimized Layout */}
            <div className="min-h-screen bg-white">

                {/* Modern Professional Header */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between py-5">
                            {/* Logo - Modern Design */}
                            <Link to="/" className="flex items-center space-x-4 group">
                                <div className="relative">
                                    <img
                                        src={logo}
                                        alt="Mount - Nigeria's Trusted Home Services Marketplace"
                                        className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute -inset-1 bg-gradient-to-r from-naijaGreen/20 to-darkGreen/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <div className="hidden lg:block">
                                    <div className="font-bold text-2xl text-gray-800 tracking-tight">Mount</div>
                                    <div className="text-xs text-gray-500 font-medium tracking-wide">TRUSTED HOME SERVICES</div>
                                </div>
                            </Link>

                            {/* Desktop Navigation - Modern */}
                            <nav className="hidden lg:flex items-center space-x-10">
                                <Link
                                    to="/services"
                                    className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200 relative group"
                                >
                                    Services
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-naijaGreen group-hover:w-full transition-all duration-300"></span>
                                </Link>
                                <Link
                                    to="/how-it-works"
                                    className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200 relative group"
                                >
                                    How It Works
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-naijaGreen group-hover:w-full transition-all duration-300"></span>
                                </Link>
                                <Link
                                    to="/for-customers"
                                    className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200 relative group"
                                >
                                    For Customers
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-naijaGreen group-hover:w-full transition-all duration-300"></span>
                                </Link>
                                <Link
                                    to="/for-providers"
                                    className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200 relative group"
                                >
                                    For Providers
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-naijaGreen group-hover:w-full transition-all duration-300"></span>
                                </Link>
                            </nav>

                            {/* CTA Button for Desktop */}
                            <div className="hidden lg:block">
                                <a
                                    href="/app"
                                    className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white px-6 py-3 rounded-lg font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    Get Started
                                </a>
                            </div>

                            {/* Mobile Menu Button - Modern & Functional */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                                aria-label="Toggle menu"
                            >
                                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                                <span className={`w-6 h-0.5 bg-gray-700 my-1.5 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                            </button>
                        </div>

                        {/* Mobile Menu Dropdown - Modern & Animated */}
                        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="py-6 border-t border-gray-100">
                                <nav className="flex flex-col space-y-4">
                                    <Link
                                        to="/services"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        <span className="font-medium text-gray-700">Services</span>
                                    </Link>
                                    <Link
                                        to="/how-it-works"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium text-gray-700">How It Works</span>
                                    </Link>
                                    <Link
                                        to="/for-customers"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="font-medium text-gray-700">For Customers</span>
                                    </Link>
                                    <Link
                                        to="/for-providers"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-medium text-gray-700">For Providers</span>
                                    </Link>

                                    {/* Mobile CTA Button */}
                                    <div className="pt-4 mt-4 border-t border-gray-100">
                                        <a
                                            href="/app"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block w-full bg-gradient-to-r from-naijaGreen to-darkGreen text-white py-3 px-4 rounded-lg font-bold text-center hover:shadow-lg transition-shadow"
                                        >
                                            Get Started Free
                                        </a>
                                    </div>
                                </nav>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Updated for Better Mobile View */}
                <section className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
                            backgroundSize: '100px 100px'
                        }}></div>
                    </div>

                    <div className="container mx-auto px-4 py-16 md:py-24 relative">
                        <div className="max-w-6xl mx-auto">
                            {/* Mobile Logo in Hero - Centered */}
                            <div className="mb-10 md:hidden flex flex-col items-center">
                                <img
                                    src={logo}
                                    alt="Mount"
                                    className="h-20 w-auto bg-white p-4 rounded-2xl shadow-2xl mb-4"
                                />
                                <div className="text-center">
                                    <div className="font-bold text-2xl">Mount</div>
                                    <div className="text-sm opacity-80">Trusted Home Services</div>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div className="lg:w-2/3 mb-10 lg:mb-0">
                                    <div className="mb-6">
                                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full text-sm font-semibold tracking-wide">
                                            NIGERIA'S TRUSTED HOME SERVICES MARKETPLACE
                                        </span>
                                    </div>
                                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 md:mb-8 leading-tight">
                                        Professional Home Services<br className="hidden sm:block" /> in Ogun State
                                    </h1>
                                    <p className="text-xl sm:text-2xl md:text-3xl mb-10 max-w-3xl opacity-95 leading-relaxed">
                                        Verified professionals. Secure payments. Quality guaranteed.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        <a
                                            href="/#postJob"
                                            className="inline-flex items-center justify-center bg-white text-naijaGreen px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-center text-lg shadow-2xl hover:shadow-3xl hover:-translate-y-1"
                                        >
                                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Book a Service Now
                                        </a>
                                        <a
                                            href="/how-it-works"
                                            className="inline-flex items-center justify-center border-2 border-white/50 text-white px-8 py-4 rounded-xl font-bold hover:bg-white hover:text-naijaGreen transition-all duration-300 text-center text-lg backdrop-blur-sm"
                                        >
                                            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            How It Works
                                        </a>
                                    </div>
                                </div>

                                {/* Desktop Logo Card - More Professional */}
                                <div className="lg:w-1/3 lg:pl-12">
                                    <div className="hidden lg:block bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
                                        <img
                                            src={logo}
                                            alt="Mount"
                                            className="h-28 w-auto mx-auto mb-6"
                                        />
                                        <div className="text-center">
                                            <h3 className="font-bold text-white text-2xl mb-3">Mount Platform</h3>
                                            <p className="text-white/80 text-base">
                                                Nigeria's #1 home services marketplace with escrow protection and quality guarantees.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
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
                                        title: 'Secure Payments',
                                        description: 'Payment structure is secured and tracked while work is completed to your satisfaction.',
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