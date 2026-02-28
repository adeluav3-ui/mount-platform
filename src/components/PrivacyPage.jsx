// src/components/PrivacyPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
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
                    <div className="bg-gradient-to-r from-green-600 to-green-800 p-8">
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">
                            Privacy & Cookies Policy
                        </h1>
                        <p className="text-white/90 mt-2">
                            NDPA 2023 Compliant • Last Updated: 29-01-2026
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <div className="prose prose-green max-w-none">
                            {/* Copy all content from PrivacyPolicy.jsx here */}

                            {/* Section 1: Introduction */}
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-3">1. Introduction</h2>
                                <p className="mb-2">
                                    Mount Limited ("Mount", "we", "our", "us") is a technology-enabled marketplace that connects customers with independent service providers.
                                    This Privacy & Cookies Policy explains how we collect, use, store, and protect your personal data when you use our platform,
                                    including our use of cookies and similar technologies.
                                </p>
                                <p>
                                    This policy should be read together with our Terms and Conditions.
                                </p>
                            </div>

                            {/* Continue with all sections from PrivacyPolicy.jsx */}
                            {/* ... copy all sections 2-14 here ... */}

                            {/* Footer Info */}
                            <div className="border-t pt-4 mt-6 text-xs text-gray-600">
                                <p>
                                    <strong>Effective Date:</strong> 01-02-26<br />
                                    <strong>Last Updated:</strong> 29-01-2026<br />
                                    <strong>Compliance:</strong> Nigeria Data Protection Act (NDPA) 2023
                                </p>
                            </div>

                            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-600">
                                    For privacy-related questions, contact us at:{' '}
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

export default PrivacyPage;