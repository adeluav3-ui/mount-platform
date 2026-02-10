// src/components/seo/HowItWorksPage.jsx - MOBILE OPTIMIZED
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import logo from '../../assets/logo.png';
import { trackSEOButtonClick, trackSEOClick } from '../../utils/ga4';
import { useScrollTracking } from '../../hooks/useScrollTracking';
import SchemaMarkup from '../seo/SchemaMarkup';

export default function HowItWorksPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('customer');

    const stepsForCustomers = [
        {
            number: '01',
            title: 'Post Your Job',
            description: 'Describe what you need, add photos, and set your budget. No commitment required.',
            icon: '📝',
            details: 'Simply fill out our job form with details about the service you need. You can include photos to help providers understand the scope of work.'
        },
        {
            number: '02',
            title: 'Receive Quotes',
            description: 'Get quotes from verified professionals in your area. Compare prices and reviews.',
            icon: '💰',
            details: 'Verified providers will send you quotes within hours. You can review their profiles, ratings, and previous work before deciding.'
        },
        {
            number: '03',
            title: 'Choose & Pay Securely',
            description: 'Select your preferred provider and pay 50% deposit.',
            icon: '🔒',
            details: 'Your payment is tracked by the admin throughout the work process. This protects both you and the service provider.'
        },
        {
            number: '04',
            title: 'Work Gets Done',
            description: 'Provider completes the work with real-time updates and communication.',
            icon: '🔧',
            details: 'Track progress through our platform. Communicate directly with your provider and get photo updates.'
        },
        {
            number: '05',
            title: 'Approve & Release Payment',
            description: 'Review the completed work and release the remaining payment when satisfied.',
            icon: '✅',
            details: 'Only approve payment when you\'re completely satisfied. Your deposit ensures quality work.'
        },
        {
            number: '06',
            title: 'Leave a Review',
            description: 'Share your experience to help others find reliable professionals.',
            icon: '⭐',
            details: 'Your feedback helps maintain quality standards and helps other customers make informed decisions.'
        }
    ];

    const stepsForProviders = [
        {
            number: '01',
            title: 'Create Your Profile',
            description: 'Sign up and create a professional profile showcasing your skills and experience.',
            icon: '👤',
            details: 'Upload your certifications, portfolio photos, and set up your service areas and specialties.'
        },
        {
            number: '02',
            title: 'Get Verified',
            description: 'Complete our verification process to build trust with customers.',
            icon: '✅',
            details: 'We verify your identity, qualifications, and previous work to ensure you\'re a trusted professional.'
        },
        {
            number: '03',
            title: 'Receive Job Requests',
            description: 'Get notified of relevant jobs in your area and service category.',
            icon: '📨',
            details: 'We match you with jobs that fit your skills and location. You\'ll receive instant notifications.'
        },
        {
            number: '04',
            title: 'Submit Your Quote',
            description: 'Review job details and submit your professional quote.',
            icon: '💰',
            details: 'Provide detailed quotes with breakdowns. Customers appreciate transparency in pricing.'
        },
        {
            number: '05',
            title: 'Get Hired & Start Work',
            description: 'Once selected, receive 50% deposit and begin the job.',
            icon: '🔧',
            details: 'The customer\'s deposit is secured, ensuring you get paid for your work.'
        },
        {
            number: '06',
            title: 'Complete & Get Paid',
            description: 'Submit completed work, get final payment, and build your reputation.',
            icon: '💳',
            details: 'Receive the remaining 50% upon customer approval. Build your rating for more opportunities.'
        }
    ];

    const features = [
        {
            icon: '🛡️',
            title: 'Secure Payments',
            description: 'Payments are secured throughout the work process. Both parties protected.'
        },
        {
            icon: '✅',
            title: 'Verified Professionals',
            description: 'All providers are vetted for qualifications and experience.'
        },
        {
            icon: '💰',
            title: 'Transparent Pricing',
            description: 'No hidden fees. See all costs upfront before committing.'
        },
        {
            icon: '📱',
            title: 'Real-time Tracking',
            description: 'Track job progress and communicate directly with providers.'
        },
        {
            icon: '⭐',
            title: 'Quality Guarantee',
            description: 'Work not satisfactory? We help resolve issues at no extra cost.'
        },
        {
            icon: '📞',
            title: 'Dedicated Support',
            description: 'Our team is here to help throughout the entire process.'
        }
    ];

    <SchemaMarkup type="howto" />

    const handleGetStartedClick = () => {
        trackSEOButtonClick('Get Started Guide', '/how-it-works');
        trackSEOClick('how-it-works', 'get-started-guide');
        navigate('/login', { state: { from: 'seo-how-it-works' } });
    };
    useScrollTracking(window.location.pathname);

    return (
        <>
            <SimpleHelmet
                title="How Mount Works | Secure Home Services Booking in Nigeria"
                description="Learn how Mount makes home services safe and reliable. From posting jobs to secure payments and quality guarantees - see how it works."
                canonical="https://mountltd.com/how-it-works"
            />

            <div className="min-h-screen bg-white">
                {/* Header - Mobile Optimized */}
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between py-4 md:py-5">
                            <Link to="/" className="flex items-center space-x-2 md:space-x-4 group">
                                <img src={logo} alt="Mount" className="h-10 md:h-12 w-auto" />
                                <div className="hidden lg:block">
                                    <div className="font-bold text-2xl text-gray-800">Mount</div>
                                    <div className="text-xs text-gray-500">TRUSTED HOME SERVICES</div>
                                </div>
                            </Link>

                            <nav className="hidden lg:flex items-center space-x-8 md:space-x-10">
                                <Link to="/services" className="font-semibold text-gray-700 hover:text-naijaGreen transition text-sm md:text-base">
                                    Services
                                </Link>
                                <Link to="/locations/ogun" className="font-semibold text-gray-700 hover:text-naijaGreen transition text-sm md:text-base">
                                    Ogun State
                                </Link>
                                <Link to="/how-it-works" className="font-semibold text-naijaGreen transition text-sm md:text-base">
                                    How It Works
                                </Link>
                            </nav>

                            <div className="hidden lg:block">
                                <a href="/login" className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-bold hover:shadow-xl transition text-sm md:text-base">
                                    Get Started
                                </a>
                            </div>

                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden flex flex-col items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-50 hover:bg-gray-100 transition"
                                aria-label="Toggle menu"
                            >
                                <span className={`w-5 md:w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                                <span className={`w-5 md:w-6 h-0.5 bg-gray-700 my-1 md:my-1.5 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                                <span className={`w-5 md:w-6 h-0.5 bg-gray-700 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                            </button>
                        </div>

                        {/* Mobile Menu */}
                        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="py-4 md:py-6 border-t border-gray-100">
                                <nav className="flex flex-col space-y-3 md:space-y-4">
                                    <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-2.5 md:py-3 px-4 rounded-lg hover:bg-gray-50 transition">
                                        <span className="font-medium text-gray-700 text-sm md:text-base">Services</span>
                                    </Link>
                                    <Link to="/locations/ogun" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-2.5 md:py-3 px-4 rounded-lg hover:bg-gray-50 transition">
                                        <span className="font-medium text-gray-700 text-sm md:text-base">Ogun State</span>
                                    </Link>
                                    <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-2.5 md:py-3 px-4 rounded-lg hover:bg-gray-50 transition">
                                        <span className="font-medium text-gray-700 text-sm md:text-base">How It Works</span>
                                    </Link>
                                    <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-gray-100">
                                        <a href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full bg-gradient-to-r from-naijaGreen to-darkGreen text-white py-2.5 md:py-3 px-4 rounded-lg font-bold text-center text-sm md:text-base hover:shadow-lg transition">
                                            Get Started Free
                                        </a>
                                    </div>
                                </nav>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Mobile Optimized */}
                <section className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white py-8 md:py-12 lg:py-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto text-center">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight">
                                How Mount Works
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl mb-6 md:mb-8 max-w-3xl mx-auto opacity-90 px-2">
                                Nigeria's trusted home services marketplace. Simple, secure, and designed for your peace of mind.
                            </p>

                            {/* Tab Navigation - Mobile Optimized */}
                            <div className="flex justify-center mb-6 md:mb-8">
                                <div className="inline-flex rounded-lg bg-white/10 backdrop-blur-sm p-1">
                                    <button
                                        onClick={() => setActiveTab('customer')}
                                        className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold transition text-sm md:text-base ${activeTab === 'customer' ? 'bg-white text-naijaGreen' : 'text-white hover:bg-white/10'}`}
                                    >
                                        For Customers
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('provider')}
                                        className={`px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold transition text-sm md:text-base ${activeTab === 'provider' ? 'bg-white text-naijaGreen' : 'text-white hover:bg-white/10'}`}
                                    >
                                        For Providers
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Steps Section - Mobile Optimized */}
                <section className="py-8 md:py-12 lg:py-16 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-8 md:mb-12 text-center px-2">
                                {activeTab === 'customer' ? 'How to Book a Service' : 'How to Grow Your Business'}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                                {(activeTab === 'customer' ? stepsForCustomers : stepsForProviders).map((step, index) => (
                                    <div key={index} className="relative">
                                        {/* Step Number - Responsive */}
                                        <div className="absolute -top-3 -left-3 w-10 h-10 md:w-12 md:h-12 bg-naijaGreen text-white rounded-full flex items-center justify-center font-bold text-lg md:text-xl z-10">
                                            {step.number}
                                        </div>

                                        {/* Step Card - Responsive */}
                                        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 pt-8 md:pt-10 hover:shadow-xl transition-shadow duration-300 h-full">
                                            <div className="text-3xl md:text-4xl mb-3 md:mb-4">{step.icon}</div>
                                            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3 leading-tight">{step.title}</h3>
                                            <p className="text-gray-600 text-sm md:text-base mb-3 md:mb-4 leading-relaxed">{step.description}</p>
                                            <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-100">
                                                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{step.details}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Mobile Optimized */}
                <section className="py-8 md:py-12 lg:py-16 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-8 md:mb-12 text-center px-2">
                                Why Mount is Different
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                {features.map((feature, index) => (
                                    <div key={index} className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition">
                                        <div className="text-2xl md:text-3xl mb-3 md:mb-4">{feature.icon}</div>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3">{feature.title}</h3>
                                        <p className="text-gray-600 text-sm md:text-base">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comparison Section - Mobile Optimized */}
                <section className="py-8 md:py-12 lg:py-16 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8 text-center px-2">
                                Traditional vs. Mount
                            </h2>

                            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                <div className="min-w-full">
                                    <div className="bg-gray-50">
                                        <div className="grid grid-cols-3">
                                            <div className="py-3 md:py-4 px-3 md:px-6 text-left font-bold text-gray-800 text-sm md:text-base">Aspect</div>
                                            <div className="py-3 md:py-4 px-3 md:px-6 text-left font-bold text-gray-800 text-sm md:text-base">Traditional Method</div>
                                            <div className="py-3 md:py-4 px-3 md:px-6 text-left font-bold text-naijaGreen text-sm md:text-base">Mount Platform</div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-200">
                                        {[
                                            { aspect: 'Finding Providers', traditional: 'Word of mouth, guesswork', mount: 'Verified professionals, reviews' },
                                            { aspect: 'Pricing', traditional: 'Unclear, often negotiable', mount: 'Transparent quotes upfront' },
                                            { aspect: 'Payment Security', traditional: 'Cash upfront, no protection', mount: 'Secure Payments, pay when satisfied' },
                                            { aspect: 'Quality Assurance', traditional: 'No guarantees', mount: '90-day work guarantee' },
                                            { aspect: 'Communication', traditional: 'Phone calls, no tracking', mount: 'In-app messaging, progress updates' },
                                            { aspect: 'Dispute Resolution', traditional: 'Difficult, no mediator', mount: 'Platform mediation, fair resolution' }
                                        ].map((row, index) => (
                                            <div key={index} className="grid grid-cols-3 hover:bg-gray-50">
                                                <div className="py-3 md:py-4 px-3 md:px-6 font-medium text-gray-800 text-sm md:text-base">{row.aspect}</div>
                                                <div className="py-3 md:py-4 px-3 md:px-6 text-gray-600 text-sm md:text-base">
                                                    <div className="flex items-center">
                                                        <span className="text-red-500 mr-2 text-sm">❌</span>
                                                        {row.traditional}
                                                    </div>
                                                </div>
                                                <div className="py-3 md:py-4 px-3 md:px-6 text-gray-600 text-sm md:text-base">
                                                    <div className="flex items-center">
                                                        <span className="text-green-500 mr-2 text-sm">✅</span>
                                                        {row.mount}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section - Mobile Optimized */}
                <section className="py-8 md:py-12 lg:py-16 bg-gradient-to-r from-naijaGreen/10 to-darkGreen/10">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6 px-2">
                                Ready to Experience the Difference?
                            </h2>
                            <p className="text-gray-600 mb-6 md:mb-8 text-base md:text-lg px-2">
                                Join thousands of Nigerians who trust Mount for secure, reliable home services.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                                <a
                                    href="/login"
                                    className="bg-naijaGreen text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold hover:bg-darkGreen transition text-base md:text-lg"
                                >
                                    Get Started Free
                                </a>
                                <a
                                    href="/services"
                                    className="border-2 border-naijaGreen text-naijaGreen px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-bold hover:bg-naijaGreen hover:text-white transition text-base md:text-lg"
                                >
                                    Browse Services
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section - Mobile Optimized */}
                <section className="py-8 md:py-12 lg:py-16 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8 text-center px-2">
                                Frequently Asked Questions
                            </h2>

                            <div className="space-y-3 md:space-y-4">
                                {[
                                    {
                                        q: 'Are all providers verified?',
                                        a: 'Yes! Every provider on Mount undergoes identity verification, qualification checks, and background screening. We also verify their previous work and customer reviews.'
                                    },
                                    {
                                        q: 'What if I\'m not satisfied with the work?',
                                        a: 'We offer a 90-day work guarantee. If you\'re not satisfied, we\'ll work with the provider to fix the issues at no extra cost to you. Your payment is protected until you\'re happy.'
                                    },
                                    {
                                        q: 'How quickly can I get a service provider?',
                                        a: 'Most jobs receive quotes within 2-4 hours. Once you accept a quote, providers can typically start within 24-48 hours, depending on the job complexity.'
                                    },
                                    {
                                        q: 'Is there a fee for using Mount?',
                                        a: 'For customers, we charge a small service fee (based on job amount) for the platform, secure payments, and quality guarantee. For providers, we charge a 5% commission on completed jobs.'
                                    }
                                ].map((faq, index) => (
                                    <div key={index} className="border border-gray-200 rounded-2xl p-4 md:p-6">
                                        <h3 className="font-bold text-gray-800 mb-2 text-base md:text-lg">{faq.q}</h3>
                                        <p className="text-gray-600 text-sm md:text-base">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer - Mobile Optimized */}
                <footer className="bg-gray-900 text-white py-8 md:py-12">
                    <div className="container mx-auto px-4">
                        <div className="max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 md:mb-8 gap-6 md:gap-0">
                                <div className="mb-4 md:mb-0">
                                    <div className="flex items-center space-x-3 mb-3 md:mb-4">
                                        <img src={logo} alt="Mount" className="h-10 md:h-12 w-auto bg-white p-1.5 md:p-2 rounded-lg" />
                                        <div>
                                            <div className="font-bold text-lg md:text-xl">Mount</div>
                                            <div className="text-gray-400 text-xs md:text-sm">Nigeria's Trusted Home Services</div>
                                        </div>
                                    </div>
                                    <p className="text-gray-400 max-w-md text-sm md:text-base">
                                        Connecting verified service professionals with homeowners through secure payments and quality guarantees.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                                    <div>
                                        <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Learn More</h4>
                                        <ul className="space-y-1.5 md:space-y-2">
                                            <li><Link to="/how-it-works" className="text-gray-400 hover:text-white transition text-xs md:text-sm">How It Works</Link></li>
                                            <li><Link to="/locations/ogun" className="text-gray-400 hover:text-white transition text-xs md:text-sm">Ogun State</Link></li>
                                            <li><Link to="/services" className="text-gray-400 hover:text-white transition text-xs md:text-sm">All Services</Link></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">For You</h4>
                                        <ul className="space-y-1.5 md:space-y-2">
                                            <li><Link to="/for-customers" className="text-gray-400 hover:text-white transition text-xs md:text-sm">For Customers</Link></li>
                                            <li><Link to="/for-providers" className="text-gray-400 hover:text-white transition text-xs md:text-sm">For Providers</Link></li>
                                            <li><a href="/login" className="text-gray-400 hover:text-white transition text-xs md:text-sm">Get Started</a></li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-3 md:mb-4 text-sm md:text-base">Support</h4>
                                        <ul className="space-y-1.5 md:space-y-2">
                                            <li><a href="/contact" className="text-gray-400 hover:text-white transition text-xs md:text-sm">Contact Us</a></li>
                                            <li><a href="/help" className="text-gray-400 hover:text-white transition text-xs md:text-sm">Help Center</a></li>
                                            <li><a href="/privacy" className="text-gray-400 hover:text-white transition text-xs md:text-sm">Privacy Policy</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-gray-400 text-xs md:text-sm">
                                <p>© {new Date().getFullYear()} Mount. All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}