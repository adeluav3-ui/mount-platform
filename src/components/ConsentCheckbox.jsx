// src/components/ConsentCheckbox.jsx
import React, { useState } from 'react';
import TermsAndConditions from './TermsAndConditions';
import PrivacyPolicy from './PrivacyPolicy';

const ConsentCheckbox = ({ onAccept, initialAccepted = false }) => {
    const [accepted, setAccepted] = useState(initialAccepted);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const handleCheckboxChange = (e) => {
        // For the custom checkbox, we'll handle it differently
        const isChecked = !accepted;
        setAccepted(isChecked);
        if (isChecked && onAccept) {
            onAccept();
        }
    };

    return (
        <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                    {/* Custom Checkbox - iOS friendly */}
                    <div className="relative flex items-center justify-center mt-0.5">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={handleCheckboxChange}
                            className="absolute opacity-0 w-6 h-6 cursor-pointer z-10"
                            style={{
                                width: '24px',
                                height: '24px',
                                WebkitAppearance: 'none',
                                appearance: 'none'
                            }}
                            required
                        />
                        <div
                            className={`w-6 h-6 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all ${accepted
                                    ? 'bg-naijaGreen border-naijaGreen'
                                    : 'bg-white border-gray-300'
                                }`}
                            style={{
                                width: '24px',
                                height: '24px',
                                minWidth: '24px',
                                minHeight: '24px'
                            }}
                        >
                            {accepted && (
                                <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            )}
                        </div>
                    </div>

                    <div className="text-sm sm:text-base flex-1">
                        <span className="font-medium text-gray-800">
                            I agree to the{' '}
                            <button
                                type="button"
                                onClick={() => setShowTerms(true)}
                                className="text-naijaGreen hover:underline font-semibold"
                            >
                                Terms and Conditions
                            </button>
                            {' '},{' '}
                            <button
                                type="button"
                                onClick={() => setShowPrivacy(true)}
                                className="text-naijaGreen hover:underline font-semibold"
                            >
                                Privacy Policy and Cookies Policy
                            </button>
                        </span>
                        <p className="text-gray-600 text-xs sm:text-sm mt-1">
                            By checking this box, you confirm you are at least 18 years old and agree to our terms, including data processing in compliance with NDPC 2023.
                        </p>
                    </div>
                </label>
            </div>

            {/* Modals */}
            <TermsAndConditions
                isOpen={showTerms}
                onAccept={() => {
                    setAccepted(true);
                    if (onAccept) onAccept();
                    setShowTerms(false);
                }}
                onClose={() => setShowTerms(false)}
            />

            <PrivacyPolicy
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
        </>
    );
};

export default ConsentCheckbox;