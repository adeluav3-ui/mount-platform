// src/components/CompanyAgreement.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CompanyAgreement = ({ isOpen, onAccept, onClose, companyName = '' }) => {
    const [accepted, setAccepted] = useState(false);

    const handleAccept = () => {
        if (!accepted) {
            alert('You must accept the Service Provider Agreement to continue.');
            return;
        }

        onAccept();
    };

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-naijaGreen to-darkGreen p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                                            Service Provider Agreement
                                        </h2>
                                        <p className="text-white/90 mt-1">
                                            {companyName ? `For ${companyName}` : 'Business Terms & Conditions'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white hover:text-yellow-300 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div
                                className="flex-1 overflow-y-auto p-6 md:p-8"
                                onScroll={handleScroll}
                            >
                                <div className="space-y-8">
                                    {/* WARNING BANNER */}
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <span className="text-red-500 text-2xl">⚖️</span>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-lg font-semibold text-red-800">
                                                    LEGALLY BINDING CONTRACT
                                                </h3>
                                                <p className="text-red-700 mt-1">
                                                    This agreement governs your use of our platform as a service provider.
                                                    By accepting, you enter into a legally enforceable contract.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 1: COMMISSION & PAYMENTS */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                                            ARTICLE 1: COMMISSION & PAYMENT TERMS
                                        </h3>
                                        <div className="space-y-4 text-gray-800">
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <h4 className="font-bold text-green-800 text-lg">1.1 Commission Structure</h4>
                                                <p className="mt-2">
                                                    <strong>Platform Commission:</strong> 5% of total job value
                                                </p>
                                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-lg border">
                                                        <p className="font-bold text-naijaGreen">💰 Payment Flow:</p>
                                                        <ul className="mt-2 space-y-2 text-sm">
                                                            <li>✅ Customer pays 50% deposit → You receive <strong>immediately</strong></li>
                                                            <li>✅ Customer pays 50% balance → You receive <strong>45%</strong></li>
                                                            <li>✅ Platform keeps <strong>5%</strong> as commission</li>
                                                        </ul>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-lg border">
                                                        <p className="font-bold text-naijaGreen">📊 Example (₦100,000 job):</p>
                                                        <ul className="mt-2 space-y-1 text-sm">
                                                            <li>Deposit: ₦50,000 (you get ₦50,000)</li>
                                                            <li>Balance: ₦50,000 (you get ₦45,000)</li>
                                                            <li>Platform: ₦5,000 commission</li>
                                                            <li className="font-bold">Your total: ₦95,000</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-900">1.2 Payment Schedule</h4>
                                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                                    <li><strong>Deposit Release:</strong> Within 24 hours of customer payment confirmation</li>
                                                    <li><strong>Final Payment:</strong> Within 48 hours after customer approves completed work</li>
                                                    <li><strong>Payment Method:</strong> Bank transfer to your registered account</li>
                                                </ul>
                                            </div>

                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                <h4 className="font-bold text-yellow-800">1.3 Non-Circumvention Clause</h4>
                                                <p className="mt-2">
                                                    <strong>Important:</strong> You agree not to contact customers directly for 12 months after job completion
                                                    to arrange work outside our platform. Violation results in:
                                                </p>
                                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                                    <li>Immediate platform suspension</li>
                                                    <li>Legal action for damages</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: SERVICE STANDARDS */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                                            ARTICLE 2: SERVICE STANDARDS & OBLIGATIONS
                                        </h3>
                                        <div className="space-y-4 text-gray-800">
                                            <div>
                                                <h4 className="font-bold text-gray-900">2.1 Response Time Requirements</h4>
                                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                                    <li><strong>Job Proposals:</strong> Respond within 1 hour</li>
                                                    <li><strong>Customer Messages:</strong> Respond within 1 hour</li>
                                                    <li><strong>Onsite Requests:</strong> Schedule within 48 hours if requested</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-900">2.2 Quality & Professionalism</h4>
                                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                                    <li>Maintain adequate tools, equipment, and materials</li>
                                                    <li>Ensure all technicians are properly trained</li>
                                                    <li>Provide accurate quotes with detailed breakdowns</li>
                                                    <li>Complete work within agreed timeframe</li>
                                                </ul>
                                            </div>

                                            <div className="bg-red-50 p-4 rounded-lg">
                                                <h4 className="font-bold text-red-800">2.3 Insurance & Liability</h4>
                                                <p className="mt-2">
                                                    You are responsible for:
                                                </p>
                                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                                    <li>Public liability insurance for your work</li>
                                                    <li>Injury to your employees or subcontractors</li>
                                                    <li>Damage to customer property during work</li>
                                                    <li>Warranty on Mountship (minimum 30 days)</li>
                                                </ul>
                                                <p className="mt-3 text-sm text-red-700">
                                                    <strong>Note:</strong> Our platform acts as a marketplace only. We are not liable for your work.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: DISPUTE RESOLUTION */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                                            ARTICLE 3: DISPUTE RESOLUTION
                                        </h3>
                                        <div className="space-y-4 text-gray-800">
                                            <div>
                                                <h4 className="font-bold text-gray-900">3.1 Platform Mediation</h4>
                                                <p>
                                                    All disputes must first go through our mediation process:
                                                </p>
                                                <ol className="list-decimal pl-5 mt-2 space-y-2">
                                                    <li>Customer submits complaint through platform</li>
                                                    <li>You have 48 hours to respond with solution</li>
                                                    <li>If unresolved, platform investigates and makes binding decision</li>
                                                    <li>Both parties agree to accept platform's decision</li>
                                                </ol>
                                            </div>

                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <h4 className="font-bold text-blue-800">3.2 Legal Jurisdiction</h4>
                                                <p className="mt-2">
                                                    <strong>Governing Law:</strong> Laws of the Federal Republic of Nigeria
                                                </p>
                                                <p className="mt-2">
                                                    <strong>Dispute Venue:</strong> Courts in Ogun State, Nigeria
                                                </p>
                                                <p className="mt-2 text-sm">
                                                    This agreement is enforceable in Nigerian courts.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 4: TERMINATION */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                                            ARTICLE 4: TERMINATION & SUSPENSION
                                        </h3>
                                        <div className="space-y-4 text-gray-800">
                                            <div>
                                                <h4 className="font-bold text-gray-900">4.1 Grounds for Immediate Suspension</h4>
                                                <ul className="list-disc pl-5 mt-2 space-y-2">
                                                    <li>Rating falls below 3.0 stars</li>
                                                    <li>Multiple customer complaints (3+ in 30 days)</li>
                                                    <li>Attempt to circumvent platform payments</li>
                                                    <li>Providing false information</li>
                                                    <li>Unprofessional conduct</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-900">4.2 Outstanding Payments</h4>
                                                <p>
                                                    Upon termination, you remain entitled to payments for completed work,
                                                    minus any chargebacks or dispute resolutions.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACCEPTANCE SECTION */}
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <div className="mb-6">
                                            <h4 className="font-bold text-gray-900 text-lg mb-2">Declaration</h4>
                                            <p className="text-gray-700">
                                                I, the authorized representative of {companyName || 'this business'}, confirm that:
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="flex items-start space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={accepted}
                                                    onChange={(e) => setAccepted(e.target.checked)}
                                                    className="mt-1 w-5 h-5 text-naijaGreen rounded focus:ring-naijaGreen focus:ring-2"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-bold text-gray-800 text-lg">
                                                        I ACCEPT ALL TERMS OF THIS AGREEMENT
                                                    </span>
                                                    <div className="mt-2 space-y-2 text-gray-700">
                                                        <p className="flex items-center">
                                                            <span className="mr-2">✅</span>
                                                            I understand this is a legally binding contract
                                                        </p>
                                                        <p className="flex items-center">
                                                            <span className="mr-2">✅</span>
                                                            I agree to 5% commission on all jobs
                                                        </p>
                                                        <p className="flex items-center">
                                                            <span className="mr-2">✅</span>
                                                            I will not circumvent the platform for 12 months
                                                        </p>
                                                        <p className="flex items-center">
                                                            <span className="mr-2">✅</span>
                                                            I accept platform mediation for disputes
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="mt-6 p-4 bg-white rounded-lg border">
                                            <p className="text-sm text-gray-600">
                                                <strong>Electronic Signature:</strong> By checking this box, you electronically sign this agreement.
                                                This electronic signature has the same legal effect as a handwritten signature.
                                            </p>
                                            <p className="text-sm text-gray-600 mt-2">
                                                <strong>Record Keeping:</strong> We will record your IP address, timestamp, and agreement version for legal purposes.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 p-6 bg-gray-50">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                                    <div className="text-sm text-gray-600">
                                        <p>Version 1.0 • Effective: {new Date().toLocaleDateString()}</p>
                                        <p className="mt-1">Agreement ID: SP-{Date.now().toString(36).toUpperCase()}</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition"
                                        >
                                            Decline & Cancel
                                        </button>
                                        <button
                                            onClick={handleAccept}
                                            className="px-8 py-3 bg-naijaGreen text-white font-bold rounded-xl hover:bg-darkGreen transition flex items-center justify-center gap-2"
                                        >
                                            <span>Accept Agreement</span>
                                            <span className="text-xl">⚡</span>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-center text-gray-500 text-sm mt-4">
                                    This agreement is governed by Nigerian law and enforceable in Nigerian courts.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CompanyAgreement; // ← THIS LINE IS CRITICAL