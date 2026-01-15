// src/components/onboarding/HelpCenter.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HelpCenter = ({ isOpen, onClose, onStartTour }) => {
    const [selectedOption, setSelectedOption] = useState(null);

    const helpOptions = [
        {
            id: 'tour',
            title: "Take App Tour",
            description: "Step-by-step guide on how to use Mount",
            icon: "🎯",
            color: "from-green-500 to-emerald-600"
        },
        {
            id: 'support',
            title: "Contact Support",
            description: "Get help from our customer support team",
            icon: "📞",
            color: "from-blue-500 to-blue-700"
        },
        {
            id: 'faq',
            title: "FAQs",
            description: "Common questions and answers",
            icon: "❓",
            color: "from-purple-500 to-purple-700"
        },
        {
            id: 'video',
            title: "Watch Tutorial",
            description: "Video guide on using the platform",
            icon: "🎬",
            color: "from-orange-500 to-red-600"
        }
    ];

    const renderContent = () => {
        switch (selectedOption) {
            case 'tour':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">App Tour</h3>
                        <p className="text-gray-600">
                            Let's walk through the main features of Mount:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                            <li><strong>Posting a Job:</strong> Tap "I need a service" to create a job request</li>
                            <li><strong>Receiving Quotes:</strong> Companies will send quotes within 24 hours</li>
                            <li><strong>Making Payments:</strong> 50% deposit to start, balance upon completion</li>
                            <li><strong>Tracking Jobs:</strong> Monitor progress in "My Jobs" section</li>
                            <li><strong>Leaving Reviews:</strong> Share your experience after job completion</li>
                        </ol>
                        <button
                            onClick={() => {
                                onClose();
                                onStartTour();
                            }}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:opacity-90"
                        >
                            Start Guided Tour
                        </button>
                    </div>
                );

            case 'support':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Contact Support</h3>
                            <p className="text-gray-600">
                                Our support team is available to help you with any issues or questions.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 text-xl">📧</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-blue-800">Email Support</h4>
                                        <p className="text-blue-600 text-sm">We respond within 2 hours</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                    <code className="text-gray-800 font-mono">mountservicesltd@gmail.com</code>
                                    <button
                                        onClick={() => {
                                            window.location.href = 'mailto:mountservicesltd@gmail.com';
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                    >
                                        Send Email
                                    </button>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <span className="text-green-600 text-xl">📱</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-green-800">Phone Support</h4>
                                        <p className="text-green-600 text-sm">Available Monday-Saturday, 8AM-6PM</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                                    <code className="text-gray-800 text-lg font-bold">0701 960 9312</code>
                                    <button
                                        onClick={() => {
                                            window.location.href = 'tel:+2347019609312';
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                                    >
                                        Call Now
                                    </button>
                                </div>
                            </div>

                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <span className="text-purple-600 text-xl">💬</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-purple-800">Live Chat</h4>
                                        <p className="text-purple-600 text-sm">Coming Soon</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-bold text-yellow-800 mb-2">Support Hours</h4>
                            <ul className="text-sm text-yellow-700 space-y-1">
                                <li>📅 <strong>Monday - Saturday:</strong> 8:00 AM - 6:00 PM</li>
                                <li>📅 <strong>Sunday:</strong> 10:00 AM - 4:00 PM</li>
                                <li>⏰ <strong>Response Time:</strong> Within 2 hours during support hours</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'faq':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">Frequently Asked Questions</h3>

                        <div className="space-y-3">
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-gray-800 mb-2">Q: How do I post a job?</h4>
                                <p className="text-gray-600 text-sm">
                                    Tap "I need a service!" button, describe your job, select category, and submit. Companies will send quotes within 24 hours.
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-gray-800 mb-2">Q: How does payment work?</h4>
                                <p className="text-gray-600 text-sm">
                                    Pay 50% deposit to start work. The remaining 50% is paid after job completion and your approval. All payments are held securely in escrow.
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-gray-800 mb-2">Q: What if I'm not satisfied with the work?</h4>
                                <p className="text-gray-600 text-sm">
                                    Use our dispute resolution system before making final payment. We mediate between you and the service provider to find a solution.
                                </p>
                            </div>

                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="font-bold text-gray-800 mb-2">Q: Are service providers verified?</h4>
                                <p className="text-gray-600 text-sm">
                                    Yes! All service providers are verified, insured, and have their credentials checked before joining the platform.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'video':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">Video Tutorials</h3>

                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                            {/* Replace with your actual video embed */}
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-5xl mb-4 block">🎬</span>
                                    <p className="text-white font-medium">Video Tutorial Coming Soon</p>
                                    <p className="text-gray-400 text-sm mt-2">Check back next week!</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <h4 className="font-bold text-gray-800 mb-1">Posting Jobs</h4>
                                <p className="text-gray-600 text-sm">How to create job requests</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <h4 className="font-bold text-gray-800 mb-1">Making Payments</h4>
                                <p className="text-gray-600 text-sm">Secure payment process</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <h4 className="font-bold text-gray-800 mb-1">Tracking Progress</h4>
                                <p className="text-gray-600 text-sm">Monitor your jobs</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <h4 className="font-bold text-gray-800 mb-1">Leaving Reviews</h4>
                                <p className="text-gray-600 text-sm">Share your experience</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-naijaGreen to-darkGreen rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">❓</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">How can we help you?</h3>
                            <p className="text-gray-600">
                                Choose an option below to get started
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {helpOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setSelectedOption(option.id)}
                                    className={`bg-gradient-to-br ${option.color} rounded-xl p-4 text-white text-center hover:scale-[1.02] transition-transform`}
                                >
                                    <div className="text-3xl mb-2">{option.icon}</div>
                                    <h4 className="font-bold text-sm mb-1">{option.title}</h4>
                                    <p className="text-white/80 text-xs">{option.description}</p>
                                </button>
                            ))}
                        </div>

                        {/* Quick Support Contact */}
                        <div className="border border-gray-200 rounded-xl p-4">
                            <h4 className="font-bold text-gray-800 mb-3">Quick Contact</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600">📧</span>
                                        <span className="text-sm text-gray-700">Email:</span>
                                    </div>
                                    <code className="text-blue-600 text-sm font-medium">mountservicesltd@gmail.com</code>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600">📱</span>
                                        <span className="text-sm text-gray-700">Phone:</span>
                                    </div>
                                    <code className="text-green-600 text-sm font-bold">0701 960 9312</code>
                                </div>
                            </div>
                        </div>
                    </div>
                );
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
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="border-b border-gray-200 p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {selectedOption && (
                                            <button
                                                onClick={() => setSelectedOption(null)}
                                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                                            >
                                                ←
                                            </button>
                                        )}
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-800">
                                                {selectedOption ? 'Help Center' : 'Help Center'}
                                            </h2>
                                            <p className="text-sm text-gray-600">
                                                {selectedOption ?
                                                    helpOptions.find(o => o.id === selectedOption)?.title :
                                                    'Get help with Mount'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                {renderContent()}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-200 p-4">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Mount Customer Support</span>
                                    <span>v1.0</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default HelpCenter;