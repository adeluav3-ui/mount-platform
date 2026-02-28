// src/components/TermsPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import TermsAndConditions from './TermsAndConditions';

const TermsPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-naijaGreen">Mount</span>
                        </Link>
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="text-gray-700 hover:text-naijaGreen transition">
                                Home
                            </Link>
                            <Link to="/app" className="bg-naijaGreen text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-darkGreen transition">
                                Go to App
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-naijaGreen to-darkGreen p-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">
                            Terms and Conditions
                        </h1>
                        <p className="text-white/90 mt-2">
                            Last Updated: 28-01-26
                        </p>
                    </div>

                    {/* Content - Reuse the modal content but without the checkbox */}
                    <div className="p-8">
                        <div className="prose prose-green max-w-none">
                            {/* Copy the content from TermsAndConditions.jsx but without the checkbox */}
                            {/* Start from Section 1: INTRODUCTION to Section 23: ACCEPTANCE */}

                            {/* Important Notice */}
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 pt-0.5">
                                        <span className="text-red-500">⚠️</span>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="font-bold text-red-800">
                                            LEGAL AGREEMENT
                                        </h3>
                                        <p className="text-red-700 text-sm mt-0.5">
                                            By using our platform, you enter into a legally binding agreement with Mount Limited.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 1: INTRODUCTION */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-3">1. INTRODUCTION</h2>
                                <p className="mb-2">
                                    These Terms and Conditions ("Terms") govern your access to and use of the Mount Ltd platform, website, mobile application, and related services (collectively, the "Platform").
                                </p>
                                <p className="mb-2">
                                    Mount Limited ("Mount", "we", "our", or "us") is a technology-enabled marketplace that connects customers seeking services with independent, verified service providers. By accessing or using the Platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms, our Privacy & Cookies Policy, and any other policies referenced herein.
                                </p>
                                <p>
                                    These Terms constitute a legally binding agreement between you and Mount Limited. If you do not agree to any part of these Terms, you must not access or use the Platform.
                                </p>
                            </div>

                            {/* Continue with all sections from TermsAndConditions.jsx */}
                            {/* ... copy all sections 2-23 here ... */}

                            {/* Footer note */}
                            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    For questions about these Terms, contact us at:{' '}
                                    <a href="mailto:info@mountltd.com" className="text-naijaGreen hover:underline">
                                        info@mountltd.com
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <Link to="/" className="text-naijaGreen hover:underline">
                                ← Back to Home
                            </Link>
                            <Link to="/app" className="bg-naijaGreen text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-darkGreen transition">
                                Continue to App
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-600 text-sm">
                            © 2025 Mount Limited. All rights reserved.
                        </p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <Link to="/privacy" className="text-gray-600 hover:text-naijaGreen text-sm">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-gray-600 hover:text-naijaGreen text-sm">
                                Terms of Service
                            </Link>
                            <Link to="/contact" className="text-gray-600 hover:text-naijaGreen text-sm">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default TermsPage;