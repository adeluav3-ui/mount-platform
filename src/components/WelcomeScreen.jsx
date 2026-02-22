// src/components/WelcomeScreen.jsx - UPDATED FOR MOBILE
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
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handleGetStarted = () => {
        navigate('/app/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-naijaGreen via-[#054f3a] to-darkGreen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">

            {/* Background elements - hidden on very small screens */}
            <div className="hidden sm:block absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-white/5 rounded-full"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.1, 0.3]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-white/3 rounded-full"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.05, 0.2]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />
            </div>

            {/* Main content container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center max-w-2xl w-full px-4"
            >
                {/* Logo/Icon Animation - SMALLER ON MOBILE */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2
                    }}
                    className="mb-6 md:mb-8"
                >
                    <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl md:shadow-2xl overflow-hidden">
                        <img
                            src="/logo.png"
                            alt="Mount Logo"
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                                // Fallback if image doesn't load
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span class="text-3xl md:text-5xl font-bold text-naijaGreen">M</span>';
                            }}
                        />
                    </div>
                </motion.div>

                {/* Title - SMALLER ON MOBILE */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-3xl md:text-5xl lg:text-7xl font-bold text-white mb-3 md:mb-4"
                >
                    Welcome to <span className="text-yellow-400">Mount</span> {/* CHANGED TO Mount */}
                </motion.h1>

                {/* Subtitle - SMALLER ON MOBILE */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-base md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-10"
                >
                    Nigeria's Trusted Home Services Marketplace
                </motion.p>

                {/* Tagline - SIMPLIFIED ON MOBILE */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showContent ? 1 : 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mb-8 md:mb-12"
                >
                    <div className="inline-flex flex-wrap justify-center items-center gap-2 md:gap-4 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 md:px-6 md:py-3">
                        <span className="text-white text-sm md:text-base flex items-center">
                            <span className="mr-2">🔧</span> Verified
                        </span>
                        <span className="text-white/50 hidden sm:inline">•</span>
                        <span className="text-white text-sm md:text-base flex items-center">
                            <span className="mr-2">💰</span> Secure
                        </span>
                        <span className="text-white/50 hidden sm:inline">•</span>
                        <span className="text-white text-sm md:text-base flex items-center">
                            <span className="mr-2">⭐</span> Quality
                        </span>
                    </div>
                </motion.div>

                {/* Get Started Button - SMALLER ON MOBILE */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.8 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="mb-6 md:mb-8"
                >
                    <button
                        onClick={handleGetStarted}
                        className="group relative bg-white text-naijaGreen text-lg md:text-2xl font-bold py-4 md:py-6 px-12 md:px-16 rounded-full shadow-xl md:shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 w-full max-w-xs md:max-w-none"
                    >
                        <span className="relative z-10">Get Started</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                </motion.div>

                {/* Additional Options */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showContent ? 1 : 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="text-white/80 text-sm md:text-base"
                >
                    <p className="mb-2">Already have an account?</p>
                    <button
                        onClick={() => navigate('/app/login')}
                        className="text-yellow-300 hover:text-yellow-200 font-semibold underline text-base md:text-lg"
                    >
                        Sign In Here
                    </button>
                </motion.div>

                {/* Floating animation elements - HIDDEN ON MOBILE */}
                <motion.div
                    className="hidden md:block absolute -bottom-20 -left-20 w-40 h-40 border-4 border-white/10 rounded-full"
                    animate={{
                        rotate: 360,
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        rotate: {
                            duration: 20,
                            repeat: Infinity,
                            ease: "linear"
                        },
                        scale: {
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                />
                <motion.div
                    className="hidden md:block absolute -top-20 -right-20 w-60 h-60 border-4 border-white/5 rounded-full"
                    animate={{
                        rotate: -360,
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        rotate: {
                            duration: 25,
                            repeat: Infinity,
                            ease: "linear"
                        },
                        scale: {
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }
                    }}
                />
            </motion.div>
        </div>
    );
};

export default WelcomeScreen;

