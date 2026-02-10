// src/components/seo/HomeOverviewPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import { trackSEOButtonClick } from '../../utils/ga4';
import ceoImage from '../../assets/CEO.jpg'; // Import CEO image

const HomeOverviewPage = () => {
    const navigate = useNavigate();

    const handleGetStartedClick = () => {
        trackSEOButtonClick('Get Started Main', '/home');
        navigate('/login', { state: { from: 'seo-home-overview' } });
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

    const stats = [
        { number: '500+', label: 'Verified Professionals' },
        { number: '2,000+', label: 'Jobs Completed' },
        { number: '4.8★', label: 'Average Rating' },
        { number: '₦50M+', label: 'Processed through Escrow' }
    ];

    return (
        <div className="min-h-screen bg-white">
            <SimpleHelmet
                title="Mount - Nigeria's Trusted Home Services Marketplace"
                description="Book verified electricians, plumbers, cleaners & more in Nigeria. Secure escrow payments, quality guarantees, real-time tracking. Serving Ogun State."
                canonical="/home"
            />

            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="w-10 h-10 bg-naijaGreen rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-xl">M</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">Mount</h1>
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <a href="/services" className="text-gray-700 hover:text-naijaGreen font-medium">Services</a>
                            <a href="/how-it-works" className="text-gray-700 hover:text-naijaGreen font-medium">How It Works</a>
                            <a href="/for-customers" className="text-gray-700 hover:text-naijaGreen font-medium">For Customers</a>
                            <a href="/for-providers" className="text-gray-700 hover:text-naijaGreen font-medium">For Providers</a>
                            <a href="/locations/ogun" className="text-gray-700 hover:text-naijaGreen font-medium">Ogun State</a>
                            <a href="#contact" className="text-gray-700 hover:text-naijaGreen font-medium">Contact Us</a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-naijaGreen to-darkGreen text-white py-20 px-4">
                <div className="container mx-auto max-w-6xl text-center">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Nigeria's Trusted Home Services Marketplace
                    </h1>
                    <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto opacity-90">
                        Connecting verified service professionals with homeowners through secure escrow payments, quality guarantees, and real-time tracking.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGetStartedClick}
                            className="bg-white text-naijaGreen font-bold py-4 px-10 rounded-lg hover:bg-gray-100 transition-colors text-lg shadow-lg"
                        >
                            Get Started Free
                        </button>
                        <button
                            onClick={handleExploreServices}
                            className="bg-transparent border-2 border-white text-white font-bold py-4 px-10 rounded-lg hover:bg-white/10 transition-colors text-lg"
                        >
                            Explore Services
                        </button>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Overview */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            10+ Home Services Available
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            From electrical work to plumbing, cleaning to logistics - find trusted professionals for any home service need.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {serviceCategories.map((service, index) => (
                            <a
                                key={index}
                                href={`/services/${service.slug}`}
                                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow text-center border border-gray-100 hover:border-naijaGreen/20"
                            >
                                <div className="text-3xl mb-3">{service.icon}</div>
                                <div className="font-medium text-gray-900">{service.name}</div>
                            </a>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <a
                            href="/services"
                            className="inline-flex items-center text-naijaGreen font-bold hover:text-darkGreen"
                        >
                            View all services details
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* How It Works Summary */}
            <section className="py-16 px-4 bg-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Simple, Secure, Stress-Free
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Our process ensures both customers and professionals are protected.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white p-8 rounded-xl shadow-md">
                            <div className="text-naijaGreen text-2xl font-bold mb-4">1. Post Job</div>
                            <p className="text-gray-600 mb-6">Describe what you need and set your budget. It's free to post.</p>
                            <a href="/for-customers" className="text-naijaGreen font-medium hover:text-darkGreen">
                                For Customers →
                            </a>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-md">
                            <div className="text-naijaGreen text-2xl font-bold mb-4">2. Secure Payment</div>
                            <p className="text-gray-600 mb-6">50% deposit held in escrow. Pay only when satisfied with the work.</p>
                            <a href="/how-it-works" className="text-naijaGreen font-medium hover:text-darkGreen">
                                How It Works →
                            </a>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-md">
                            <div className="text-naijaGreen text-2xl font-bold mb-4">3. Quality Guaranteed</div>
                            <p className="text-gray-600 mb-6">Verified professionals with reviews. We mediate any issues.</p>
                            <a href="/for-providers" className="text-naijaGreen font-medium hover:text-darkGreen">
                                For Providers →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* About & Team Section */}
            <section className="py-16 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Trusted by Nigerians
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            Built with transparency and trust at our core.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h3>
                            <p className="text-gray-600 mb-6">
                                To transform how Nigerians find and book home services by creating a trusted marketplace
                                where quality meets convenience, and every transaction is secure and satisfactory.
                            </p>
                            <p className="text-gray-600 mb-8">
                                We're solving the challenges of finding reliable professionals, ensuring fair pricing,
                                and guaranteeing quality work through our secure platform.
                            </p>

                            <div className="bg-gray-50 p-6 rounded-xl">
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Why Choose Mount?</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-center">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-green-600 text-sm">✓</span>
                                        </div>
                                        <span className="text-gray-700">All professionals verified & vetted</span>
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-green-600 text-sm">✓</span>
                                        </div>
                                        <span className="text-gray-700">Secure escrow payment protection</span>
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-green-600 text-sm">✓</span>
                                        </div>
                                        <span className="text-gray-700">Quality guarantee & dispute resolution</span>
                                    </li>
                                    <li className="flex items-center">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-green-600 text-sm">✓</span>
                                        </div>
                                        <span className="text-gray-700">Real-time job tracking & updates</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-8 rounded-xl">
                            <div className="flex flex-col items-center text-center">
                                <img
                                    src={ceoImage}
                                    alt="Adelua Victor - Founder & CEO of Mount"
                                    className="w-48 h-48 rounded-full object-cover mb-6 border-4 border-white shadow-lg"
                                />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Adelua Victor</h3>
                                <p className="text-naijaGreen font-medium mb-4">Founder & CEO</p>
                                <p className="text-gray-600 mb-6">
                                    "We started Mount because we experienced firsthand the challenges of finding reliable
                                    home services in Nigeria. Our goal is to build trust and make quality home services
                                    accessible to every Nigerian."
                                </p>
                                <div className="flex space-x-4">
                                    <a href="https://linkedin.com/company/mountltd" className="text-gray-400 hover:text-blue-600">
                                        <span className="sr-only">LinkedIn</span>
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-16 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Contact Mount</h2>
                        <p className="text-gray-300 text-lg max-w-3xl mx-auto">
                            Have questions? Need support? Get in touch with our team.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-naijaGreen/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Email</h3>
                            <a href="mailto:mountservicesltd@gmail.com" className="text-gray-300 hover:text-white">
                                mountservicesltd@gmail.com
                            </a>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 bg-naijaGreen/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Phone</h3>
                            <div className="space-y-1">
                                <a href="tel:+2348139672432" className="text-gray-300 hover:text-white block">
                                    +234 813 967 2432
                                </a>
                                <a href="tel:+2349037590136" className="text-gray-300 hover:text-white block">
                                    +234 903 759 0136
                                </a>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 bg-naijaGreen/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Location</h3>
                            <p className="text-gray-300">Serving Ogun State, Nigeria</p>
                            <a href="/locations/ogun" className="text-naijaGreen hover:text-green-400 text-sm mt-2 inline-block">
                                View coverage areas →
                            </a>
                        </div>

                        <div className="text-center">
                            <div className="w-12 h-12 bg-naijaGreen/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Follow Us</h3>
                            <div className="flex justify-center space-x-4">
                                <a href="https://instagram.com/mountltd" className="text-gray-300 hover:text-pink-500">
                                    <span className="sr-only">Instagram</span>
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                                <a href="https://tiktok.com/@mountltd" className="text-gray-300 hover:text-black">
                                    <span className="sr-only">TikTok</span>
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                    </svg>
                                </a>
                                <a href="https://linkedin.com/company/mountltd" className="text-gray-300 hover:text-blue-600">
                                    <span className="sr-only">LinkedIn</span>
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 px-4 bg-gradient-to-r from-naijaGreen to-darkGreen text-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Trust Mount for your home service needs.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={handleGetStartedClick}
                            className="bg-white text-naijaGreen font-bold py-4 px-10 rounded-lg hover:bg-gray-100 transition-colors text-lg"
                        >
                            Book a Service
                        </button>
                        <button
                            onClick={() => navigate('/for-providers')}
                            className="bg-transparent border-2 border-white text-white font-bold py-4 px-10 rounded-lg hover:bg-white/10 transition-colors text-lg"
                        >
                            Become a Provider
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomeOverviewPage;