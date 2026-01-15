// src/components/onboarding/OnboardingGuide.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OnboardingGuide = ({ isOpen, onComplete, userType = 'customer' }) => {
    const [step, setStep] = useState(1);
    const [skipTutorial, setSkipTutorial] = useState(false);

    const steps = [
        {
            title: "Welcome to Mount! 👋",
            description: "Your trusted home services marketplace. Let's show you how it works.",
            image: "🎯",
            tip: "You can always access this tutorial from your profile settings."
        },
        {
            title: "Post a Job in 3 Steps",
            description: "1. Tap 'I need a service!' 2. Describe your job 3. Select service category",
            image: "📝",
            tip: "Be specific in your description for accurate quotes."
        },
        {
            title: "Review Quotes & Pay Securely",
            description: "Companies will send quotes. Review and accept the best one. Pay 50% deposit to start work.",
            image: "💰",
            tip: "Make sure to negotiate with the service providers on the best price for the job."
        },
        {
            title: "Track Job Progress",
            description: "Check 'My Jobs' for real-time updates. Communicate with the company. Approve work upon completion.",
            image: "📱",
            tip: "Rate your experience after job completion."
        },
        {
            title: "You're All Set! 🎉",
            description: "Ready to find reliable service professionals? Start by posting your first job!",
            image: "🚀",
            tip: "Need help? Tap the help icon in the top right corner."
        }
    ];

    const handleComplete = () => {
        // Mark as completed in localStorage
        localStorage.setItem('mount_onboarding_completed', 'true');
        if (skipTutorial) {
            localStorage.setItem('mount_skip_tutorial', 'true');
        }
        onComplete();
    };

    const handleSkip = () => {
        setSkipTutorial(true);
        handleComplete();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header with progress */}
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Getting Started Guide</h2>
                        <button
                            onClick={handleSkip}
                            className="text-white/80 hover:text-white text-sm"
                        >
                            Skip
                        </button>
                    </div>

                    {/* Progress dots */}
                    <div className="flex justify-center gap-2">
                        {steps.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${index + 1 <= step ? 'bg-white' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">{steps[step - 1].image}</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {steps[step - 1].title}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {steps[step - 1].description}
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-700">
                                💡 {steps[step - 1].tip}
                            </p>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="text-center text-sm text-gray-500 mb-6">
                        Step {step} of {steps.length}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (step === steps.length) {
                                    handleComplete();
                                } else {
                                    setStep(step + 1);
                                }
                            }}
                            className={`flex-1 py-3 rounded-lg font-medium ${step === steps.length
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-naijaGreen text-white hover:bg-darkGreen'
                                }`}
                        >
                            {step === steps.length ? "Get Started!" : "Next"}
                        </button>
                    </div>

                    {/* Skip tutorial checkbox on last step */}
                    {step === steps.length && (
                        <div className="mt-4 flex items-center">
                            <input
                                type="checkbox"
                                id="skipTutorial"
                                checked={skipTutorial}
                                onChange={(e) => setSkipTutorial(e.target.checked)}
                                className="mr-2 w-4 h-4 text-naijaGreen rounded"
                            />
                            <label htmlFor="skipTutorial" className="text-sm text-gray-600">
                                Don't show tutorial on future logins
                            </label>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingGuide;