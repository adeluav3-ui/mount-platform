// src/components/seo/HomeOverviewPage.jsx - MODERN REDESIGN
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import { trackSEOButtonClick } from '../../utils/ga4';
import ceoImage from '../../assets/CEO.jpg';
import logo from '../../assets/logo.png'; // Import the actual logo

const HomeOverviewPage = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleGetStartedClick = () => {
        trackSEOButtonClick('Get Started Main', '/home');
        navigate('/app', { state: { from: 'seo-home-overview' } });
    };

    const handleExploreServices = () => {
        trackSEOButtonClick('Explore Services Main', '/home');
        navigate('/services');
    };

    const serviceCategories = [
        { name: 'Electrician', icon: '⚡', slug: 'electrician' },
        { name: 'Plumber', icon: '🔧', slug: 'plumber' },
        { name: 'Cleaning', icon: '🧹', slug: 'cleaning' },
        { name: 'Painting', icon: '🎨', slug: 'painting' },
        { name: 'AC Repair', icon: '❄️', slug: 'ac-repair' },
        { name: 'Carpenter', icon: '🪚', slug: 'carpenter' },
        { name: 'Pest Control', icon: '🐜', slug: 'pest-control' },
        { name: 'Roofing', icon: '🏠', slug: 'roofing' },
        { name: 'Logistics', icon: '🚚', slug: 'logistics' },
        { name: 'Hair Styling', icon: '💇', slug: 'hair-styling' }
    ];

    const navLinks = [
        { name: 'Services', href: '/services' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'For Customers', href: '/for-customers' },
        { name: 'For Providers', href: '/for-providers' },
        { name: 'Ogun State', href: '/locations/ogun' },
        { name: 'Contact Us', href: '/contact' }
    ];

    return (
        <div className="min-h-screen bg-white">
            <SimpleHelmet
                title="Mount - Nigeria's Trusted Home Services Marketplace"
                description="Book verified electricians, plumbers, cleaners & more in Nigeria. Secure payments, quality guarantees, real-time tracking. Serving Ogun State."
                canonical="/home"
            />

            {/* Modern Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <a href="/" className="flex items-center space-x-3">
                            <img
                                src={logo}
                                alt="Mount Logo"
                                className="h-12 w-auto object-contain"
                            />
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">Mount</span>
                        </a>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-700 hover:text-naijaGreen font-medium transition-colors text-sm tracking-wide"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <button
                                onClick={handleGetStartedClick}
                                className="bg-naijaGreen text-white px-6 py-2 rounded-full font-medium hover:bg-darkGreen transition-colors text-sm"
                            >
                                Get Started
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden text-gray-700 hover:text-naijaGreen"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="lg:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
                            <div className="flex flex-col space-y-4">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="text-gray-700 hover:text-naijaGreen font-medium py-2"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {link.name}
                                    </a>
                                ))}
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        handleGetStartedClick();
                                    }}
                                    className="bg-naijaGreen text-white px-6 py-3 rounded-full font-medium hover:bg-darkGreen transition-colors mt-2"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Modern Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-br from-naijaGreen via-naijaGreen to-darkGreen text-white">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="container relative mx-auto px-4 py-20 md:py-28">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="mb-6 flex justify-center">
                            <img
                                src={logo}
                                alt="Mount Logo"
                                className="h-24 w-auto object-contain filter drop-shadow-lg"
                            />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            Nigeria's Trusted Home Services
                        </h1>
                        <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-95 leading-relaxed">
                            Book verified professionals with secure payments, quality guarantees, and real-time tracking.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleGetStartedClick}
                                className="bg-white text-naijaGreen font-bold py-4 px-10 rounded-full hover:bg-gray-50 transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                Get Started Free
                            </button>
                            <button
                                onClick={handleExploreServices}
                                className="bg-transparent border-2 border-white/30 text-white font-bold py-4 px-10 rounded-full hover:bg-white/10 transition-all duration-300 text-lg backdrop-blur-sm"
                            >
                                Explore Services
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid - Modern Design */}
            <section className="py-16 md:py-24 px-4 bg-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Professional Services for Every Need
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            From electrical work to plumbing, cleaning to logistics - find trusted professionals for any home service need.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                        {serviceCategories.map((service, index) => (
                            <a
                                key={index}
                                href={`/services/${service.slug}`}
                                className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-center border border-gray-100 hover:border-naijaGreen/30 transform hover:-translate-y-1"
                            >
                                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                    {service.icon}
                                </div>
                                <div className="font-semibold text-gray-900 group-hover:text-naijaGreen transition-colors">
                                    {service.name}
                                </div>
                            </a>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <a
                            href="/services"
                            className="inline-flex items-center text-naijaGreen font-semibold hover:text-darkGreen group text-lg"
                        >
                            View all services
                            <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* How It Works - Modern Cards */}
            <section className="py-16 md:py-24 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12 md:mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Simple, Secure, Stress-Free
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Our process ensures both customers and professionals are protected.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {[
                            {
                                step: '1',
                                title: 'Post Job',
                                description: 'Describe what you need and set your budget. It\'s free to post.',
                                link: '/for-customers',
                                linkText: 'For Customers'
                            },
                            {
                                step: '2',
                                title: 'Secure Payment',
                                description: '50% deposit is paid to our account. Pay balance when satisfied with the work.',
                                link: '/how-it-works',
                                linkText: 'How It Works'
                            },
                            {
                                step: '3',
                                title: 'Quality Guaranteed',
                                description: 'Verified professionals with reviews. We mediate any issues.',
                                link: '/for-providers',
                                linkText: 'For Providers'
                            }
                        ].map((item, index) => (
                            <div key={index} className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                                <div className="relative bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
                                    <div className="text-naijaGreen text-3xl font-bold mb-4">{item.step}</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                                    <p className="text-gray-600 mb-6">{item.description}</p>
                                    <a href={item.link} className="text-naijaGreen font-medium hover:text-darkGreen inline-flex items-center group/link">
                                        {item.linkText}
                                        <svg className="w-4 h-4 ml-2 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About & CEO Section - Modern Design */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                Trusted by Nigerians
                            </h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                To transform how Nigerians find and book home services by creating a trusted marketplace
                                where quality meets convenience, and every transaction is secure and satisfactory.
                            </p>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                We're solving the challenges of finding reliable professionals, ensuring fair pricing,
                                and guaranteeing quality work through our secure platform.
                            </p>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Why Choose Mount?</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        'All professionals verified & vetted',
                                        'Secure payments',
                                        'Quality guarantee & dispute resolution',
                                        'Real-time job tracking & updates'
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center">
                                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                                <span className="text-green-600 text-sm font-bold">✓</span>
                                            </div>
                                            <span className="text-gray-700 text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center lg:justify-end">
                            <div className="relative max-w-md">
                                <div className="absolute -inset-4 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-3xl blur opacity-20"></div>
                                <div className="relative bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-6">
                                            <div className="absolute -inset-2 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-full blur opacity-30"></div>
                                            <img
                                                src={ceoImage}
                                                alt="Adelua Victor - Founder & CEO of Mount"
                                                className="relative w-48 h-48 rounded-full object-cover border-4 border-white shadow-lg"
                                            />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Adelua Victor</h3>
                                        <p className="text-naijaGreen font-semibold mb-4">Founder & CEO</p>
                                        <p className="text-gray-600 mb-6 italic">
                                            "We started Mount because we experienced firsthand the challenges of finding reliable
                                            home services in Nigeria. Our goal is to build trust and make quality home services
                                            accessible to every Nigerian."
                                        </p>
                                        <div className="flex space-x-4">
                                            <a href="https://linkedin.com/company/mountltd" className="text-gray-400 hover:text-blue-600 transition-colors">
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Final CTA */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-naijaGreen via-naijaGreen to-darkGreen text-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-95">
                        Trust Mount for your home service needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGetStartedClick}
                            className="bg-white text-naijaGreen font-bold py-4 px-10 rounded-full hover:bg-gray-50 transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Book a Service
                        </button>
                        <button
                            onClick={() => navigate('/for-providers')}
                            className="bg-transparent border-2 border-white/30 text-white font-bold py-4 px-10 rounded-full hover:bg-white/10 transition-all duration-300 text-lg backdrop-blur-sm"
                        >
                            Become a Provider
                        </button>
                    </div>
                </div>
            </section>

            {/* Modern Footer */}
            <footer className="bg-gray-900 text-white py-8 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center space-x-3 mb-6 md:mb-0">
                            <img
                                src={logo}
                                alt="Mount Logo"
                                className="h-10 w-auto object-contain"
                            />
                            <span className="text-xl font-bold">Mount</span>
                        </div>
                        <div className="flex flex-wrap gap-6 justify-center">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="text-center text-gray-500 text-sm mt-8 pt-6 border-t border-gray-800">
                        © {new Date().getFullYear()} Mount Ltd. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomeOverviewPage;