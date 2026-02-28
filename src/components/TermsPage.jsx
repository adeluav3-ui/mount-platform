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

                            {/* Section 2: ACCEPTANCE OF TERMS */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    2. ACCEPTANCE OF TERMS
                                </h3>
                                <div className="space-y-2">
                                    <p>By creating an Account, submitting a service request, accepting a quote, or making any payment on the Platform, you confirm that:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>You are at least 18 years of age;</li>
                                        <li>You have the legal capacity to enter into a binding contract; and</li>
                                        <li>You agree to comply with these Terms and all applicable Nigerian laws and regulations.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Section 3: NATURE OF THE AGREEMENT */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    3. NATURE OF THE AGREEMENT
                                </h3>
                                <p>
                                    Mount provides a marketplace and facilitation service only. We do not perform, supervise, or control the services provided by Service Providers. Any service agreement entered into is strictly between the Customer and the Service Provider, subject to these Terms.
                                </p>
                            </div>

                            {/* Section 4: SCOPE OF SERVICES */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    4. SCOPE OF SERVICES
                                </h3>
                                <div className="space-y-2">
                                    <p>Mount operates a digital marketplace that enables Customers to:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Request services from verified Service Providers;</li>
                                        <li>Receive and compare quotes from Service Providers;</li>
                                        <li>Make payments through the Platform in accordance with Mount's payment structure; and</li>
                                        <li>Access dispute resolution support where necessary.</li>
                                    </ul>
                                    <p>
                                        Mount does not itself provide the services listed on the Platform. All services are performed solely by independent Service Providers.
                                    </p>
                                </div>
                            </div>

                            {/* Section 5: PLATFORM ROLE AND DISCLAIMER */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    5. PLATFORM ROLE AND DISCLAIMER
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">a. Marketplace Role</h4>
                                        <p>Mount acts solely as an intermediary platform facilitating interactions between Customers and Service Providers. Mount is not a party to any service agreement entered into between a Customer and a Service Provider.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">b. No Employment or Agency Relationship</h4>
                                        <p>Nothing in these Terms shall be construed as creating an employment relationship, a partnership, a joint venture, or an agency relationship between Mount and any Service Provider.</p>
                                        <p className="mt-1">Service Providers operate as independent contractors and are solely responsible for the services they provide.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">c. No Guarantee of Outcomes</h4>
                                        <p>While Mount takes reasonable steps to verify Service Providers, we do not guarantee:</p>
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                            <li>The quality, suitability, legality, or completion of any service;</li>
                                            <li>That services will meet a Customer's expectations; or</li>
                                            <li>That a Service Provider will be available at any specific time.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">d. Service Listings and Quotes</h4>
                                        <p>All service descriptions, quotes, timelines, and deliverables are provided by Service Providers. Mount does not warrant the accuracy or completeness of such information.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 6: MODIFICATION OR SUSPENSION OF PLATFORM */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    6. MODIFICATION OR SUSPENSION OF PLATFORM
                                </h3>
                                <div className="space-y-2">
                                    <p>Mount reserves the right to:</p>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>Modify, update, suspend, or discontinue any aspect of the Platform at any time;</li>
                                        <li>Restrict access to certain features or services without prior notice where required for security, legal, or operational reasons.</li>
                                    </ul>
                                    <p>Such actions shall not give rise to any liability on the part of Mount.</p>
                                </div>
                            </div>

                            {/* Section 7: PROMOTIONAL OFFERS */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    7. PROMOTIONAL OFFERS
                                </h3>
                                <p>
                                    Mount may, at its discretion, offer promotional benefits, including but not limited to: service fee waivers, discounted Platform Fees, or limited-time offers for new or existing users.
                                </p>
                                <p className="mt-2">
                                    Promotional offers are subject to specific terms and may be withdrawn or modified at any time without notice.
                                </p>
                            </div>

                            {/* Section 8: ACCOUNT REGISTRATION */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    8. ACCOUNT REGISTRATION
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">a. Account Creation</h4>
                                        <p>To access and use the Platform, you must create an Account by providing accurate, complete, and up-to-date information as requested by Mount.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">b. Single Account Policy</h4>
                                        <p>Each user is permitted to maintain only one Account unless otherwise approved by Mount in writing. Duplicate or fraudulent accounts may be suspended or terminated without notice.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">c. Account Accuracy</h4>
                                        <p>You are solely responsible for ensuring that all information provided during registration remains accurate and current. Mount shall not be liable for any loss arising from inaccurate or outdated information supplied by you.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 9: ACCOUNT SECURITY */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    9. ACCOUNT SECURITY
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">a. User Responsibility</h4>
                                        <p>You are responsible for safeguarding your login credentials and for all activities conducted through your Account.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">b. Unauthorized Access</h4>
                                        <p>You must notify Mount immediately upon becoming aware of any unauthorized use of your Account or suspected security breach. Mount shall not be liable for losses arising from unauthorized access caused by your negligence.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 10: SUSPENSION OR RESTRICTION, TERMINATION AND BREACH */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    10. SUSPENSION, RESTRICTION, TERMINATION AND BREACH
                                </h3>
                                <p>
                                    Mount reserves the right, at its sole discretion, to suspend, restrict, or terminate your Account and access to the Platform, with or without notice, where:
                                </p>
                                <ul className="list-disc pl-4 mt-2 space-y-1">
                                    <li>You breach any provision of these Terms or related policies;</li>
                                    <li>You fail to meet payment obligations or engage in payment disputes in bad faith;</li>
                                    <li>You provide false, misleading, or incomplete information;</li>
                                    <li>There is suspected fraud, abuse, unlawful activity, or security risk;</li>
                                    <li>Your continued use of the Platform may expose Mount or other users to legal, financial, or reputational risk.</li>
                                </ul>
                                <p className="mt-2">
                                    Termination or suspension shall not affect Mount's right to recover outstanding fees, enforce payment obligations, or pursue legal remedies available under applicable law.
                                </p>
                            </div>

                            {/* Section 11: YOUR RESPONSIBILITIES */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    11. YOUR RESPONSIBILITIES
                                </h3>
                                <p>By using our services, you agree to:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Adhere to the Terms and Conditions of Mount and its subsidiaries;</li>
                                    <li>Provide accurate and up-to-date information about you and your business where necessary;</li>
                                    <li>Comply with all applicable laws and regulations, including those related to data privacy and consumer protection;</li>
                                    <li>Safeguard your login credentials and account information.</li>
                                </ul>
                            </div>

                            {/* Section 12: DATA PRIVACY */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    12. DATA PRIVACY
                                </h3>
                                <div className="space-y-2">
                                    <p>
                                        We will collect and process personal data in accordance with applicable privacy laws and our Privacy & Cookies Policy. Any information that you or other users provide to Us is subject to our Privacy & Cookies Policy, which governs our collection and use of your information.
                                    </p>
                                    <p>
                                        You understand that through your use of the Services you consent to the collection and use (as outlined in the Privacy & Cookies Policy) of this information, including the transfer of this information to the Federal Republic of Nigeria or other countries for storage, processing and use by Us.
                                    </p>
                                    <p>
                                        As part of providing you with the Services, we may need to provide you with certain communications, such as service announcements and administrative messages. These communications are considered part of the Services, which you may not be able to opt-out from receiving.
                                    </p>
                                </div>
                            </div>

                            {/* Section 13: SERVICE PROVIDER VERIFICATION */}
                            <div>
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    13. SERVICE PROVIDER VERIFICATION
                                </h3>
                                <div className="space-y-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">a. Enhanced Verification</h4>
                                        <p>Service Providers may be subject to enhanced verification, including but not limited to:</p>
                                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                            <li>Submission of professional credentials or certifications;</li>
                                            <li>Proof of business registration (where applicable);</li>
                                            <li>Bank account verification for payment purposes.</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">b. Ongoing Compliance</h4>
                                        <p>
                                            Mount reserves the right to re-verify Service Providers periodically or request additional documentation at any time. Failure to comply may result in suspension or removal from the Platform.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 14: LIMITATION OF LIABILITY */}
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                                <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                    14. LIMITATION OF LIABILITY
                                </h3>
                                <p className="text-sm italic mb-2">
                                    Please read this section carefully as it limits the liability of Mount Ltd, its directors, officers, employees, agents, affiliates, partners, and licensors.
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">a. Services Provided on an "AS-IS" and "AS-AVAILABLE" Basis</h4>
                                        <p>Your access to and use of the Platform is at your own risk. The Platform is provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">b. Third-Party Services and Service Providers</h4>
                                        <p>Mount does not perform, control, supervise, or guarantee the services provided by Service Providers. Mount shall not be liable for acts, omissions, or disputes arising between Customers and Service Providers.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold text-gray-700 mb-1">c. Limitation of Liability</h4>
                                        <p>
                                            To the maximum extent permitted by law, Mount's aggregate liability shall not exceed the total Platform fees actually paid by you in respect of the transaction giving rise to the claim, or ₦100,000 (One Hundred Thousand Naira), whichever is lower.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sections 15-19 (Concise) */}
                            <div className="space-y-3">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">15. PAYMENT PROCESSING</h3>
                                    <p>All payments must be completed using approved payment methods. You authorize Mount to process payments in accordance with these Terms.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">16. NO CIRCUMVENTION</h3>
                                    <p>Users shall not attempt to bypass the Platform's payment system. Any such attempt may result in immediate Account suspension or termination.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">17. CHANGES TO TERMS</h3>
                                    <p>We reserve the right to update these Terms at any time. Your continued use constitutes acceptance of revised terms.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">18. FORCE MAJEURE</h3>
                                    <p>Mount shall not be liable for failures arising from events beyond its reasonable control including natural disasters, government actions, or system failures.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">19. SEVERABILITY</h3>
                                    <p>If any provision is held invalid, the remaining provisions continue in full force and effect.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">20. WAIVER</h3>
                                    <p>Failure to enforce any right does not constitute a waiver unless stated in writing.</p>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-1">21. CONTACT INFORMATION</h3>
                                    <p>For questions or concerns, contact us at <strong>info@mountltd.com</strong>.</p>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">22. ENTIRE AGREEMENT</h3>
                                    <p>
                                        These Terms, together with the Privacy & Cookies Policy, constitute the entire agreement between you and Mount Ltd and supersede all prior or contemporaneous agreements.
                                    </p>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">23. ACCEPTANCE</h3>
                                    <p>
                                        By accessing or using the Platform, you acknowledge that you have read, understood, and agreed to be bound by these Terms and Conditions.
                                    </p>
                                    <p className="mt-2 font-semibold">
                                        If you do not agree with any part of these Terms, you must refrain from using the Platform.
                                    </p>
                                </div>
                            </div>

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