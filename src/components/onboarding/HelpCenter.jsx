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
                            {/* Email Support - MOBILE OPTIMIZED */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-blue-600 text-xl">📧</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-blue-800">Email Support</h4>
                                        <p className="text-blue-600 text-sm">We respond within 2 hours</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-white p-3 rounded-lg border break-words">
                                        <code className="text-gray-800 text-sm sm:text-base font-mono break-all">
                                            info@mountltd.com
                                        </code>
                                    </div>
                                    <button
                                        onClick={() => {
                                            window.location.href = 'mailto:info@mountltd.com?subject=Mount Platform Support';
                                        }}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Send Email
                                    </button>
                                </div>
                            </div>

                            {/* Phone Support - MOBILE OPTIMIZED */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-green-600 text-xl">📱</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-green-800">Phone Support</h4>
                                        <p className="text-green-600 text-sm">Available Monday-Saturday, 8AM-8PM</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-white p-3 rounded-lg border">
                                        <div className="flex items-center justify-between">
                                            <code className="text-gray-800 text-lg sm:text-xl font-bold tracking-wide">
                                                0813 9672 432
                                            </code>
                                            <div className="text-xs text-gray-500">NG</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => {
                                                window.location.href = 'tel:+2348139672432';
                                            }}
                                            className="py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            Call Now
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText('08139672432');
                                                alert('Phone number copied to clipboard!');
                                            }}
                                            className="py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* WhatsApp Support (Optional) */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-emerald-600 text-xl">💬</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-emerald-800">WhatsApp Support</h4>
                                        <p className="text-emerald-600 text-sm">Chat with us on WhatsApp</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const message = encodeURIComponent("Hello, I need help with Mount platform");
                                        window.open(`https://wa.me/2348139672432?text=${message}`, '_blank');
                                    }}
                                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.76.982.998-3.675-.236-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.897 6.994c-.004 5.45-4.438 9.88-9.888 9.88zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.333 11.89-11.892 0-3.18-1.24-6.162-3.495-8.411z" />
                                    </svg>
                                    Chat on WhatsApp
                                </button>
                            </div>
                        </div>

                        {/* Support Hours */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-bold text-yellow-800 mb-3">📅 Support Hours</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-600 mt-0.5">🕗</span>
                                    <div>
                                        <strong className="text-yellow-800">Monday - Saturday:</strong>
                                        <p className="text-yellow-700">8:00 AM - 8:00 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-600 mt-0.5">🕙</span>
                                    <div>
                                        <strong className="text-yellow-800">Sunday:</strong>
                                        <p className="text-yellow-700">12:00 PM - 8:00 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="text-yellow-600 mt-0.5">⚡</span>
                                    <div>
                                        <strong className="text-yellow-800">Response Time:</strong>
                                        <p className="text-yellow-700">Within 2 hours during support hours</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-bold text-blue-800 mb-2">💡 Quick Tips</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Include your job ID when contacting support for faster help</li>
                                <li>• Take screenshots of any issues you're experiencing</li>
                                <li>• Check "My Jobs" section before contacting support</li>
                                <li>• For payment issues, include transaction reference</li>
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
                                    Pay 50% deposit to start work. The remaining 50% is paid after job completion and your approval.
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
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Video Tutorials</h3>
                        <p className="text-gray-600 mb-4">
                            Quick video guides to help you use Mount effectively
                        </p>

                        {/* Video Grid */}
                        <div className="space-y-4">
                            {/* 1. How to Post a Job */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">📝</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-base">How to Post a Job</h4>
                                            <p className="text-gray-600 text-sm">Step-by-step guide to creating job requests</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    ⏱️ YouTube Short
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* YouTube Shorts Player */}
                                    <div className="aspect-[9/16] max-w-[300px] mx-auto bg-black rounded-xl overflow-hidden mb-3 border-4 border-white shadow-lg">
                                        <iframe
                                            src="https://www.youtube.com/embed/XsekD9aBfmE?rel=0&modestbranding=1"
                                            title="How to Post a Job - Mount Tutorial"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                            loading="lazy"
                                        ></iframe>
                                    </div>

                                    <button
                                        onClick={() => {
                                            window.open('https://youtube.com/shorts/XsekD9aBfmE', '_blank', 'noopener,noreferrer');
                                        }}
                                        className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                        </svg>
                                        Watch on YouTube
                                    </button>
                                </div>
                            </div>

                            {/* 2. How to Leave a Review */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">⭐</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-base">How to Leave a Review</h4>
                                            <p className="text-gray-600 text-sm">Leaving feedback for service providers</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    ⏱️ YouTube Short
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="aspect-[9/16] max-w-[300px] mx-auto bg-black rounded-xl overflow-hidden mb-3 border-4 border-white shadow-lg">
                                        <iframe
                                            src="https://www.youtube.com/embed/irF11sxFX4s?rel=0&modestbranding=1"
                                            title="How to Leave a Review - Mount Tutorial"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                            loading="lazy"
                                        ></iframe>
                                    </div>

                                    <button
                                        onClick={() => {
                                            window.open('https://youtube.com/shorts/irF11sxFX4s', '_blank', 'noopener,noreferrer');
                                        }}
                                        className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                        </svg>
                                        Watch on YouTube
                                    </button>
                                </div>
                            </div>

                            {/* 3. How to Get Verified */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">✅</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-base">How to Get Verified</h4>
                                            <p className="text-gray-600 text-sm">Account verification process</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    ⏱️ YouTube Short
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="aspect-[9/16] max-w-[300px] mx-auto bg-black rounded-xl overflow-hidden mb-3 border-4 border-white shadow-lg">
                                        <iframe
                                            src="https://www.youtube.com/embed/IlGfkt6JlQE?rel=0&modestbranding=1"
                                            title="How to Get Verified - Mount Tutorial"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                            loading="lazy"
                                        ></iframe>
                                    </div>

                                    <button
                                        onClick={() => {
                                            window.open('https://youtube.com/shorts/IlGfkt6JlQE', '_blank', 'noopener,noreferrer');
                                        }}
                                        className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                        </svg>
                                        Watch on YouTube
                                    </button>
                                </div>
                            </div>

                            {/* 4. How to Make Payments */}
                            <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg">💳</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-base">How to Make Payments</h4>
                                            <p className="text-gray-600 text-sm">Secure payment process explained</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    ⏱️ Regular Video
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                                        <iframe
                                            src="https://www.youtube.com/embed/IaSRhF8sqTU?rel=0&modestbranding=1"
                                            title="How to Make Payments - Mount Tutorial"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                            loading="lazy"
                                        ></iframe>
                                    </div>

                                    <button
                                        onClick={() => {
                                            window.open('https://youtu.be/IaSRhF8sqTU', '_blank', 'noopener,noreferrer');
                                        }}
                                        className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                        </svg>
                                        Watch on YouTube
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Helpful Tips */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-blue-600 text-xl">🎯</span>
                                <h4 className="font-bold text-blue-800">Need More Help?</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedOption('support')}
                                    className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600">📞</span>
                                        <span className="font-medium text-blue-800 text-sm">Contact Support</span>
                                    </div>
                                    <p className="text-blue-600 text-xs mt-1">Get direct help from our team</p>
                                </button>
                                <button
                                    onClick={() => setSelectedOption('faq')}
                                    className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600">❓</span>
                                        <span className="font-medium text-blue-800 text-sm">Read FAQs</span>
                                    </div>
                                    <p className="text-blue-600 text-xs mt-1">Common questions answered</p>
                                </button>
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
                                    <code className="text-blue-600 text-sm font-medium">info@mountltd.com</code>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600">📱</span>
                                        <span className="text-sm text-gray-700">Phone:</span>
                                    </div>
                                    <code className="text-green-600 text-sm font-bold">0813 9672 432</code>
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