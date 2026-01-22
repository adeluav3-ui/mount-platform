// src/components/CompanyAgreement.jsx - MOBILE OPTIMIZED
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-2 sm:p-4 overflow-y-auto"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4 sm:my-8 flex flex-col max-h-[calc(100vh-2rem)]"
                        >
                            {/* Header - Mobile Optimized */}
                            <div className="bg-gradient-to-r from-naijaGreen to-darkGreen p-4 sm:p-6 sticky top-0 z-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                                            Service Provider Agreement
                                        </h2>
                                        <p className="text-white/90 text-sm sm:text-base mt-1">
                                            {companyName ? `For ${companyName}` : 'Business Terms'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-white hover:text-yellow-300 text-2xl ml-2"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <div className="space-y-6">
                                    {/* WARNING BANNER */}
                                    <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 pt-1">
                                                <span className="text-red-500 text-xl">⚖️</span>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-base sm:text-lg font-semibold text-red-800">
                                                    LEGALLY BINDING CONTRACT
                                                </h3>
                                                <p className="text-red-700 text-sm sm:text-base mt-1">
                                                    This agreement governs your use of our platform as a service provider.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 1: COMMISSION & PAYMENTS */}
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 pb-2 border-b">
                                            ARTICLE 1: COMMISSION & PAYMENT TERMS
                                        </h3>
                                        <div className="space-y-4 text-gray-800 text-sm sm:text-base">
                                            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                                                <h4 className="font-bold text-green-800 text-base sm:text-lg">1.1 Commission Structure</h4>
                                                <p className="mt-2">
                                                    <strong>Platform Commission:</strong> 5% of total job value
                                                </p>
                                                <div className="mt-3 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 gap-3">
                                                    <div className="bg-white p-3 sm:p-4 rounded-lg border">
                                                        <p className="font-bold text-naijaGreen text-sm sm:text-base">💰 Payment Flow:</p>
                                                        <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                                                            <li className="flex items-start">
                                                                <span className="mr-2">✅</span>
                                                                <span>50% deposit → You get <strong>immediately</strong></span>
                                                            </li>
                                                            <li className="flex items-start">
                                                                <span className="mr-2">✅</span>
                                                                <span>50% balance → You get <strong>45%</strong></span>
                                                            </li>
                                                            <li className="flex items-start">
                                                                <span className="mr-2">✅</span>
                                                                <span>Platform keeps <strong>5%</strong> commission</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    <div className="bg-white p-3 sm:p-4 rounded-lg border">
                                                        <p className="font-bold text-naijaGreen text-sm sm:text-base">📊 Example (₦100k):</p>
                                                        <ul className="mt-2 space-y-1 text-xs sm:text-sm">
                                                            <li>Deposit: ₦50k (you get ₦50k)</li>
                                                            <li>Balance: ₦50k (you get ₦45k)</li>
                                                            <li>Platform: ₦5k commission</li>
                                                            <li className="font-bold">Your total: ₦95k</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">1.2 Payment Schedule</h4>
                                                <ul className="list-disc pl-4 sm:pl-5 mt-2 space-y-2">
                                                    <li><strong>Deposit Release:</strong> Within 24 hours</li>
                                                    <li><strong>Final Payment:</strong> Within 48 hours after approval</li>
                                                    <li><strong>Payment Method:</strong> Bank transfer</li>
                                                </ul>
                                            </div>

                                            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
                                                <h4 className="font-bold text-yellow-800 text-base">1.3 Non-Circumvention</h4>
                                                <p className="mt-2 text-sm">
                                                    <strong>Important:</strong> Do not contact customers directly for 12 months.
                                                </p>
                                                <ul className="list-disc pl-4 sm:pl-5 mt-2 space-y-1 text-sm">
                                                    <li>Immediate suspension if violated</li>
                                                    <li>Legal action for damages</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 2: SERVICE STANDARDS */}
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 pb-2 border-b">
                                            ARTICLE 2: SERVICE STANDARDS
                                        </h3>
                                        <div className="space-y-4 text-gray-800 text-sm sm:text-base">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">2.1 Response Times</h4>
                                                <ul className="list-disc pl-4 sm:pl-5 mt-2 space-y-2">
                                                    <li><strong>Job Proposals:</strong> Within 1 hour</li>
                                                    <li><strong>Messages:</strong> Within 1 hour</li>
                                                    <li><strong>Onsite:</strong> Schedule within 48 hours</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">2.2 Quality Standards</h4>
                                                <ul className="list-disc pl-4 sm:pl-5 mt-2 space-y-2">
                                                    <li>Maintain proper tools & equipment</li>
                                                    <li>Ensure technicians are trained</li>
                                                    <li>Provide accurate quotes</li>
                                                    <li>Complete work on time</li>
                                                </ul>
                                            </div>

                                            <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                                                <h4 className="font-bold text-red-800 text-base">2.3 Insurance & Liability</h4>
                                                <p className="mt-2">
                                                    You are responsible for:
                                                </p>
                                                <ul className="list-disc pl-4 sm:pl-5 mt-2 space-y-1">
                                                    <li>Public liability insurance</li>
                                                    <li>Employee injuries</li>
                                                    <li>Property damage</li>
                                                    <li>30-day warranty</li>
                                                </ul>
                                                <p className="mt-3 text-xs sm:text-sm text-red-700">
                                                    <strong>Note:</strong> Platform is marketplace only, not liable for your work.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 3: DISPUTE RESOLUTION */}
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 pb-2 border-b">
                                            ARTICLE 3: DISPUTE RESOLUTION
                                        </h3>
                                        <div className="space-y-4 text-gray-800 text-sm sm:text-base">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">3.1 Platform Mediation</h4>
                                                <ol className="list-decimal pl-4 sm:pl-5 mt-2 space-y-2">
                                                    <li>Customer submits complaint</li>
                                                    <li>You have 48 hours to respond</li>
                                                    <li>Platform investigates</li>
                                                    <li>Binding decision by platform</li>
                                                </ol>
                                            </div>

                                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                                                <h4 className="font-bold text-blue-800 text-base">3.2 Legal Jurisdiction</h4>
                                                <p className="mt-2">
                                                    <strong>Governing Law:</strong> Laws of Nigeria
                                                </p>
                                                <p className="mt-2">
                                                    <strong>Venue:</strong> Courts in Ogun State
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECTION 4: TERMINATION */}
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 pb-2 border-b">
                                            ARTICLE 4: TERMINATION
                                        </h3>
                                        <div className="space-y-4 text-gray-800 text-sm sm:text-base">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">4.1 Suspension Reasons</h4>
                                                <ul className="list-disc pl-4 sm:pl-5 mt-2 space-y-2">
                                                    <li>Rating below 3.0 stars</li>
                                                    <li>Multiple complaints (3+ in 30 days)</li>
                                                    <li>Circumventing payments</li>
                                                    <li>False information</li>
                                                    <li>Unprofessional conduct</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base">4.2 Outstanding Payments</h4>
                                                <p>
                                                    Upon termination, you get payments for completed work minus chargebacks.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ACCEPTANCE SECTION */}
                                    <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
                                        <div className="mb-4">
                                            <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-2">Declaration</h4>
                                            <p className="text-gray-700 text-sm sm:text-base">
                                                I, the authorized representative of {companyName || 'this business'}, confirm that:
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="flex items-start space-x-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={accepted}
                                                    onChange={(e) => setAccepted(e.target.checked)}
                                                    className="mt-1 w-5 h-5 text-naijaGreen rounded focus:ring-naijaGreen focus:ring-2 flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-bold text-gray-800 text-base sm:text-lg block">
                                                        I ACCEPT ALL TERMS
                                                    </span>
                                                    <div className="mt-2 space-y-1 text-gray-700 text-sm">
                                                        <p className="flex items-start">
                                                            <span className="mr-2 mt-0.5">✅</span>
                                                            <span>Legally binding contract</span>
                                                        </p>
                                                        <p className="flex items-start">
                                                            <span className="mr-2 mt-0.5">✅</span>
                                                            <span>Agree to 5% commission</span>
                                                        </p>
                                                        <p className="flex items-start">
                                                            <span className="mr-2 mt-0.5">✅</span>
                                                            <span>No circumvention for 12 months</span>
                                                        </p>
                                                        <p className="flex items-start">
                                                            <span className="mr-2 mt-0.5">✅</span>
                                                            <span>Accept platform mediation</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        <div className="mt-4 p-3 bg-white rounded-lg border text-xs sm:text-sm">
                                            <p className="text-gray-600">
                                                <strong>Electronic Signature:</strong> By checking, you electronically sign this agreement.
                                            </p>
                                            <p className="text-gray-600 mt-2">
                                                <strong>Record Keeping:</strong> We record IP, timestamp, and agreement version.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer - Mobile Optimized */}
                            <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                                <div className="flex flex-col gap-4">
                                    <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                                        <p>Version 1.0 • Effective: {new Date().toLocaleDateString()}</p>
                                        <p className="mt-1">Agreement ID: SP-{Date.now().toString(36).toUpperCase().slice(-6)}</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={onClose}
                                            className="px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition text-sm sm:text-base"
                                        >
                                            Decline & Cancel
                                        </button>
                                        <button
                                            onClick={handleAccept}
                                            disabled={!accepted}
                                            className={`px-4 py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm sm:text-base ${accepted
                                                ? 'bg-naijaGreen text-white hover:bg-darkGreen'
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                        >
                                            <span>Accept Agreement</span>
                                            <span className="text-lg">⚡</span>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-center text-gray-500 text-xs sm:text-sm mt-4">
                                    This agreement is governed by Nigerian law.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CompanyAgreement;