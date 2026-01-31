// src/components/WelcomeScreen.jsx - MODERN & PROFESSIONAL
import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const WelcomeScreen = () => {
    const navigate = useNavigate();
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleGetStarted = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-naijaGreen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">

            {/* Animated Background Particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 md:w-2 md:h-2 bg-white/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Geometric Background Elements */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
                <div className="absolute -top-20 -left-20 w-64 h-64 border-2 border-white/30 rounded-full" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 border-2 border-white/20 rounded-full" />
                <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-40 h-40 border border-white/15 rounded-lg rotate-45" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-6xl">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

                    {/* Left Column - Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : -30 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="lg:w-1/2 text-center lg:text-left"
                    >
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.9 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 md:mb-8"
                        >
                            <span className="text-yellow-400">✨</span>
                            <span className="text-white text-sm md:text-base font-medium">
                                Nigeria's Trusted Marketplace
                            </span>
                        </motion.div>

                        {/* Main Heading */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 md:mb-6"
                        >
                            Quality Home Services
                            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-naijaGreen">
                                Made Simple
                            </span>
                        </motion.h1>

                        {/* Subheading */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="text-lg md:text-xl text-white/80 mb-8 md:mb-10 max-w-2xl"
                        >
                            Connect with verified professionals for all your home service needs.
                            Secure payments, guaranteed quality, and peace of mind.
                        </motion.p>

                        {/* Features Grid */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: showContent ? 1 : 0 }}
                            transition={{ duration: 0.8, delay: 1 }}
                            className="grid grid-cols-2 gap-4 mb-10 md:mb-12"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-yellow-400 text-lg">✓</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Verified Pros</h3>
                                    <p className="text-white/60 text-sm">Background-checked professionals</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-yellow-400 text-lg">🔒</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Secure Payments</h3>
                                    <p className="text-white/60 text-sm">Escrow-protected transactions</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-yellow-400 text-lg">⭐</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Quality Guarantee</h3>
                                    <p className="text-white/60 text-sm">Satisfaction guaranteed</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-yellow-400 text-lg">📱</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Easy Booking</h3>
                                    <p className="text-white/60 text-sm">Book services in minutes</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                            transition={{ duration: 0.6, delay: 1.2 }}
                        >
                            <button
                                onClick={handleGetStarted}
                                className="group relative bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 text-lg md:text-xl font-bold py-4 md:py-5 px-10 md:px-14 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 w-full md:w-auto"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    Get Started
                                    <motion.span
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            repeatType: "reverse"
                                        }}
                                        className="text-xl"
                                    >
                                        →
                                    </motion.span>
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                            </button>
                        </motion.div>
                    </motion.div>

                    {/* Right Column - Visual Element */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: showContent ? 1 : 0, x: showContent ? 0 : 30 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="lg:w-1/2 relative"
                    >
                        {/* Main Card */}
                        <div className="relative bg-white/5 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl">
                            {/* Floating Elements */}
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="absolute -top-4 -right-4 w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-2xl rotate-12 border border-yellow-400/30 backdrop-blur-sm"
                            />

                            <motion.div
                                animate={{
                                    y: [0, 15, 0],
                                }}
                                transition={{
                                    duration: 3.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5
                                }}
                                className="absolute -bottom-4 -left-4 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-naijaGreen/20 to-darkGreen/20 rounded-2xl -rotate-12 border border-green-400/30 backdrop-blur-sm"
                            />

                            {/* Logo/Icon Display */}
                            <div className="relative z-10 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
                                <div className="w-32 h-32 md:w-48 md:h-48 mb-8">
                                    <div className="relative w-full h-full">
                                        {/* Outer ring */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                duration: 20,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                            className="absolute inset-0 border-4 border-transparent border-t-yellow-500/50 border-r-yellow-500/30 rounded-full"
                                        />

                                        {/* Inner ring */}
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{
                                                duration: 15,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                            className="absolute inset-8 border-3 border-transparent border-b-naijaGreen/50 border-l-naijaGreen/30 rounded-full"
                                        />

                                        {/* Center logo */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-xl">
                                                <span className="text-3xl md:text-5xl font-bold text-gray-900">M</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Animated Text */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.5, duration: 0.8 }}
                                    className="text-center"
                                >
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                        Mount Services
                                    </h3>
                                    <p className="text-white/70 text-sm md:text-base">
                                        Your trusted platform for quality home services
                                    </p>
                                </motion.div>
                            </div>

                            {/* Decorative Dots */}
                            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ scale: [1, 1.3, 1] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: i * 0.3
                                        }}
                                        className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-white' : 'bg-naijaGreen'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Trust Indicator */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    className="mt-12 md:mt-16 pt-8 border-t border-white/10"
                >
                    <p className="text-white/50 text-sm md:text-base text-center">
                        Trusted by homeowners across Nigeria • Secure payments • Solid customer support
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default WelcomeScreen;