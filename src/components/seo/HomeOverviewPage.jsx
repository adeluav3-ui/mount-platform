// src/components/seo/HomeOverviewPage.jsx - WITH PROFESSIONAL MOTION GRAPHICS
import React, { useState, useEffect, useRef } from 'react';
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
    const heroRef = useRef(null);
    const logoRef = useRef(null);
    const particlesRef = useRef([]);

    // Track scroll for parallax effects
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Track mouse for 3D parallax effect
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (heroRef.current) {
                const rect = heroRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                setMousePosition({ x, y });
            }
        };

        const hero = heroRef.current;
        if (hero) {
            hero.addEventListener('mousemove', handleMouseMove);
            return () => hero.removeEventListener('mousemove', handleMouseMove);
        }
    }, []);

    // Animated logo entrance
    useEffect(() => {
        if (logoRef.current) {
            logoRef.current.style.animation = 'floatIn 1.2s cubic-bezier(0.23, 1, 0.32, 1)';
        }
    }, []);

    const serviceCategories = [
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
    ];

    const navLinks = [
        { name: 'Services', href: '/services' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'For Customers', href: '/for-customers' },
        { name: 'For Providers', href: '/for-providers' },
        { name: 'Ogun State', href: '/locations/ogun' },
        { name: 'Contact Us', href: '/contact' }
    ];

    // Generate floating particles for background
    const particles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 5}s`,
        duration: `${15 + Math.random() * 10}s`,
        size: `${2 + Math.random() * 4}px`,
        opacity: 0.1 + Math.random() * 0.2
    }));

    const handleGetStartedClick = () => {
        trackSEOButtonClick('Get Started Main', '/home');
        navigate('/login', { state: { from: 'seo-home-overview' } });
    };

    const handleExploreServices = () => {
        trackSEOButtonClick('Explore Services Main', '/home');
        navigate('/services');
    };

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            <SimpleHelmet
                title="Mount - Nigeria's Trusted Home Services Marketplace"
                description="Book verified electricians, plumbers, cleaners & more in Nigeria. Secure payments, quality guarantees, real-time tracking. Serving Ogun State."
                canonical="/home"
            />

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes floatIn {
                    0% { opacity: 0; transform: translateY(40px) scale(0.95); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes pulseGlow {
                    0%, 100% { filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.3)); }
                    50% { filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.6)); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(1deg); }
                }

                @keyframes shimmer {
                    0% { background-position: -100% 0; }
                    100% { background-position: 200% 0; }
                }

                @keyframes rotateSlow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes wave {
                    0%, 100% { transform: translateX(0) translateY(0); }
                    25% { transform: translateX(10px) translateY(-10px); }
                    75% { transform: translateX(-10px) translateY(10px); }
                }

                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                .animate-pulse-glow {
                    animation: pulseGlow 3s ease-in-out infinite;
                }

                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 3s infinite;
                }

                .animate-rotate-slow {
                    animation: rotateSlow 20s linear infinite;
                }

                .animate-wave {
                    animation: wave 8s ease-in-out infinite;
                }

                .gradient-animate {
                    background-size: 200% 200%;
                    animation: gradientShift 8s ease infinite;
                }

                .particle {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: float var(--duration) ease-in-out infinite;
                    animation-delay: var(--delay);
                }

                .typewriter h1 {
                    overflow: hidden;
                    white-space: nowrap;
                    margin: 0 auto;
                    animation: typing 3.5s steps(40, end);
                }

                @keyframes typing {
                    from { width: 0; }
                    to { width: 100%; }
                }

                .logo-3d {
                    transition: transform 0.3s ease;
                    transform-style: preserve-3d;
                }

                .logo-3d:hover {
                    transform: perspective(1000px) rotateX(10deg) rotateY(10deg);
                }
            `}</style>

            {/* Modern Navigation Bar with Glass Morphism */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        {/* Animated Logo with 3D hover */}
                        <a
                            href="/"
                            className="flex items-center space-x-3 group"
                            style={{
                                transform: `perspective(1000px) rotateX(${mousePosition.y * 10}deg) rotateY(${mousePosition.x * 10}deg)`
                            }}
                        >
                            <div className="relative">
                                <div className="absolute -inset-2 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                                <img
                                    src={logo}
                                    alt="Mount Logo"
                                    className="relative h-12 w-auto object-contain transform group-hover:scale-110 transition-all duration-500 animate-float"
                                />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-naijaGreen group-hover:to-darkGreen transition-all duration-500">
                                Mount
                            </span>
                        </a>

                        {/* Desktop Navigation with Hover Effects */}
                        <div className="hidden lg:flex items-center space-x-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="relative text-gray-700 hover:text-naijaGreen font-medium transition-colors text-sm tracking-wide group"
                                >
                                    {link.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-naijaGreen to-darkGreen group-hover:w-full transition-all duration-300"></span>
                                </a>
                            ))}
                            <button
                                onClick={handleGetStartedClick}
                                className="relative bg-gradient-to-r from-naijaGreen to-darkGreen text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:shadow-naijaGreen/30 transition-all duration-300 text-sm overflow-hidden group"
                            >
                                <span className="relative z-10">Get Started</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-darkGreen to-naijaGreen opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute inset-0 animate-shimmer"></div>
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden text-gray-700 hover:text-naijaGreen relative w-10 h-10 flex items-center justify-center"
                        >
                            <div className={`absolute w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'}`}></div>
                            <div className={`absolute w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></div>
                            <div className={`absolute w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'}`}></div>
                        </button>
                    </div>

                    {/* Mobile Menu with Slide Animation */}
                    <div className={`lg:hidden transition-all duration-500 overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 border border-gray-100 shadow-xl">
                            <div className="flex flex-col space-y-3">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.name}
                                        href={link.href}
                                        className="text-gray-700 hover:text-naijaGreen font-medium py-2 px-4 hover:bg-gray-50 rounded-lg transition-all"
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
                                    className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Cinematic Hero Section with Parallax */}
            <section
                ref={heroRef}
                className="relative overflow-hidden bg-gradient-to-br from-naijaGreen via-naijaGreen to-darkGreen text-white gradient-animate"
            >
                {/* Animated Background Particles */}
                <div className="absolute inset-0 overflow-hidden">
                    {particles.map((particle) => (
                        <div
                            key={particle.id}
                            className="particle"
                            style={{
                                left: particle.left,
                                top: particle.top,
                                width: particle.size,
                                height: particle.size,
                                opacity: particle.opacity,
                                '--duration': particle.duration,
                                '--delay': particle.delay
                            }}
                        />
                    ))}

                    {/* Animated Gradient Orbs */}
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl animate-rotate-slow"></div>
                    <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-black/5 to-transparent rounded-full blur-3xl animate-rotate-slow" style={{ animationDelay: '-10s' }}></div>

                    {/* Geometric Patterns */}
                    <svg className="absolute inset-0 w-full h-full opacity-10">
                        <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="2" fill="white" className="animate-pulse">
                                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="3s" repeatCount="indefinite" />
                            </circle>
                        </pattern>
                        <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
                    </svg>
                </div>

                {/* 3D Parallax Content */}
                <div
                    className="container relative mx-auto px-4 py-20 md:py-32"
                    style={{
                        transform: `translateX(${mousePosition.x * 20}px) translateY(${mousePosition.y * 20}px)`,
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Animated Logo with 3D Effects */}
                        <div
                            ref={logoRef}
                            className="mb-8 flex justify-center perspective-1000"
                        >
                            <div className="relative transform-gpu animate-float">
                                <div className="absolute -inset-8 bg-gradient-to-r from-white/30 to-transparent rounded-full blur-2xl animate-pulse-glow"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-naijaGreen/50 to-darkGreen/50 rounded-full blur-xl animate-pulse"></div>
                                <div className="relative logo-3d">
                                    <img
                                        src={logo}
                                        alt="Mount Logo"
                                        className="h-32 md:h-40 w-auto object-contain filter drop-shadow-2xl"
                                    />

                                    {/* Animated rings around logo */}
                                    <svg className="absolute -inset-8 w-full h-full animate-rotate-slow" style={{ width: 'calc(100% + 4rem)', height: 'calc(100% + 4rem)', top: '-2rem', left: '-2rem' }}>
                                        <circle
                                            cx="50%"
                                            cy="50%"
                                            r="60"
                                            stroke="white"
                                            strokeWidth="1"
                                            fill="none"
                                            strokeDasharray="8 8"
                                            className="opacity-30"
                                        >
                                            <animate attributeName="r" values="60;70;60" dur="8s" repeatCount="indefinite" />
                                            <animate attributeName="stroke-dashoffset" values="0;100;0" dur="20s" repeatCount="indefinite" />
                                        </circle>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Animated Headline with Typing Effect */}
                        <div className="typewriter mb-6">
                            <h1 className="text-4xl md:text-7xl font-bold leading-tight bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                                Nigeria's Trusted Home Services
                            </h1>
                        </div>

                        {/* Animated Subheadline with Fade In */}
                        <p
                            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed opacity-0 animate-fade-in-up"
                            style={{ animation: 'fadeInUp 1s ease-out forwards', animationDelay: '0.5s' }}
                        >
                            Book verified professionals with secure payments, quality guarantees, and real-time tracking.
                        </p>

                        {/* Animated CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <button
                                onClick={handleGetStartedClick}
                                className="group relative bg-white text-naijaGreen font-bold py-4 px-12 rounded-full hover:bg-gray-50 transition-all duration-500 text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 overflow-hidden"
                            >
                                <span className="relative z-10">Get Started Free</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-naijaGreen/10 to-darkGreen/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100"></div>
                            </button>
                            <button
                                onClick={handleExploreServices}
                                className="group relative bg-transparent border-2 border-white/30 text-white font-bold py-4 px-12 rounded-full hover:bg-white/10 transition-all duration-500 text-lg backdrop-blur-sm transform hover:-translate-y-2 overflow-hidden"
                            >
                                <span className="relative z-10">Explore Services</span>
                                <div className="absolute inset-0 bg-white/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                            </button>
                        </div>

                        {/* Animated Scroll Indicator */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
                                <div className="w-1.5 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Curved Bottom Edge */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden">
                    <svg viewBox="0 0 1440 100" className="relative w-full h-16 md:h-24 fill-white">
                        <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,42.7C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,100L1392,100C1344,100,1248,100,1152,100C1056,100,960,100,864,100C768,100,672,100,576,100C480,100,384,100,288,100C192,100,96,100,48,100L0,100Z"></path>
                    </svg>
                </div>
            </section>

            {/* Services Grid with Scroll Reveal */}
            <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto max-w-6xl">
                    <div
                        className="text-center mb-16 opacity-0 animate-fade-in-up"
                        style={{ animation: 'fadeInUp 1s ease-out forwards' }}
                    >
                        <span className="text-naijaGreen font-semibold text-sm uppercase tracking-wider">Our Services</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2">
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
                                className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 text-center border border-gray-100 hover:border-transparent transform hover:-translate-y-2 hover:scale-105"
                                style={{
                                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
                                    opacity: 0
                                }}
                            >
                                <div className={`relative mb-4 inline-block`}>
                                    <div className={`absolute -inset-3 bg-gradient-to-r ${service.color} rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
                                    <div className="relative text-5xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                                        {service.icon}
                                    </div>
                                </div>
                                <div className="font-semibold text-gray-900 group-hover:text-naijaGreen transition-colors duration-300">
                                    {service.name}
                                </div>
                            </a>
                        ))}
                    </div>

                    <div className="text-center mt-16">
                        <a
                            href="/services"
                            className="inline-flex items-center text-naijaGreen font-semibold hover:text-darkGreen group text-lg relative"
                        >
                            View all services
                            <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-naijaGreen to-darkGreen group-hover:w-full transition-all duration-500"></span>
                        </a>
                    </div>
                </div>
            </section>

            {/* How It Works - Animated Cards */}
            <section className="py-24 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <span className="text-naijaGreen font-semibold text-sm uppercase tracking-wider">Simple Process</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 mt-2">
                            Simple, Secure, Stress-Free
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Our process ensures both customers and professionals are protected.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '1',
                                title: 'Post Job',
                                description: 'Describe what you need and set your budget. It\'s free to post.',
                                link: '/for-customers',
                                linkText: 'For Customers',
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                )
                            },
                            {
                                step: '2',
                                title: 'Secure Payment',
                                description: '50% deposit paid to our account. Pay balance when satisfied with the work.',
                                link: '/how-it-works',
                                linkText: 'How It Works',
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                )
                            },
                            {
                                step: '3',
                                title: 'Quality Guaranteed',
                                description: 'Verified professionals with reviews. We mediate any issues.',
                                link: '/for-providers',
                                linkText: 'For Providers',
                                icon: (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-5m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )
                            }
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="group relative"
                                style={{
                                    animation: `fadeInUp 0.5s ease-out ${index * 0.2}s forwards`,
                                    opacity: 0
                                }}
                            >
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                                <div className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 transform group-hover:-translate-y-2">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="text-4xl font-bold text-naijaGreen/20 group-hover:text-naijaGreen/30 transition-colors duration-500">
                                            {item.step}
                                        </div>
                                        <div className="w-12 h-12 bg-gradient-to-br from-naijaGreen/10 to-darkGreen/10 rounded-xl flex items-center justify-center text-naijaGreen group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                            {item.icon}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{item.title}</h3>
                                    <p className="text-gray-600 mb-6">{item.description}</p>
                                    <a href={item.link} className="inline-flex items-center text-naijaGreen font-medium hover:text-darkGreen group/link">
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

            {/* About & CEO Section with Reveal Animations */}
            <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div
                            className="opacity-0 animate-fade-in-left"
                            style={{ animation: 'fadeInLeft 1s ease-out forwards' }}
                        >
                            <span className="text-naijaGreen font-semibold text-sm uppercase tracking-wider">About Us</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 mt-2">
                                Trusted by Nigerians
                            </h2>
                            <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                                To transform how Nigerians find and book home services by creating a trusted marketplace
                                where quality meets convenience, and every transaction is secure and satisfactory.
                            </p>
                            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                                We're solving the challenges of finding reliable professionals, ensuring fair pricing,
                                and guaranteeing quality work through our secure platform.
                            </p>

                            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                                <h4 className="text-xl font-bold text-gray-900 mb-6">Why Choose Mount?</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        'All professionals verified & vetted',
                                        'Secure payment protection',
                                        'Quality guarantee & dispute resolution',
                                        'Real-time job tracking & updates'
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center group">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-green-200 transition-colors duration-300">
                                                <span className="text-green-600 text-sm font-bold transform group-hover:scale-110 transition-transform duration-300">✓</span>
                                            </div>
                                            <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex justify-center lg:justify-end opacity-0 animate-fade-in-right"
                            style={{ animation: 'fadeInRight 1s ease-out forwards', animationDelay: '0.3s' }}
                        >
                            <div className="relative max-w-md group">
                                <div className="absolute -inset-6 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
                                <div className="absolute -inset-4 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-3xl blur-xl opacity-30"></div>
                                <div className="relative bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 transform group-hover:scale-105 transition-all duration-700">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative mb-6">
                                            <div className="absolute -inset-3 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-full blur-xl opacity-30 animate-pulse"></div>
                                            <div className="relative">
                                                <img
                                                    src={ceoImage}
                                                    alt="Adelua Victor - Founder & CEO of Mount"
                                                    className="relative w-56 h-56 rounded-full object-cover border-4 border-white shadow-2xl transform group-hover:scale-105 transition-transform duration-700"
                                                />
                                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-full flex items-center justify-center border-4 border-white shadow-lg animate-pulse">
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM8.5 15H7.3l-2.1-3.1v3.1H4V9h1.2l2.1 3.1V9h1.2v6zm5.2-2.4h-2.1v1.2h2.1V15h-3.3V9h3.3v1.2h-2.1v1.1h2.1v1.3zm4.9 1.2c-.4.9-1.2 1.5-2.3 1.5-1.5 0-2.5-1-2.5-2.6v-.1c0-1.5 1-2.6 2.5-2.6 1.1 0 2 .7 2.3 1.5l-1 .5c-.2-.5-.7-.8-1.3-.8-1 0-1.5.7-1.5 1.5v.1c0 .8.5 1.5 1.5 1.5.7 0 1.2-.3 1.4-.8l1 .6z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900 mb-2">Adelua Victor</h3>
                                        <p className="text-naijaGreen font-semibold mb-6">Founder & CEO</p>
                                        <p className="text-gray-600 mb-8 italic leading-relaxed">
                                            "We started Mount because we experienced firsthand the challenges of finding reliable
                                            home services in Nigeria. Our goal is to build trust and make quality home services
                                            accessible to every Nigerian."
                                        </p>
                                        <div className="flex space-x-6">
                                            <a href="https://linkedin.com/company/mountltd" className="text-gray-400 hover:text-blue-600 transition-all duration-300 transform hover:scale-110">
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
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

            {/* Contact Section with Animated Cards */}
            <section className="py-24 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-16">
                        <span className="text-naijaGreen font-semibold text-sm uppercase tracking-wider">Get in Touch</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 mt-2">Ready to Get Started?</h2>
                        <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                            Have questions? Need support? Contact our team today.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                ),
                                title: 'Email',
                                content: 'mountservicesltd@gmail.com',
                                href: 'mailto:mountservicesltd@gmail.com'
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                ),
                                title: 'Phone',
                                content: '+234 813 967 2432',
                                href: 'tel:+2348139672432'
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                ),
                                title: 'Location',
                                content: 'Ogun State, Nigeria',
                                href: '/locations/ogun'
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                ),
                                title: 'Social',
                                content: '@mountltd',
                                href: 'https://instagram.com/mountltd'
                            }
                        ].map((item, index) => (
                            <a
                                key={index}
                                href={item.href}
                                className="group bg-white/5 hover:bg-white/10 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 text-center backdrop-blur-sm transform hover:-translate-y-2"
                                style={{
                                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
                                    opacity: 0
                                }}
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-naijaGreen/20 to-darkGreen/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                    <div className="text-naijaGreen group-hover:text-white transition-colors duration-500">
                                        {item.icon}
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                <div className="text-gray-400 group-hover:text-white transition-colors duration-300">
                                    {item.content}
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA with Animated Background */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-naijaGreen via-naijaGreen to-darkGreen gradient-animate"></div>
                <div className="absolute inset-0 bg-black/5"></div>

                {/* Animated Background Shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-rotate-slow"></div>
                    <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-white/5 rounded-full blur-3xl animate-rotate-slow" style={{ animationDelay: '-10s' }}></div>
                </div>

                <div className="container relative mx-auto max-w-4xl text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to Transform Your Home Services?</h2>
                    <p className="text-xl mb-10 max-w-2xl mx-auto text-white/90">
                        Trust Mount for your home service needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGetStartedClick}
                            className="group relative bg-white text-naijaGreen font-bold py-4 px-12 rounded-full hover:bg-gray-50 transition-all duration-500 text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 overflow-hidden"
                        >
                            <span className="relative z-10">Book a Service</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-naijaGreen/10 to-darkGreen/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                        </button>
                        <button
                            onClick={() => navigate('/for-providers')}
                            className="group relative bg-transparent border-2 border-white/50 text-white font-bold py-4 px-12 rounded-full hover:bg-white/10 transition-all duration-500 text-lg backdrop-blur-sm transform hover:-translate-y-2 overflow-hidden"
                        >
                            <span className="relative z-10">Become a Provider</span>
                            <div className="absolute inset-0 bg-white/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                        </button>
                    </div>
                </div>
            </section>

            {/* Modern Footer */}
            <footer className="bg-gray-900 text-white py-12 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                        <div className="flex items-center space-x-3 mb-6 md:mb-0 group">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-lg blur opacity-0 group-hover:opacity-70 transition-opacity duration-500"></div>
                                <img
                                    src={logo}
                                    alt="Mount Logo"
                                    className="relative h-10 w-auto object-contain transform group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Mount
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-8 justify-center">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-400 hover:text-white transition-colors text-sm relative group"
                                >
                                    {link.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-naijaGreen to-darkGreen group-hover:w-full transition-all duration-300"></span>
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
                        © {new Date().getFullYear()} Mount Ltd. All rights reserved. Built with trust in Nigeria.
                    </div>
                </div>
            </footer>

            {/* Add animation keyframes */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes fadeInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-fade-in-up {
                    animation: fadeInUp 0.8s ease-out forwards;
                }

                .animate-fade-in-left {
                    animation: fadeInLeft 0.8s ease-out forwards;
                }

                .animate-fade-in-right {
                    animation: fadeInRight 0.8s ease-out forwards;
                }

                .perspective-1000 {
                    perspective: 1000px;
                }

                .logo-3d {
                    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                }

                .logo-3d:hover {
                    transform: rotateX(10deg) rotateY(10deg) scale(1.1);
                }
            `}</style>
        </div>
    );
};

export default HomeOverviewPage;