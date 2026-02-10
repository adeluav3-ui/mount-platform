// src/components/seo/ServicePage.jsx - DYNAMIC SERVICE PAGE
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import logo from '../../assets/logo.png';

// Service data - same as in ServicesHubPage for consistency
const servicesData = {
    electrician: {
        name: 'Electrician',
        icon: '⚡',
        description: 'Find certified electricians for wiring, repairs, installations, and maintenance.',
        longDescription: 'Need reliable electrical services in Ogun State? Mount connects you with verified electricians who handle everything from simple repairs to complex installations. All our electricians are certified, insured, and background-checked to ensure quality work and your safety.',
        problems: [
            'Frequent power trips or circuit breaker issues',
            'Faulty wiring or electrical sockets',
            'Lighting installation and repairs',
            'Electrical appliance installation',
            'Electrical safety inspections'
        ],
        solutions: [
            'Certified electricians with proper tools',
            'Safe and compliant electrical work',
            'Transparent pricing upfront',
            'Work guaranteed for 90 days',
            'Real-time job tracking'
        ],
        faqs: [
            {
                question: 'How much does electrical work cost?',
                answer: 'Costs vary based on the job complexity. Simple repairs start from ₦5,000, while installations can range from ₦15,000 to ₦100,000+. Get free quotes from verified electricians on Mount.'
            },
            {
                question: 'Are your electricians certified?',
                answer: 'Yes! All electricians on Mount are certified and verified. We check their qualifications, insurance, and previous work history before approving them.'
            },
            {
                question: 'What areas in Ogun State do you cover?',
                answer: 'We cover all major areas including Abeokuta, Sango-Ota, Ijebu-Ode, Sagamu, Ifo, and surrounding locations.'
            }
        ]
    },
    plumber: {
        name: 'Plumber',
        icon: '🔧',
        description: 'Professional plumbing services including leaks, installations, and drainage systems.',
        longDescription: 'From leaky faucets to complete plumbing installations, find trusted plumbers in Ogun State through Mount. Our verified plumbers handle residential and commercial plumbing with expertise and professionalism.',
        problems: [
            'Leaking pipes or faucets',
            'Blocked drains or toilets',
            'Low water pressure issues',
            'Water heater installation/repair',
            'Bathroom and kitchen plumbing'
        ],
        solutions: [
            'Licensed and experienced plumbers',
            'Modern plumbing equipment',
            'Permanent solutions, not quick fixes',
            'Clean work areas maintained',
            'Follow-up support included'
        ],
        faqs: [
            {
                question: 'How quickly can a plumber arrive?',
                answer: 'Most plumbers can arrive within 2-4 hours during business hours. Emergency services available for urgent issues.'
            },
            {
                question: 'Do you offer plumbing installation services?',
                answer: 'Yes! Our plumbers handle complete installations including bathrooms, kitchens, and outdoor plumbing systems.'
            }
        ]
    },
    // We'll add more services later, starting with these two
};

