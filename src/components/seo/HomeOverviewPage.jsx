// src/components/seo/HomeOverviewPage.jsx - MOBILE OPTIMIZED
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import { trackSEOButtonClick } from '../../utils/ga4';
import ceoImage from '../../assets/CEO.jpg';
import logo from '../../assets/logo.png';

const HomeOverviewPage = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isMobile, setIsMobile] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const heroRef = useRef(null);
    const logoRef = useRef(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);

    // Check for mobile and reduced motion preferences
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        const checkReducedMotion = () => {
            setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        };

        checkMobile();
        checkReducedMotion();

        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Optimized scroll tracking with throttle
    useEffect(() => {
        if (reducedMotion) return;

        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [reducedMotion]);

    // Disable 3D mouse effect on mobile
    useEffect(() => {
        if (isMobile || reducedMotion || !heroRef.current) return;

        const handleMouseMove = (e) => {
            const rect = heroRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            setMousePosition({ x, y });
        };

        const hero = heroRef.current;
        hero.addEventListener('mousemove', handleMouseMove);
        return () => hero.removeEventListener('mousemove', handleMouseMove);
    }, [isMobile, reducedMotion]);

    // Preload images
    useEffect(() => {
        const img = new Image();
        img.src = logo;
        img.onload = () => setImagesLoaded(true);
    }, []);

    // Service categories - memoized
    const serviceCategories = useMemo(() => [
        { name: 'Electrician', icon: '⚡', slug: 'electrician', color: 'from-yellow-400 to-yellow-600' },
        { name: 'Plumber', icon: '🔧', slug: 'plumber', color: 'from-blue-400 to-blue-600' },
        { name: 'Cleaning', icon: '🧹', slug: 'cleaning', color: 'from-green-400 to-green-600' },
        { name: 'Painting', icon: '🎨', slug: 'painting', color: 'from-pink-400 to-pink-600' },
        { name: 'AC Repair', icon: '❄️', slug: 'ac-repair', color: 'from-cyan-400 to-cyan-600' },
        { name: 'Carpenter', icon: '🪚', slug: 'carpenter', color: 'from-amber-400 to-amber-600' },
        { name: 'Pest Control', icon: '🐜', slug: 'pest-control', color: 'from-red-400 to-red-600' },
        { name: 'Roofing', icon: '🏠', slug: 'roofing', color: 'from-orange-400 to-orange-600' },
        { name: 'Logistics', icon: '🚚', slug: 'logistics', color: 'from-purple-400 to-purple-600' },
        { name: 'Hair Styling', icon: '💇', slug: 'hair-styling', color: 'from-fuchsia-400 to-fuchsia-600' }
    ], []);

    const navLinks = useMemo(() => [
        { name: 'Services', href: '/services' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'For Customers', href: '/for-customers' },
        { name: 'For Providers', href: '/for-providers' },
        { name: 'Ogun State', href: '/locations/ogun' },
        { name: 'Contact Us', href: '/contact' }
    ], []);

    // Generate particles only on desktop and if not reduced motion
    const particles = useMemo(() => {
        if (isMobile || reducedMotion) return [];
        return Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            delay: `${Math.random() * 5}s`,
            duration: `${15 + Math.random() * 10}s`,
            size: `${2 + Math.random() * 3}px`,
            opacity: 0.05 + Math.random() * 0.1
        }));
    }, [isMobile, reducedMotion]);

    const handleGetStartedClick = useCallback(() => {
        trackSEOButtonClick('Get Started Main', '/home');
        navigate('/login', { state: { from: 'seo-home-overview' } });
    }, [navigate]);

    const handleExploreServices = useCallback(() => {
        trackSEOButtonClick('Explore Services Main', '/home');
        navigate('/services');
    }, [navigate]);

    // Mobile-optimized CSS animations
    const animations = useMemo(() => `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(${isMobile ? '20px' : '30px'});
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes pulse {
            0%, 100% { opacity: ${isMobile ? 0.5 : 0.3}; }
            50% { opacity: ${isMobile ? 0.7 : 0.6}; }
        }

        .mobile-text-sm {
            font-size: ${isMobile ? '0.875rem' : '1rem'};
        }

        ${isMobile ? `
            .mobile-no-animation {
                animation: none !important;
                transition: none !important;
            }
        ` : ''}
    `, [isMobile]);

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            <SimpleHelmet
                title="Mount - Nigeria's Trusted Home Services Marketplace"
                description="Book verified electricians, plumbers, cleaners & more in Nigeria. Secure payments, quality guarantees, real-time tracking. Serving Ogun State."
                canonical="/home"
            />

            <style jsx>{animations}</style>

            {/* Optimized Navigation Bar - Mobile First */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
                <div className="container mx-auto px-3 md:px-4 py-2 md:py-3">
                    <div className="flex justify-between items-center">
                        {/* Logo - Smaller on mobile */}
                        <a href="/" className="flex items-center space-x-2 md:space-x-3">
                            <img
                                src={logo}
                                alt="Mount Logo"
                                className="h-8 md:h-12 w-auto object-contain"
                                loading="eager"
                            />
                            <span className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">
                                Mount
                            </span>
                        </a>

                        {/* Desktop Navigation - Hidden on mobile */}
                        <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
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
                                className="bg-naijaGreen text-white px-5 py-2 rounded-full font-medium hover:bg-darkGreen transition-colors text-sm"
                            >
                                Get Started
                            </button>
                        </div>

                        {/* Mobile Menu Button - Touch optimized */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg active:bg-gray-100 transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg
                                className="w-6 h-6 text-gray-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu - Optimized for touch */}
                    {isMenuOpen && (
                        <div className="lg:hidden mt-2 pb-3">
                            <div className="flex flex-col space-y-2">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="text-gray-700 hover:text-naijaGreen font-medium py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors active:bg-gray-100"
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
                                    className="bg-naijaGreen text-white px-4 py-3 rounded-full font-medium hover:bg-darkGreen transition-colors mt-2 active:bg-darkGreen"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Mobile-Optimized Hero Section */}
            <section
                ref={heroRef}
                className="relative overflow-hidden bg-gradient-to-br from-naijaGreen to-darkGreen text-white"
            >
                {/* Minimal particles only on desktop */}
                {!isMobile && particles.length > 0 && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {particles.map((particle) => (
                            <div
                                key={particle.id}
                                className="absolute bg-white/30 rounded-full"
                                style={{
                                    left: particle.left,
                                    top: particle.top,
                                    width: particle.size,
                                    height: particle.size,
                                    opacity: particle.opacity,
                                    animation: reducedMotion ? 'none' : `float ${particle.duration} ease-in-out infinite`,
                                    animationDelay: particle.delay
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Content - Mobile optimized */}
                <div className="container relative mx-auto px-4 py-12 md:py-20 lg:py-28">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Logo - Responsive sizing */}
                        <div className="mb-4 md:mb-6 flex justify-center">
                            <div className="relative">
                                {!isMobile && !reducedMotion && (
                                    <div className="absolute -inset-4 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
                                )}
                                <img
                                    ref={logoRef}
                                    src={logo}
                                    alt="Mount Logo"
                                    className="h-16 md:h-20 lg:h-24 w-auto object-contain"
                                    style={{
                                        animation: !isMobile && !reducedMotion ? 'pulse 3s ease-in-out infinite' : 'none'
                                    }}
                                    loading="eager"
                                />
                            </div>
                        </div>

                        {/* Headline - Smaller on mobile */}
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-3 md:mb-6 leading-tight">
                            Nigeria's Trusted Home Services
                        </h1>

                        {/* Description - Optimized line height for mobile */}
                        <p className="text-sm sm:text-base md:text-xl lg:text-2xl mb-6 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2">
                            Book verified professionals with secure payments, quality guarantees, and real-time tracking.
                        </p>

                        {/* Buttons - Stacked on mobile, full width */}
                        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
                            <button
                                onClick={handleGetStartedClick}
                                className="w-full sm:w-auto bg-white text-naijaGreen font-bold py-3 md:py-4 px-6 md:px-10 rounded-full hover:bg-gray-50 transition-all text-sm md:text-base shadow-lg active:scale-95"
                            >
                                Get Started Free
                            </button>
                            <button
                                onClick={handleExploreServices}
                                className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white font-bold py-3 md:py-4 px-6 md:px-10 rounded-full hover:bg-white/10 transition-all text-sm md:text-base backdrop-blur-sm active:scale-95"
                            >
                                Explore Services
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid - Mobile optimized grid */}
            <section className="py-12 md:py-16 lg:py-24 px-3 md:px-4 bg-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-8 md:mb-12 lg:mb-16">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
                            Professional Services for Every Need
                        </h2>
                        <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-3xl mx-auto px-2">
                            From electrical work to plumbing, cleaning to logistics - find trusted professionals for any home service need.
                        </p>
                    </div>

                    {/* Mobile: 2 columns, Tablet: 3 columns, Desktop: 5 columns */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
                        {serviceCategories.map((service, index) => (
                            <a
                                key={index}
                                href={`/services/${service.slug}`}
                                className="group bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 text-center border border-gray-100"
                                style={{
                                    animation: !isMobile && !reducedMotion && index < 5 ? `slideUp 0.5s ease-out ${index * 0.1}s forwards` : 'none',
                                    opacity: !isMobile && !reducedMotion && index < 5 ? 0 : 1
                                }}
                            >
                                <div className="text-3xl md:text-4xl mb-2 md:mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                    {service.icon}
                                </div>
                                <div className="text-xs md:text-sm lg:text-base font-semibold text-gray-900 group-hover:text-naijaGreen transition-colors">
                                    {service.name}
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* View all link - Touch optimized */}
                    <div className="text-center mt-8 md:mt-12">
                        <a
                            href="/services"
                            className="inline-flex items-center text-naijaGreen font-semibold hover:text-darkGreen group text-sm md:text-base lg:text-lg px-4 py-2 active:text-darkGreen"
                        >
                            View all services
                            <svg className="w-4 h-4 md:w-5 md:h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* How It Works - Mobile optimized cards */}
            <section className="py-12 md:py-16 lg:py-24 px-3 md:px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-8 md:mb-12 lg:mb-16">
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-4">
                            Simple, Secure, Stress-Free
                        </h2>
                        <p className="text-sm md:text-base lg:text-lg text-gray-600">
                            Our process ensures both customers and professionals are protected.
                        </p>
                    </div>

                    {/* Mobile: 1 column, Desktop: 3 columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
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
                                description: '50% deposit paid to our account. Pay balance when satisfied.',
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
                            <div
                                key={index}
                                className="bg-white p-5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-md border border-gray-100"
                            >
                                <div className="text-naijaGreen text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                                    {item.step}
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                                    {item.description}
                                </p>
                                <a
                                    href={item.link}
                                    className="inline-flex items-center text-naijaGreen font-medium hover:text-darkGreen text-sm md:text-base group"
                                >
                                    {item.linkText}
                                    <svg className="w-3 h-3 md:w-4 md:h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CEO Section - Mobile optimized layout */}
            <section className="py-12 md:py-16 lg:py-24 px-3 md:px-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
                        {/* Content - First on mobile */}
                        <div className="order-2 lg:order-1">
                            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 md:mb-4 lg:mb-6">
                                Trusted by Nigerians
                            </h2>
                            <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-3 md:mb-4 leading-relaxed">
                                To transform how Nigerians find and book home services by creating a trusted marketplace
                                where quality meets convenience, and every transaction is secure and satisfactory.
                            </p>
                            <p className="text-sm md:text-base lg:text-lg text-gray-600 mb-4 md:mb-6 leading-relaxed">
                                We're solving the challenges of finding reliable professionals, ensuring fair pricing,
                                and guaranteeing quality work through our secure platform.
                            </p>

                            {/* Benefits grid - 2 columns on mobile */}
                            <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
                                <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">
                                    Why Choose Mount?
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                    {[
                                        'All professionals verified',
                                        'Secure payments',
                                        'Quality guarantee',
                                        'Real-time tracking'
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center">
                                            <div className="w-5 h-5 md:w-6 md:h-6 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                                <span className="text-green-600 text-xs md:text-sm font-bold">✓</span>
                                            </div>
                                            <span className="text-xs md:text-sm text-gray-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* CEO Card - First on mobile */}
                        <div className="order-1 lg:order-2 flex justify-center lg:justify-end mb-4 lg:mb-0">
                            <div className="relative max-w-xs md:max-w-sm">
                                <div className="relative bg-white p-5 md:p-6 lg:p-8 rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-4 md:mb-6">
                                            <img
                                                src={ceoImage}
                                                alt="Adelua Victor - Founder & CEO"
                                                className="w-28 h-28 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white shadow-lg"
                                                loading="lazy"
                                            />
                                        </div>
                                        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                                            Adelua Victor
                                        </h3>
                                        <p className="text-naijaGreen font-semibold text-sm md:text-base mb-3 md:mb-4">
                                            Founder & CEO
                                        </p>
                                        <p className="text-xs md:text-sm lg:text-base text-gray-600 mb-4 md:mb-6 italic">
                                            "We started Mount to build trust and make quality home services accessible to every Nigerian."
                                        </p>
                                        <div className="flex space-x-4">
                                            <a
                                                href="https://linkedin.com/company/mountltd"
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-2 active:text-blue-600"
                                                aria-label="LinkedIn"
                                            >
                                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
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

            {/* Final CTA - Mobile optimized */}
            <section className="py-12 md:py-16 lg:py-24 px-3 md:px-4 bg-gradient-to-r from-naijaGreen to-darkGreen text-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4 lg:mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-sm md:text-base lg:text-lg mb-6 md:mb-8 max-w-2xl mx-auto px-2">
                        Trust Mount for your home service needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
                        <button
                            onClick={handleGetStartedClick}
                            className="w-full sm:w-auto bg-white text-naijaGreen font-bold py-3 md:py-4 px-6 md:px-8 lg:px-10 rounded-full hover:bg-gray-50 transition-all text-sm md:text-base shadow-lg active:scale-95"
                        >
                            Book a Service
                        </button>
                        <button
                            onClick={() => navigate('/for-providers')}
                            className="w-full sm:w-auto bg-transparent border-2 border-white/50 text-white font-bold py-3 md:py-4 px-6 md:px-8 lg:px-10 rounded-full hover:bg-white/10 transition-all text-sm md:text-base active:scale-95"
                        >
                            Become a Provider
                        </button>
                    </div>
                </div>
            </section>

            {/* Mobile-Optimized Footer */}
            <footer className="bg-gray-900 text-white py-8 md:py-10 lg:py-12 px-3 md:px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8">
                        {/* Logo - Centered on mobile */}
                        <div className="flex items-center space-x-2 mb-4 md:mb-0">
                            <img
                                src={logo}
                                alt="Mount Logo"
                                className="h-8 md:h-10 w-auto object-contain"
                                loading="lazy"
                            />
                            <span className="text-lg md:text-xl font-bold">Mount</span>
                        </div>

                        {/* Navigation - Wrap on mobile */}
                        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                            {navLinks.slice(0, 4).map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-400 hover:text-white transition-colors text-xs md:text-sm active:text-white"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Copyright - Smaller on mobile */}
                    <div className="text-center text-gray-500 text-xs md:text-sm pt-6 md:pt-8 border-t border-gray-800">
                        © {new Date().getFullYear()} Mount Ltd. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomeOverviewPage;