// src/components/seo/ForCustomersPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import { trackSEOButtonClick } from '../../utils/ga4';

const ForCustomersPage = () => {
    const navigate = useNavigate();

    const handleGetStartedClick = () => {
        trackSEOButtonClick('Get Started as Customer', '/for-customers');
        navigate('/app', { state: { from: 'seo-for-customers' } });
    };

    const handleExploreServicesClick = () => {
        trackSEOButtonClick('Explore Services', '/for-customers');
        navigate('/services');
    };

    const benefits = [
        {
            icon: '🔒',
            title: 'Secure  Payments',
            description: 'Your money is secured until the job is completed to your satisfaction. No upfront full payments.'
        },
        {
            icon: '✓',
            title: 'Verified Professionals',
            description: 'Every service provider is verified, vetted, and rated by other customers.'
        },
        {
            icon: '⭐',
            title: 'Quality Guaranteed',
            description: 'Not satisfied? We mediate disputes and ensure you get the quality you paid for.'
        },
        {
            icon: '⏱️',
            title: 'Save Time & Hassle',
            description: 'No more calling multiple providers. Get multiple quotes in one place.'
        },
        {
            icon: '💰',
            title: 'Fair Pricing',
            description: 'Compare quotes from different providers and choose the best value.'
        },
        {
            icon: '📱',
            title: 'Track Everything',
            description: 'Real-time job tracking, updates, and communication all in one dashboard.'
        }
    ];

    const howItWorks = [
        {
            step: 1,
            title: 'Post Your Job',
            description: 'Describe what you need, upload photos, and set your budget.'
        },
        {
            step: 2,
            title: 'Get Quotes',
            description: 'Receive quotes from verified professionals in your area.'
        },
        {
            step: 3,
            title: 'Choose & Pay Securely',
            description: 'Select your preferred provider and pay 50% deposit to our account.'
        },
        {
            step: 4,
            title: 'Job Completion',
            description: 'Professional completes the work to your satisfaction.'
        },
        {
            step: 5,
            title: 'Release Payment & Review',
            description: 'Release remaining payment and leave a review for others.'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <SimpleHelmet
                title="For Customers - Book Trusted Home Services in Nigeria | Mount"
                description="Find and book verified home service professionals in Nigeria with secure payments, quality guarantees, and real-time tracking. Post your job today!"
                canonical="/for-customers"
            />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-naijaGreen to-darkGreen text-white py-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Find Trusted Home Service Professionals in Nigeria
                        </h1>
                        <p className="text-xl mb-8 max-w-3xl mx-auto">
                            Book verified electricians, plumbers, cleaners, and more with secure payments and quality guarantees.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleGetStartedClick}
                                className="bg-white text-naijaGreen font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors text-lg"
                            >
                                Post Your Job - It's Free
                            </button>
                            <button
                                onClick={handleExploreServicesClick}
                                className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white/10 transition-colors text-lg"
                            >
                                Explore Services
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Why Thousands of Nigerians Trust Mount
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            We've solved the problems that make finding reliable home services stressful.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                                <div className="text-3xl mb-4">{benefit.icon}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                                <p className="text-gray-600">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            How Mount Works for Customers
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            Simple, secure, and stress-free process from start to finish.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>

                        {howItWorks.map((step, index) => (
                            <div key={index} className={`flex flex-col lg:flex-row items-center mb-12 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                                <div className="lg:w-1/2 flex justify-center mb-6 lg:mb-0">
                                    <div className="flex-shrink-0 w-20 h-20 bg-naijaGreen text-white rounded-full flex items-center justify-center text-2xl font-bold">
                                        {step.step}
                                    </div>
                                </div>

                                <div className="lg:w-1/2">
                                    <div className={`bg-gray-50 p-6 rounded-xl ${index % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8'}`}>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                        <p className="text-gray-600">{step.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 bg-gradient-to-r from-naijaGreen/10 to-darkGreen/10">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        Ready to Find Your Trusted Professional?
                    </h2>
                    <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied customers who've found reliable home services on Mount.
                    </p>
                    <button
                        onClick={handleGetStartedClick}
                        className="bg-naijaGreen text-white font-bold py-4 px-12 rounded-lg hover:bg-darkGreen transition-colors text-lg"
                    >
                        Get Started Free
                    </button>
                    <p className="text-gray-500 mt-4 text-sm">
                        No hidden fees. No commitment. Post your job and compare quotes.
                    </p>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-4 bg-white">
                <div className="container mx-auto max-w-4xl">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-6">
                        {[
                            {
                                q: 'Is it really free to post a job?',
                                a: 'Yes! Posting your job on Mount is completely free. You only pay when you accept a quote and the professional starts working.'
                            },
                            {
                                q: 'How does the payment work?',
                                a: 'When you accept a quote, you pay 50% deposit into our account which we dispense to the service provider upon confirmation. The balance is released to the professional only after you confirm job completion.'
                            },
                            {
                                q: 'What if I\'m not satisfied with the work?',
                                a: 'We provide free mediation. If you\'re not satisfied, we\'ll work with both parties to find a solution before any payment is released.'
                            },
                            {
                                q: 'How are professionals verified?',
                                a: 'We verify identity, experience, and past work. Many providers also have customer reviews and ratings on their profiles.'
                            },
                            {
                                q: 'What areas do you serve?',
                                a: 'We currently serve Ogun State and are expanding to other Nigerian states. Check our locations page for coverage details.'
                            }
                        ].map((faq, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-naijaGreen transition-colors">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                                <p className="text-gray-600">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ForCustomersPage;