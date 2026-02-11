// src/components/seo/ContactPage.jsx - SIMPLIFIED VERSION
import React from 'react';
import SimpleHelmet from './SimpleHelmet';

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-16 px-4">
            <SimpleHelmet
                title="Contact Mount - Home Services in Nigeria"
                description="Get in touch with Mount for home service bookings, provider applications, or support. Email, phone, and social media contacts."
                canonical="/contact"
            />

            <div className="container mx-auto max-w-4xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Mount</h1>
                    <p className="text-gray-600 text-lg">
                        We're here to help with any questions about our services.
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Email</h3>
                                    <a href="mailto:info@mountltd.com" className="text-naijaGreen hover:text-darkGreen">
                                        info@mountltd.com
                                    </a>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Phone Numbers</h3>
                                    <div className="space-y-2">
                                        <a href="tel:+2348139672432" className="text-gray-700 hover:text-naijaGreen block">
                                            +234 813 967 2432
                                        </a>
                                        <a href="tel:+2349037590136" className="text-gray-700 hover:text-naijaGreen block">
                                            +234 903 759 0136
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 mb-2">Social Media</h3>
                                    <div className="flex space-x-4">
                                        <a href="https://instagram.com/mountltd" className="text-gray-700 hover:text-pink-600">
                                            Instagram
                                        </a>
                                        <a href="https://tiktok.com/@mountltd" className="text-gray-700 hover:text-black">
                                            TikTok
                                        </a>
                                        <a href="https://linkedin.com/company/mountltd" className="text-gray-700 hover:text-blue-700">
                                            LinkedIn
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Help With</h2>
                            <div className="space-y-4">
                                <a href="/for-customers" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div className="font-bold text-gray-900">Booking a Service</div>
                                    <div className="text-gray-600 text-sm">Learn how to book and pay securely</div>
                                </a>
                                <a href="/for-providers" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div className="font-bold text-gray-900">Becoming a Provider</div>
                                    <div className="text-gray-600 text-sm">Join as a service professional</div>
                                </a>
                                <a href="/how-it-works" className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div className="font-bold text-gray-900">How It Works</div>
                                    <div className="text-gray-600 text-sm">Understand our process</div>
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <p className="text-gray-600 text-center">
                            Prefer to browse? Check out our <a href="/services" className="text-naijaGreen font-medium">services directory</a> or read <a href="/how-it-works" className="text-naijaGreen font-medium">how it works</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;