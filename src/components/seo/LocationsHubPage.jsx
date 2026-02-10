// src/components/seo/LocationsHubPage.jsx - OGUN STATE FOCUSED
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import logo from '../../assets/logo.png';

export default function LocationsHubPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const ogunAreas = [
        'Abeokuta', 'Sango-Ota', 'Ijebu-Ode', 'Sagamu', 'Ota',
        'Mowe-Ibafo', 'Ewekoro', 'Ilaro', 'Ifo', 'Owode', 'Odeda',
        'Ijebu-Igbo', 'Aiyetoro', 'Wasimi', 'Itori', 'Akaka'
    ];

    const serviceLocations = [
        { service: 'Electrician', slug: 'electrician-ogun', icon: '⚡' },
        { service: 'Plumber', slug: 'plumber-ogun', icon: '🔧' },
        { service: 'Cleaning', slug: 'cleaning-ogun', icon: '🧹' },
        { service: 'AC Repair', slug: 'ac-repair-ogun', icon: '❄️' },
        { service: 'Painting', slug: 'painting-ogun', icon: '🎨' },
        { service: 'Carpenter', slug: 'carpenter-ogun', icon: '🪚' },
        { service: 'Pest Control', slug: 'pest-control-ogun', icon: '🐜' },
        { service: 'Roofing', slug: 'roofing-ogun', icon: '🏠' },
        { service: 'Logistics', slug: 'logistics-ogun', icon: '🚚' },
        { service: 'Hair Styling', slug: 'hair-styling-ogun', icon: '💇' }
    ];

    return (
        <>
            <SimpleHelmet
                title="Home Services in Ogun State | All Areas Covered | Mount"
                description="Find verified home service professionals across Ogun State. We cover Abeokuta, Sango-Ota, Ijebu-Ode, Sagamu, and all major areas. Book with secure payments."
                canonical="https://mountltd.com/locations/ogun"
            />

            {/* Reuse the same header structure */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-5">
                        <Link to="/" className="flex items-center space-x-4 group">
                            <img src={logo} alt="Mount" className="h-12 w-auto" />
                            <div className="hidden lg:block">
                                <div className="font-bold text-2xl text-gray-800">Mount</div>
                                <div className="text-xs text-gray-500">TRUSTED HOME SERVICES</div>
                            </div>
                        </Link>

                        <nav className="hidden lg:flex items-center space-x-10">
                            <Link to="/services" className="font-semibold text-gray-700 hover:text-naijaGreen transition">
                                Services
                            </Link>
                            <Link to="/locations/ogun" className="font-semibold text-naijaGreen transition">
                                Ogun State
                            </Link>
                            <Link to="/how-it-works" className="font-semibold text-gray-700 hover:text-naijaGreen transition">
                                How It Works
                            </Link>
                        </nav>

                        <div className="hidden lg:block">
                            <a href="/login" className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white px-6 py-3 rounded-lg font-bold hover:shadow-xl transition">
                                Get Started
                            </a>
                        </div>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 hover:bg-gray-100"
                            aria-label="Toggle menu"
                        >
                            <span className={`w-6 h-0.5 bg-gray-700 transition ${isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                            <span className={`w-6 h-0.5 bg-gray-700 my-1.5 transition ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                            <span className={`w-6 h-0.5 bg-gray-700 transition ${isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`lg:hidden overflow-hidden transition-all ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="py-6 border-t border-gray-100">
                            <nav className="flex flex-col space-y-4">
                                <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">Services</span>
                                </Link>
                                <Link to="/locations/ogun" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">Ogun State</span>
                                </Link>
                                <Link to="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center py-3 px-4 rounded-lg hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">How It Works</span>
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

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white py-12 md:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-center">
                            <div className="md:w-2/3 mb-8 md:mb-0">
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                    Home Services Across Ogun State
                                </h1>
                                <p className="text-xl mb-6 opacity-90">
                                    We serve all major areas including Abeokuta, Sango-Ota, Ijebu-Ode, Sagamu, and surrounding locations.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <a href="/#postJob" className="bg-white text-naijaGreen px-6 py-3 rounded-lg font-bold hover:bg-gray-50 transition text-center">
                                        Book a Service
                                    </a>
                                    <a href="/services" className="border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white hover:text-naijaGreen transition text-center">
                                        Browse Services
                                    </a>
                                </div>
                            </div>
                            <div className="md:w-1/3 md:pl-8 mt-8 md:mt-0">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                    <h3 className="text-xl font-bold mb-4">Coverage Area</h3>
                                    <div className="flex items-center mb-3">
                                        <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                                        <span className="font-medium">All of Ogun State</span>
                                    </div>
                                    <p className="text-white/80 text-sm">
                                        Verified professionals ready to serve you anywhere in the state.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Areas We Serve */}
            <section className="py-12 md:py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
                            Areas We Serve in Ogun State
                        </h2>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {ogunAreas.map((area, index) => (
                                <div key={index} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200 hover:border-naijaGreen transition">
                                    <div className="text-naijaGreen mb-2">📍</div>
                                    <p className="font-medium text-gray-800">{area}</p>
                                </div>
                            ))}
                        </div>

                        <p className="text-center text-gray-600 mt-8">
                            And many more areas! If you're in Ogun State, we can serve you.
                        </p>
                    </div>
                </div>
            </section>

            {/* Service-Location Combinations */}
            <section className="py-12 md:py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center">
                            Popular Services in Ogun State
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {serviceLocations.map((item, index) => (
                                <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
                                    <div className="flex items-center mb-4">
                                        <span className="text-3xl mr-4">{item.icon}</span>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{item.service}</h3>
                                            <p className="text-gray-600">Service in Ogun State</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        Find verified {item.service.toLowerCase()}s across all areas of Ogun State.
                                    </p>
                                    <Link
                                        to={`/services/${item.service.toLowerCase().replace(' ', '-')}`}
                                        className="text-naijaGreen font-medium inline-flex items-center hover:text-darkGreen"
                                    >
                                        Find {item.service}s
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 md:py-16 bg-gradient-to-r from-naijaGreen/10 to-darkGreen/10">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
                            Ready to Book a Service in Ogun State?
                        </h2>
                        <p className="text-gray-600 mb-8 text-lg">
                            No matter where you are in Ogun State, we connect you with verified professionals.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a href="/login" className="bg-naijaGreen text-white px-8 py-3 rounded-lg font-bold hover:bg-darkGreen transition text-lg">
                                Get Started Free
                            </a>
                            <a href="/services" className="border-2 border-naijaGreen text-naijaGreen px-8 py-3 rounded-lg font-bold hover:bg-naijaGreen hover:text-white transition text-lg">
                                Browse All Services
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reuse the same footer */}
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
                                        <li><Link to="/services/electrician" className="text-gray-400 hover:text-white transition">Electricians</Link></li>
                                        <li><Link to="/services/plumber" className="text-gray-400 hover:text-white transition">Plumbers</Link></li>
                                        <li><Link to="/services/cleaning" className="text-gray-400 hover:text-white transition">Cleaning</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-4">Company</h4>
                                    <ul className="space-y-2">
                                        <li><Link to="/locations/ogun" className="text-gray-400 hover:text-white transition">Ogun State</Link></li>
                                        <li><Link to="/how-it-works" className="text-gray-400 hover:text-white transition">How It Works</Link></li>
                                        <li><Link to="/for-customers" className="text-gray-400 hover:text-white transition">For Customers</Link></li>
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