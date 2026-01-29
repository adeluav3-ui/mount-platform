// src/components/PrivacyPolicy.jsx - UPDATED WITH COOKIES POLICY
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PrivacyPolicy = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-green-600 to-green-800 p-4 sm:p-6 sticky top-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                                            Privacy & Cookies Policy
                                        </h2>
                                        <p className="text-white/90 text-xs sm:text-sm mt-0.5">
                                            NDPA 2023 Compliant • Mount Ltd
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white text-xl sm:text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-gray-700 text-sm sm:text-base space-y-6">

                                {/* Introduction */}
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">1. Introduction</h3>
                                    <p>
                                        Mount Limited ("Mount", "we", "our", "us") is a technology-enabled marketplace that connects customers with independent service providers.
                                        This Privacy & Cookies Policy explains how we collect, use, store, and protect your personal data when you use our platform,
                                        including our use of cookies and similar technologies.
                                    </p>
                                    <p className="mt-2">
                                        This policy should be read together with our Terms and Conditions.
                                    </p>
                                </div>

                                {/* Data Controller */}
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">2. Data Controller</h3>
                                    <p>
                                        <strong>Company:</strong> Mount Limited<br />
                                        <strong>Email:</strong> mountservicesltd@gmail.com
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
                                        Requests can be made via: <strong>mountservicesltd@gmail.com</strong>
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
                                <div className="border-t pt-4 text-xs text-gray-600">
                                    <p>
                                        <strong>Effective Date:</strong> 28-01-26<br />
                                        <strong>Last Updated:</strong> 29-01-2026<br />
                                        <strong>Compliance:</strong> Nigeria Data Protection Act (NDPA) 2023
                                    </p>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
                                >
                                    Close Privacy & Cookies Policy
                                </button>
                                <p className="text-center text-gray-500 text-xs sm:text-sm mt-3">
                                    Contact: mountservicesltd@gmail.com
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PrivacyPolicy;