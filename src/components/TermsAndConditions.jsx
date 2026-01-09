// src/components/TermsAndConditions.jsx - MOBILE OPTIMIZED
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TermsAndConditions = ({ isOpen, onAccept, onClose }) => {
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => {
        if (accepted) {
            onAccept();
        } else {
            alert('You must accept the Terms and Conditions to continue.');
        }
    };

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
                            <div className="bg-gradient-to-r from-naijaGreen to-darkGreen p-4 sm:p-6 sticky top-0">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                                            Terms and Conditions
                                        </h2>
                                        <p className="text-white/90 text-xs sm:text-sm mt-0.5">
                                            Please read and accept to continue
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white hover:text-yellow-300 text-xl sm:text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <div className="space-y-4 text-gray-700 text-sm sm:text-base">
                                    {/* Important Notice */}
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 pt-0.5">
                                                <span className="text-red-500">⚠️</span>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="font-bold text-red-800 text-sm sm:text-base">
                                                    Important Legal Notice
                                                </h3>
                                                <p className="text-red-700 text-xs sm:text-sm mt-0.5">
                                                    By using our platform, you agree to these legally binding terms.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 1 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            1. Payment Obligations
                                        </h3>
                                        <div className="space-y-2">
                                            <p>
                                                <strong>1.1 Deposit Payment:</strong> Upon accepting a quote, you agree to pay a 50% deposit. This deposit secures your booking and covers initial material costs.
                                            </p>
                                            <p>
                                                <strong>1.2 Final Payment:</strong> You agree to pay the remaining 50% balance within <strong>24 hours</strong> of work completion notification.
                                            </p>
                                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                <p className="font-bold text-red-600 text-sm sm:text-base mb-1">
                                                    ⚠️ Legal Consequences:
                                                </p>
                                                <p className="text-xs sm:text-sm text-red-700 mb-1">
                                                    Failure to pay the final balance constitutes breach of contract. We reserve the right to:
                                                </p>
                                                <ul className="list-disc pl-4 text-xs sm:text-sm space-y-0.5">
                                                    <li>Initiate legal proceedings for recovery of owed amounts</li>
                                                    <li>Permanent suspension from the platform</li>
                                                    <li>Engage debt collection agencies at your expense</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            2. Service Provider Relationship
                                        </h3>
                                        <div className="space-y-2">
                                            <p>
                                                <strong>2.1 Platform Role:</strong> We act as a marketplace connecting you with verified service providers. We are not party to the service agreement between you and the provider.
                                            </p>
                                            <p>
                                                <strong>2.2 Quality Assurance:</strong> While we verify service providers, we do not guarantee specific outcomes. Disputes regarding work quality should be resolved through our dispute resolution process before final payment.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section 3 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            3. Dispute Resolution
                                        </h3>
                                        <div className="space-y-2">
                                            <p>
                                                <strong>3.1 Platform Mediation:</strong> All payment disputes must first be submitted through our platform's dispute resolution system.
                                            </p>
                                            <p>
                                                <strong>3.2 Legal Jurisdiction:</strong> Any legal proceedings shall be governed by the laws of Nigeria and subject to the jurisdiction of Nigerian courts.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section 4 */}
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            4. Platform Usage
                                        </h3>
                                        <div className="space-y-2">
                                            <p>
                                                <strong>4.1 Account Responsibility:</strong> You are responsible for all activities under your account.
                                            </p>
                                            <p>
                                                <strong>4.2 Service Fees:</strong> You agree to pay applicable platform service fees as displayed during checkout.
                                            </p>
                                            <p>
                                                <strong>4.3 Promotion Period:</strong> New customers receive a 3-month service fee waiver starting from their first job.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Section 5 - Data Protection */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-bold text-gray-800 text-base sm:text-lg mb-2">
                                            5. Data Protection (NDPC 2023)
                                        </h3>
                                        <div className="space-y-2">
                                            <p className="text-xs sm:text-sm text-blue-700 mb-1">
                                                By using our platform, you acknowledge and consent to:
                                            </p>
                                            <ul className="list-disc pl-4 text-xs sm:text-sm space-y-0.5">
                                                <li>Collection and processing of personal data including government-issued ID for verification</li>
                                                <li>Data processing in compliance with Nigeria Data Protection Act 2023</li>
                                                <li>Receiving communications related to your account and services</li>
                                                <li>Our Privacy Policy which governs data protection practices</li>
                                            </ul>
                                            <p className="text-xs sm:text-sm text-blue-700 mt-1">
                                                For details on data protection, please read our <span className="font-bold">Privacy Policy</span>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Acceptance Checkbox */}
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <label className="flex items-start space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={accepted}
                                                onChange={(e) => setAccepted(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-naijaGreen rounded focus:ring-naijaGreen focus:ring-2"
                                            />
                                            <div>
                                                <span className="font-bold text-gray-800 text-sm sm:text-base">
                                                    I HAVE READ AND UNDERSTAND THESE TERMS
                                                </span>
                                                <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                                                    I acknowledge that:
                                                </p>
                                                <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-xs sm:text-sm">
                                                    <li>I am legally bound by these terms</li>
                                                    <li>Failure to pay final balance has legal consequences</li>
                                                    <li>I am at least 18 years old</li>
                                                    <li>All information provided is accurate</li>
                                                    <li>I have read and agree to the Privacy Policy</li>
                                                </ul>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition text-sm sm:text-base"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAccept}
                                        className="px-4 sm:px-8 py-2.5 sm:py-3 bg-naijaGreen text-white font-bold rounded-lg hover:bg-darkGreen transition flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <span>Accept & Continue</span>
                                        <span>→</span>
                                    </button>
                                </div>
                                <p className="text-center text-gray-500 text-xs sm:text-sm mt-3">
                                    By accepting, you enter into a legally binding agreement.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TermsAndConditions;