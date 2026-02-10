// src/components/seo/ForProvidersPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleHelmet from './SimpleHelmet';
import { trackSEOButtonClick } from '../../utils/ga4';

const ForProvidersPage = () => {
    const navigate = useNavigate();

    const handleSignUpClick = () => {
        trackSEOButtonClick('Sign Up as Provider', '/for-providers');
        navigate('/login', { state: { userType: 'company', from: 'seo-for-providers' } });
    };

    const benefits = [
        {
            icon: '📈',
            title: 'More Jobs, Less Marketing',
            description: 'Get quality leads without spending on advertising. Focus on your craft while we handle customer acquisition.'
        },
        {
            icon: '💰',
            title: 'Secure & Timely Payments',
            description: 'Get paid through our secured payment system. No chasing payments or dealing with bounced checks.'
        },
        {
            icon: '🎯',
            title: 'Quality Customers',
            description: 'Customers on Mount are serious about getting work done and have budgets ready.'
        },
        {
            icon: '⭐',
            title: 'Build Your Reputation',
            description: 'Collect verified reviews that help you win more jobs and charge premium rates.'
        },
        {
            icon: '📱',
            title: 'Easy Job Management',
            description: 'Manage all your jobs, quotes, and customer communications in one dashboard.'
        },
        {
            icon: '🛡️',
            title: 'Dispute Protection',
            description: 'We mediate fairly in case of disagreements, protecting both you and the customer.'
        }
    ];

    const servicesList = [
        'Electrician ⚡',
        'Plumber 🔧',
        'Cleaning 🧹',
        'Painting 🎨',
        'AC Repair ❄️',
        'Carpenter 🪚',
        'Pest Control 🐜',
        'Roofing 🏠',
        'Logistics 🚚',
        'Hair Styling 💇'
    ];

    const paymentInfo = [
        {
            title: '50% Deposit',
            description: 'Paid directly to our account when customer accepts your quote'
        },
        {
            title: '30% Materials',
            description: 'Can be requested upfront for material purchases'
        },
        {
            title: '20% Completion',
            description: 'Released after customer confirms satisfaction'
        },
        {
            title: '5% Platform Fee',
            description: 'Only on completed jobs (lower than competitors)'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <SimpleHelmet
                title="For Service Providers - Grow Your Business in Nigeria | Mount"
                description="Join Mount as a service professional in Nigeria. Get quality leads, secure payments, and grow your business with our trusted platform."
                canonical="/for-providers"
            />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">
                            Grow Your Service Business with Mount
                        </h1>
                        <p className="text-xl mb-8 max-w-3xl mx-auto">
                            Join Nigeria's trusted home services marketplace. Get quality leads, secure payments, and tools to grow your business.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleSignUpClick}
                                className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors text-lg"
                            >
                                Sign Up as Provider
                            </button>
                            <button
                                onClick={() => navigate('/how-it-works')}
                                className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white/10 transition-colors text-lg"
                            >
                                How It Works
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
                            Why Service Professionals Choose Mount
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            We built Mount to help skilled professionals like you focus on what you do best.
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

            {/* Services We Cover */}
            <section className="py-16 px-4 bg-white">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Services We're Looking For
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            Whether you're an individual professional or a company, we welcome you.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {servicesList.map((service, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg text-center hover:bg-blue-50 transition-colors">
                                <div className="text-lg font-medium text-gray-900">{service}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-6">
                            Don't see your service? We're adding new categories regularly.
                        </p>
                        <button
                            onClick={() => navigate('/contact')}
                            className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                        >
                            Suggest a service category →
                        </button>
                    </div>
                </div>
            </section>

            {/* Payment Structure */}
            <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-gray-50">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Transparent Payment Structure
                        </h2>
                        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                            Clear terms, secure payments, and fair fees.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {paymentInfo.map((item, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-600">{item.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Key Advantages</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold">✓</span>
                                </div>
                                <span className="text-gray-700">No subscription fees</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold">✓</span>
                                </div>
                                <span className="text-gray-700">Pay only for completed jobs</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold">✓</span>
                                </div>
                                <span className="text-gray-700">Immediate Payment directly to your bank account</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold">✓</span>
                                </div>
                                <span className="text-gray-700">Bank transfer & digital payments</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How to Get Started */}
            <section className="py-16 px-4 bg-white">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            How to Get Started
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Simple process to join our trusted network.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {[
                            {
                                step: '1',
                                title: 'Sign Up',
                                description: 'Create your provider account in 5 minutes.'
                            },
                            {
                                step: '2',
                                title: 'Get Verified',
                                description: 'Complete our verification process (usually within 24 hours).'
                            },
                            {
                                step: '3',
                                title: 'Set Up Profile',
                                description: 'Add your services, prices, portfolio, and availability.'
                            },
                            {
                                step: '4',
                                title: 'Start Getting Jobs',
                                description: 'Receive job alerts, submit quotes, and grow your business.'
                            }
                        ].map((item, index) => (
                            <div key={index} className="flex items-start space-x-6">
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <p className="text-gray-600">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="container mx-auto max-w-4xl text-center">
                    <h2 className="text-3xl font-bold mb-6">
                        Ready to Grow Your Business?
                    </h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                        Join hundreds of professionals already growing their business on Mount.
                    </p>
                    <button
                        onClick={handleSignUpClick}
                        className="bg-white text-blue-600 font-bold py-4 px-12 rounded-lg hover:bg-gray-100 transition-colors text-lg"
                    >
                        Sign Up Now - It's Free
                    </button>
                    <p className="mt-4 opacity-80">
                        No upfront costs. Pay only when you complete jobs.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default ForProvidersPage;