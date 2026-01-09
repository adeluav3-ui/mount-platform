// src/components/PrivacyPolicy.jsx - NDPC 2023 COMPLIANT
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PrivacyPolicy = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3 sm:p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sm:p-6 sticky top-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                                            Privacy Policy
                                        </h2>
                                        <p className="text-white/90 text-xs sm:text-sm mt-0.5">
                                            Nigeria Data Protection Commission (NDPC) 2023 Compliant
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white hover:text-blue-200 text-xl sm:text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <div className="space-y-4 text-gray-700 text-sm sm:text-base">
                                    {/* Compliance Banner */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <span className="text-blue-600">🔒</span>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="font-bold text-blue-800 text-sm sm:text-base">
                                                    NDPC 2023 Compliance Statement
                                                </h3>
                                                <p className="text-blue-700 text-xs sm:text-sm mt-1">
                                                    This Privacy Policy complies with the Nigeria Data Protection Act 2023 and regulations issued by the Nigeria Data Protection Commission (NDPC). We are committed to protecting your personal data in accordance with Nigerian law.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 1 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            1. Data Controller Information
                                        </h3>
                                        <p className="mb-2">
                                            <strong>Data Controller:</strong> Mount Platform<br />
                                            <strong>Registration:</strong> [Your Company Registration Number]<br />
                                            <strong>Data Protection Officer:</strong> [Name of DPO or Contact Person]<br />
                                            <strong>Email:</strong> privacy@mountplatform.ng<br />
                                            <strong>Address:</strong> [Your Physical Address]
                                        </p>
                                    </div>

                                    {/* Section 2 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            2. Personal Data We Collect
                                        </h3>
                                        <p className="mb-2">We collect the following categories of personal data:</p>
                                        <ul className="list-disc pl-5 space-y-1 mb-2">
                                            <li><strong>Identity Data:</strong> Full name, government-issued ID (for verification), date of birth</li>
                                            <li><strong>Contact Data:</strong> Email address, phone number, residential address</li>
                                            <li><strong>Financial Data:</strong> Bank transfer details, payment history</li>
                                            <li><strong>Transaction Data:</strong> Job details, service requests, quotes</li>
                                            <li><strong>Technical Data:</strong> IP address, device information, browser type</li>
                                            <li><strong>Usage Data:</strong> How you use our platform, preferences</li>
                                        </ul>
                                    </div>

                                    {/* Section 3 - Government ID Specific */}
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            3. Government ID Collection & Verification
                                        </h3>
                                        <p className="mb-2">
                                            <strong>Purpose of Collection:</strong> We collect government-issued IDs (International Passport, Driver's License, National ID Card, or Voter's Card) for:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1 mb-2">
                                            <li>Identity verification to prevent fraud</li>
                                            <li>Compliance with anti-money laundering regulations</li>
                                            <li>Ensuring service provider and customer authenticity</li>
                                            <li>Dispute resolution and legal compliance</li>
                                        </ul>
                                        <p className="mb-2">
                                            <strong>Storage & Security:</strong> ID documents are encrypted and stored securely. Access is restricted to authorized personnel only.
                                        </p>
                                        <p className="text-xs sm:text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                                            <strong>⚠️ Important:</strong> We never share your ID documents with third parties except as required by law or with your explicit consent.
                                        </p>
                                    </div>

                                    {/* Section 4 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            4. Legal Basis for Processing (NDPC Compliance)
                                        </h3>
                                        <p className="mb-2">We process your personal data based on the following legal grounds under NDPA 2023:</p>
                                        <ul className="list-disc pl-5 space-y-1 mb-2">
                                            <li><strong>Consent:</strong> When you explicitly agree to data processing</li>
                                            <li><strong>Contract Performance:</strong> To fulfill our service agreement with you</li>
                                            <li><strong>Legal Obligation:</strong> To comply with Nigerian laws and regulations</li>
                                            <li><strong>Legitimate Interests:</strong> For fraud prevention and platform security</li>
                                        </ul>
                                    </div>

                                    {/* Section 5 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            5. Your Data Protection Rights (NDPA Rights)
                                        </h3>
                                        <p className="mb-2">Under NDPA 2023, you have the right to:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                            <div className="bg-gray-50 p-2 rounded">
                                                <strong>Right to Access</strong><br />
                                                Request copies of your personal data
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <strong>Right to Rectification</strong><br />
                                                Correct inaccurate personal data
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <strong>Right to Erasure</strong><br />
                                                Request deletion of your personal data
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <strong>Right to Restrict Processing</strong><br />
                                                Limit how we use your data
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <strong>Right to Data Portability</strong><br />
                                                Receive your data in structured format
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <strong>Right to Object</strong><br />
                                                Object to certain types of processing
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            To exercise these rights, contact: privacy@mountplatform.ng
                                        </p>
                                    </div>

                                    {/* Section 6 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            6. Data Retention Period
                                        </h3>
                                        <p className="mb-2">We retain personal data only as long as necessary:</p>
                                        <ul className="list-disc pl-5 space-y-1 mb-2">
                                            <li><strong>Active Accounts:</strong> While your account is active</li>
                                            <li><strong>Government IDs:</strong> 7 years from last verification (legal requirement)</li>
                                            <li><strong>Transaction Records:</strong> 7 years (tax compliance)</li>
                                            <li><strong>Inactive Accounts:</strong> Deleted after 2 years of inactivity</li>
                                        </ul>
                                    </div>

                                    {/* Section 7 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            7. Data Security Measures
                                        </h3>
                                        <p className="mb-2">We implement appropriate technical and organizational measures:</p>
                                        <ul className="list-disc pl-5 space-y-1 mb-2">
                                            <li>End-to-end encryption for sensitive data</li>
                                            <li>Regular security audits and penetration testing</li>
                                            <li>Access controls and authentication protocols</li>
                                            <li>Secure data centers with physical security</li>
                                            <li>Employee training on data protection</li>
                                        </ul>
                                    </div>

                                    {/* Section 8 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            8. International Data Transfers
                                        </h3>
                                        <p className="mb-2">
                                            Your personal data is primarily processed within Nigeria. Any international transfer will comply with NDPA 2023 requirements and only occur with adequate protection measures.
                                        </p>
                                    </div>

                                    {/* Section 9 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            9. Complaints to NDPC
                                        </h3>
                                        <p className="mb-2">
                                            If you have concerns about our data processing, you may lodge a complaint with:
                                        </p>
                                        <div className="bg-gray-50 p-3 rounded mb-2">
                                            <strong>Nigeria Data Protection Commission (NDPC)</strong><br />
                                            Website: ndpc.gov.ng<br />
                                            Email: info@ndpc.gov.ng<br />
                                            Address: Federal Capital Territory, Abuja
                                        </div>
                                    </div>

                                    {/* Section 10 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            10. Changes to Privacy Policy
                                        </h3>
                                        <p className="mb-2">
                                            We may update this policy to reflect legal changes. Significant changes will be notified via email or platform notification.
                                        </p>
                                    </div>

                                    <div className="border-t pt-4 mt-4">
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            <strong>Last Updated:</strong> January 2024<br />
                                            <strong>Version:</strong> 1.0<br />
                                            <strong>NDPA Compliance:</strong> Fully compliant with Nigeria Data Protection Act 2023
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                                >
                                    Close Privacy Policy
                                </button>
                                <p className="text-center text-gray-500 text-xs sm:text-sm mt-3">
                                    Need help? Contact our Data Protection Officer at privacy@mountplatform.ng
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