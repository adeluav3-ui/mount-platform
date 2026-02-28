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

                            {/* Data Controller */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">2. Data Controller</h3>
                                <p>
                                    <strong>Company:</strong> Mount Limited<br />
                                    <strong>Email:</strong> info@mountltd.com
                                </p>
                            </div>

                            {/* Data We Collect */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">3. Data We Collect</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Identity data (name, date of birth, ID for verification)</li>
                                    <li>Contact data (email, phone number, address)</li>
                                    <li>Account data (login credentials, profile info)</li>
                                    <li>Transaction data (jobs, service requests, quotes, payments)</li>
                                    <li>Verification data (business documents, certifications, ID)</li>
                                    <li>Technical data (IP address, device info, usage logs, cookies)</li>
                                    <li>Communication data (messages, reviews, support requests)</li>
                                </ul>
                            </div>

                            {/* Purpose of Data Collection */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">4. Purpose of Data Collection</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Account creation and management</li>
                                    <li>Identity and business verification</li>
                                    <li>Service matching and job processing</li>
                                    <li>Payment processing</li>
                                    <li>Fraud prevention and security</li>
                                    <li>Customer support and dispute handling</li>
                                    <li>Legal and regulatory compliance</li>
                                    <li>Platform improvement and analytics</li>
                                    <li>User experience personalization</li>
                                </ul>
                            </div>

                            {/* Legal Basis for Processing */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">5. Legal Basis for Processing</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Your consent (for non-essential cookies and similar technologies)</li>
                                    <li>Performance of a contract</li>
                                    <li>Legal obligations</li>
                                    <li>Legitimate business interests (security, fraud prevention, platform integrity)</li>
                                </ul>
                            </div>

                            {/* Verification Data */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">6. Verification Data</h3>
                                <p>
                                    We may collect government-issued ID and business documents strictly for identity verification, fraud prevention, compliance,
                                    and platform security. Access is restricted and data is securely stored.
                                </p>
                            </div>

                            {/* COOKIES POLICY SECTION - NEW */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">7. Cookies & Similar Technologies</h3>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">What Are Cookies?</h4>
                                        <p>
                                            Cookies are small text files stored on your device (computer, smartphone, tablet) when you visit or use our Platform.
                                            They help platforms remember user preferences, enable core functionality, improve performance, enhance security,
                                            and provide analytics.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Types of Cookies We Use</h4>
                                        <div className="ml-4 space-y-2">
                                            <div>
                                                <h5 className="font-medium text-gray-700">a. Strictly Necessary Cookies</h5>
                                                <p className="text-sm">Essential for the Platform to function. Cannot be disabled.</p>
                                                <ul className="list-disc pl-4 text-sm space-y-0.5 mt-1">
                                                    <li>User authentication and login sessions</li>
                                                    <li>Account security and fraud prevention</li>
                                                    <li>Payment processing and platform stability</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h5 className="font-medium text-gray-700">b. Functional Cookies</h5>
                                                <p className="text-sm">Improve your experience by remembering preferences.</p>
                                            </div>

                                            <div>
                                                <h5 className="font-medium text-gray-700">c. Performance & Analytics Cookies</h5>
                                                <p className="text-sm">Help us understand how users interact with the Platform for improvements.</p>
                                            </div>

                                            <div>
                                                <h5 className="font-medium text-gray-700">d. Security Cookies</h5>
                                                <p className="text-sm">Detect suspicious activity and protect accounts.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Why We Use Cookies</h4>
                                        <ul className="list-disc pl-4 text-sm space-y-0.5">
                                            <li>Operate and maintain the Platform</li>
                                            <li>Enable secure logins and process payments</li>
                                            <li>Prevent fraud and abuse</li>
                                            <li>Improve user experience and platform performance</li>
                                            <li>Analyze platform usage for improvements</li>
                                            <li>Meet legal and regulatory obligations</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Third-Party Cookies</h4>
                                        <p className="text-sm">
                                            Some cookies may be placed by third-party services (payment processors, analytics providers, security services).
                                            Mount does not control third-party cookie practices.
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">Cookie Management</h4>
                                        <p className="text-sm">
                                            You can control cookies through your browser or device settings. However, disabling strictly necessary cookies
                                            may affect Platform functionality and service availability.
                                        </p>
                                        <p className="text-sm mt-1">
                                            By using our Platform, you consent to our use of cookies as described in this policy.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Data Sharing */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">8. Data Sharing</h3>
                                <p>We may share data only with:</p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Payment processors</li>
                                    <li>Verification partners</li>
                                    <li>Regulatory authorities (where required by law)</li>
                                    <li>Service providers strictly for job fulfillment</li>
                                    <li>Third-party cookie providers (as described in Section 7)</li>
                                </ul>
                                <p className="mt-2">
                                    We do not sell user data.
                                </p>
                            </div>

                            {/* Marketplace Disclaimer */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">9. Marketplace Disclaimer</h3>
                                <p>
                                    Mount is a marketplace platform only. We do not control, supervise, or perform services.
                                    Personal data shared between customers and service providers is at their discretion and responsibility.
                                </p>
                            </div>

                            {/* Data Security */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">10. Data Security</h3>
                                <p>
                                    We apply technical and organizational security measures to protect data, including encryption,
                                    access controls, monitoring systems, and secure storage.
                                </p>
                            </div>

                            {/* Data Retention */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">11. Data Retention</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Active accounts: retained while active</li>
                                    <li>Verification records: retained as required by law</li>
                                    <li>Transaction records: retained for regulatory compliance</li>
                                    <li>Inactive accounts: deleted after regulatory retention periods</li>
                                    <li>Cookie data: retained according to cookie type and purpose</li>
                                </ul>
                            </div>

                            {/* User Rights */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">12. User Rights</h3>
                                <p>
                                    You have the right to access, correct, delete, restrict, or object to processing of your data,
                                    including cookie data where applicable.
                                </p>
                                <p className="mt-1">
                                    Requests can be made via: <strong>info@mountltd.com</strong>
                                </p>
                            </div>

                            {/* International Transfers */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">13. International Transfers</h3>
                                <p>
                                    Data may be processed within or outside Nigeria where required for platform operations,
                                    subject to appropriate legal safeguards.
                                </p>
                            </div>

                            {/* Changes to Policy */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">14. Changes to Policy</h3>
                                <p>
                                    We may update this Privacy & Cookies Policy. Continued use of the platform constitutes acceptance of changes.
                                </p>
                            </div>

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