export default function ServicePage() {
    const { serviceSlug } = useParams();
    const [service, setService] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (serviceSlug && servicesData[serviceSlug]) {
            setService(servicesData[serviceSlug]);
        } else {
            // If service not found, redirect to services hub
            window.location.href = '/services';
        }
    }, [serviceSlug]);

    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-naijaGreen mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading service information...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <SimpleHelmet
                title={`${service.name} Services in Ogun State | Book Verified ${service.name}s | Mount`}
                description={`Find verified ${service.name.toLowerCase()} services in Ogun State. ${service.description} Book with secure payments and quality guarantees.`}
                canonical={`https://mountltd.com/services/${serviceSlug}`}
            />

            {/* Reuse the same header from ServicesHubPage */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-5">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-4 group">
                            <div className="relative">
                                <img
                                    src={logo}
                                    alt="Mount"
                                    className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                            <div className="hidden lg:block">
                                <div className="font-bold text-2xl text-gray-800 tracking-tight">Mount</div>
                                <div className="text-xs text-gray-500 font-medium tracking-wide">TRUSTED HOME SERVICES</div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-10">
                            <Link to="/services" className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200">
                                Services
                            </Link>
                            <Link to="/how-it-works" className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200">
                                How It Works
                            </Link>
                            <Link to="/for-customers" className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200">
                                For Customers
                            </Link>
                            <Link to="/for-providers" className="font-semibold text-gray-700 hover:text-naijaGreen transition-colors duration-200">
                                For Providers
                            </Link>
                        </nav>

                        {/* CTA Button */}
                        <div className="hidden lg:block">
                            <a
                                href="/login"
                                className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white px-6 py-3 rounded-lg font-bold hover:shadow-xl transition-all duration-300"
                            >
                                Get Started
                            </a>
                        </div>

                        {/* Mobile Menu Button */}
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

                    {/* Mobile Menu */}
                    <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="py-6 border-t border-gray-100">
                            <nav className="flex flex-col space-y-4">
                                <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">Services</span>
                                </Link>
                                <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">How It Works</span>
                                </Link>
                                <Link to="/for-customers" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">For Customers</span>
                                </Link>
                                <Link to="/for-providers" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">For Providers</span>
                                </Link>
                                <div className="pt-4 mt-4 border-t border-gray-100">
                                    <a href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full bg-gradient-to-r from-naijaGreen to-darkGreen text-white py-3 px-4 rounded-lg font-bold text-center">
                                        Get Started Free
                                    </a>
                                </div>
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            {/* Service Hero Section */}
            <section className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center">
                            <div className="md:w-2/3 mb-8 md:mb-0">
                                <div className="mb-4">
                                    <Link to="/services" className="inline-flex items-center text-white/80 hover:text-white transition">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Back to Services
                                    </Link>
                                </div>
                                <div className="flex items-center mb-6">
                                    <span className="text-4xl md:text-5xl mr-4">{service.icon}</span>
                                    <div>
                                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                                            {service.name} Services in Ogun State
                                        </h1>
                                        <p className="text-xl opacity-90">{service.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                    <a
                                        href="/#postJob"
                                        className="bg-white text-naijaGreen px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition-all text-center"
                                    >
                                        Book a {service.name}
                                    </a>
                                    <a
                                        href="/how-it-works"
                                        className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-naijaGreen transition-all text-center"
                                    >
                                        How Booking Works
                                    </a>
                                </div>
                            </div>
                            <div className="md:w-1/3 md:pl-8">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                    <h3 className="text-xl font-bold mb-4">Quick Service</h3>
                                    <ul className="space-y-3">
                                        <li className="flex items-center">
                                            <span className="text-green-300 mr-3">✓</span>
                                            <span>Verified {service.name.toLowerCase()}s</span>
                                        </li>
                                        <li className="flex items-center">
                                            <span className="text-green-300 mr-3">✓</span>
                                            <span>Secure escrow payments</span>
                                        </li>
                                        <li className="flex items-center">
                                            <span className="text-green-300 mr-3">✓</span>
                                            <span>90-day work guarantee</span>
                                        </li>
                                        <li className="flex items-center">
                                            <span className="text-green-300 mr-3">✓</span>
                                            <span>Real-time tracking</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Service Details */}
            <section className="py-12 md:py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                            {/* Problems Section */}
                            <div>
                                <div className="bg-red-50 rounded-2xl p-6 md:p-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Common {service.name} Problems</h2>
                                    <ul className="space-y-4">
                                        {service.problems.map((problem, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="text-red-500 mt-1 mr-3">⚠️</span>
                                                <span className="text-gray-700">{problem}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Solutions Section */}
                            <div>
                                <div className="bg-green-50 rounded-2xl p-6 md:p-8">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6">How Mount Solves These</h2>
                                    <ul className="space-y-4">
                                        {service.solutions.map((solution, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="text-green-500 mt-1 mr-3">✅</span>
                                                <span className="text-gray-700">{solution}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Long Description */}
                        <div className="mt-12 md:mt-16">
                            <div className="prose prose-lg max-w-none">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">About Our {service.name} Services</h2>
                                <p className="text-gray-600 mb-6">{service.longDescription}</p>
                                <p className="text-gray-600">
                                    With Mount, you get more than just a service provider. You get a trusted partner who guarantees quality work, transparent pricing, and ongoing support. Our escrow payment system ensures your money is protected until you're satisfied with the work.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 md:py-16 bg-gradient-to-r from-naijaGreen/10 to-darkGreen/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                            Ready to Hire a Verified {service.name}?
                        </h2>
                        <p className="text-gray-600 mb-8 text-lg">
                            Get free quotes from pre-vetted professionals in your area. No obligation, transparent pricing.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/login"
                                className="bg-naijaGreen text-white px-8 py-3 rounded-lg font-bold hover:bg-darkGreen transition text-lg"
                            >
                                Get Started Free
                            </a>
                            <a
                                href="/how-it-works"
                                className="border-2 border-naijaGreen text-naijaGreen px-8 py-3 rounded-lg font-bold hover:bg-naijaGreen hover:text-white transition text-lg"
                            >
                                Learn How It Works
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reuse the same footer from ServicesHubPage */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                            <div className="mb-6 md:mb-0">
                                <div className="flex items-center space-x-3 mb-4">
                                    <img src={logo} alt="Mount" className="h-12 w-auto bg-white p-2 rounded-lg" />
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
        </>
    );
}