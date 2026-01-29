// src/components/ConsentCheckbox.jsx
import React, { useState } from 'react';
import TermsAndConditions from './TermsAndConditions';
import PrivacyPolicy from './PrivacyPolicy';

const ConsentCheckbox = ({ onAccept, initialAccepted = false }) => {
    const [accepted, setAccepted] = useState(initialAccepted);
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const handleCheckboxChange = (e) => {
        const isChecked = e.target.checked;
        setAccepted(isChecked);
        if (isChecked && onAccept) {
            onAccept();
        }
    };

    return (
        <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={handleCheckboxChange}
                        className="mt-0.5 w-4 h-4 sm:w-5 sm:h-5 text-naijaGreen rounded focus:ring-naijaGreen focus:ring-2"
                        required
                    />
                    <div className="text-sm sm:text-base">
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