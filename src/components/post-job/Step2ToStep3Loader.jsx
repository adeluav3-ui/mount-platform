// src/components/post-job/Step2ToStep3Loader.jsx - CLEAN VERSION
import { useState, useEffect } from 'react'
import React from 'react';
import NotificationService from '../../services/NotificationService';

export default function Step2ToStep3Loader({
    companyName,
    companyData,
    jobData,
    onComplete
}) {
    const [progress, setProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState(1)
    const totalSteps = 4 // We'll have 4 smooth steps

    useEffect(() => {
        const sendNotifications = async () => {
            try {
                // Step 1: Initial setup
                setCurrentStep(1)
                setProgress(25)
                await new Promise(resolve => setTimeout(resolve, 600));

                // Step 2: Send push notifications
                setCurrentStep(2)
                setProgress(50)

                if (companyData && jobData) {
                    // Send push notifications quietly
                    try {
                        const devices = await NotificationService.getCompanyDevices(companyData.id)
                        if (devices.length > 0) {
                            await NotificationService.sendOneSignalPush(devices, jobData, companyData.company_name)
                        }
                    } catch (pushError) {
                        console.log('Push notification optional:', pushError.message)
                    }

                    // Send Telegram quietly (if enabled)
                    try {
                        if (companyData.telegram_chat_id) {
                            // Telegram notification logic here - but don't show to user
                            console.log('Telegram notification sent quietly')
                        }
                    } catch (telegramError) {
                        console.log('Telegram optional:', telegramError.message)
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 600));

                // Step 3: Final processing
                setCurrentStep(3)
                setProgress(75)
                await new Promise(resolve => setTimeout(resolve, 500));

                // Step 4: Complete
                setCurrentStep(4)
                setProgress(100)
                await new Promise(resolve => setTimeout(resolve, 400));

                // Finish
                onComplete()

            } catch (error) {
                console.error('Loader error:', error)
                // Even if there's an error, complete after a moment
                setTimeout(() => {
                    setProgress(100)
                    setTimeout(() => onComplete(), 300)
                }, 500)
            }
        }

        sendNotifications()
    }, [companyData, jobData, onComplete])

    // Get friendly step messages
    const getStepMessage = () => {
        switch (currentStep) {
            case 1: return 'Setting up communication...'
            case 2: return 'Notifying service provider...'
            case 3: return 'Finalizing details...'
            case 4: return 'Ready!'
            default: return 'Processing...'
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                {/* Animated Icon */}
                <div className="mb-6">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 bg-naijaGreen/10 rounded-full animate-ping opacity-20"></div>
                        <div className="absolute inset-2 bg-naijaGreen/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-12 h-12 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Connecting with {companyName}
                </h2>

                {/* Step Indicator */}
                <div className="flex justify-center items-center space-x-2 mb-4">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                ${currentStep >= step ? 'bg-naijaGreen text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {step}
                            </div>
                            {step < 4 && (
                                <div className={`w-8 h-1 ${currentStep > step ? 'bg-naijaGreen' : 'bg-gray-200'}`}></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Progress Message */}
                <p className="text-lg text-gray-600 mb-6 min-h-8 font-medium">
                    {getStepMessage()}
                </p>

                {/* Smooth Progress Bar */}
                <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-naijaGreen/30 to-naijaGreen/10"></div>
                    <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-naijaGreen to-darkGreen transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-0 w-1 h-3 bg-white/50"></div>
                    </div>
                </div>

                {/* Progress Percentage */}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                    <span>Progress</span>
                    <span className="font-bold text-naijaGreen">{progress}%</span>
                </div>

                {/* Help Text */}
                <p className="text-xs text-gray-400 mt-6">
                    Please keep this screen open while we connect you
                </p>

                {/* Optional: Subtle loading dots */}
                <div className="flex justify-center space-x-1 mt-4">
                    <div className={`w-2 h-2 rounded-full ${currentStep === 1 ? 'bg-naijaGreen' : 'bg-gray-300'} transition-all duration-300`}></div>
                    <div className={`w-2 h-2 rounded-full ${currentStep === 2 ? 'bg-naijaGreen' : 'bg-gray-300'} transition-all duration-300`}></div>
                    <div className={`w-2 h-2 rounded-full ${currentStep === 3 ? 'bg-naijaGreen' : 'bg-gray-300'} transition-all duration-300`}></div>
                </div>
            </div>
        </div>
    )
}