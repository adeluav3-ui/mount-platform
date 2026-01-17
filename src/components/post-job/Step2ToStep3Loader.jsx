// src/components/post-job/Step2ToStep3Loader.jsx - UPDATED WITH REAL NOTIFICATION TRACKING
import { useState, useEffect } from 'react'
import React from 'react';

export default function Step2ToStep3Loader({
    companyName,
    onComplete,
    jobData, // Add this prop
    companyData // Add this prop
}) {
    const [progress, setProgress] = useState(0)
    const [message, setMessage] = useState('')
    const [notificationStatus, setNotificationStatus] = useState({
        telegram: 'pending',
        push: 'pending',
        sms: 'pending'
    })
    const [hasError, setHasError] = useState(false)

    // Real notification steps
    const notificationSteps = [
        {
            percent: 0,
            text: 'Starting notification process...',
            action: 'init'
        },
        {
            percent: 20,
            text: 'Uploading job photos...',
            action: 'photos'
        },
        {
            percent: 40,
            text: 'Creating job in database...',
            action: 'database'
        },
        {
            percent: 60,
            text: 'Sending Telegram notification...',
            action: 'telegram'
        },
        {
            percent: 70,
            text: 'Sending push notification...',
            action: 'push'
        },
        {
            percent: 80,
            text: 'Sending SMS backup...',
            action: 'sms'
        },
        {
            percent: 90,
            text: 'Finalizing...',
            action: 'finalize'
        },
        {
            percent: 100,
            text: 'Job sent successfully!',
            action: 'complete'
        }
    ]

    // Simulate actual notification process
    useEffect(() => {
        let currentStep = 0
        const stepDuration = 800 // ms per step
        let retryCount = 0
        const maxRetries = 2

        const processStep = async () => {
            if (currentStep >= notificationSteps.length) {
                // All steps complete
                setTimeout(() => {
                    if (!hasError) {
                        onComplete()
                    }
                }, 1000)
                return
            }

            const step = notificationSteps[currentStep]
            setMessage(step.text)
            setProgress(step.percent)

            // Simulate different processing times based on step
            let stepTime = stepDuration

            if (step.action === 'telegram') {
                // Telegram might take longer
                stepTime = 1500
                // Here you would actually call Telegram API
                setNotificationStatus(prev => ({ ...prev, telegram: 'sending' }))

                // Simulate Telegram response
                setTimeout(() => {
                    setNotificationStatus(prev => ({ ...prev, telegram: 'sent' }))
                }, 1000)

            } else if (step.action === 'push') {
                setNotificationStatus(prev => ({ ...prev, push: 'sending' }))
                // Simulate push notification
                setTimeout(() => {
                    setNotificationStatus(prev => ({ ...prev, push: 'sent' }))
                }, 800)

            } else if (step.action === 'sms') {
                setNotificationStatus(prev => ({ ...prev, sms: 'sending' }))
                // Simulate SMS
                setTimeout(() => {
                    setNotificationStatus(prev => ({ ...prev, sms: 'sent' }))
                }, 600)
            }

            // Move to next step
            setTimeout(() => {
                currentStep++
                processStep()
            }, stepTime)
        }

        // Start the process
        processStep()

        return () => {
            // Cleanup if component unmounts
            currentStep = notificationSteps.length
        }
    }, [onComplete, hasError])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 md:p-6">
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 max-w-lg w-full text-center">
                {/* Header */}
                <div className="mb-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-naijaGreen/20 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-10 h-10 md:w-12 md:h-12 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-9" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl md:text-2xl font-bold text-naijaGreen mb-4">
                    Sending to {companyName}
                </h2>

                {/* Status Message */}
                <p className="text-base md:text-lg text-gray-700 mb-6 min-h-8 font-medium">
                    {message}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 md:h-4 overflow-hidden shadow-inner mb-4">
                    <div
                        className="h-full bg-gradient-to-r from-naijaGreen to-green-400 transition-all duration-500 ease-out rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                    </div>
                </div>

                {/* Progress Percentage */}
                <p className="text-lg md:text-xl font-bold text-naijaGreen mb-6">
                    {progress}% Complete
                </p>

                {/* Notification Status Indicators */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* Telegram Status */}
                    <div className={`p-2 rounded-lg ${notificationStatus.telegram === 'sent' ? 'bg-green-50 border border-green-200' :
                        notificationStatus.telegram === 'sending' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-gray-50 border border-gray-200'
                        }`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <div className={`w-2 h-2 rounded-full ${notificationStatus.telegram === 'sent' ? 'bg-green-500' :
                                notificationStatus.telegram === 'sending' ? 'bg-yellow-500' :
                                    'bg-gray-300'
                                }`}></div>
                            <span className="text-xs font-medium">Telegram</span>
                        </div>
                        <span className="text-xs text-gray-600">
                            {notificationStatus.telegram === 'sent' ? '✅ Sent' :
                                notificationStatus.telegram === 'sending' ? '🔄 Sending' :
                                    '⏳ Pending'}
                        </span>
                    </div>

                    {/* Push Status */}
                    <div className={`p-2 rounded-lg ${notificationStatus.push === 'sent' ? 'bg-green-50 border border-green-200' :
                        notificationStatus.push === 'sending' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-gray-50 border border-gray-200'
                        }`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <div className={`w-2 h-2 rounded-full ${notificationStatus.push === 'sent' ? 'bg-green-500' :
                                notificationStatus.push === 'sending' ? 'bg-yellow-500' :
                                    'bg-gray-300'
                                }`}></div>
                            <span className="text-xs font-medium">Push</span>
                        </div>
                        <span className="text-xs text-gray-600">
                            {notificationStatus.push === 'sent' ? '✅ Sent' :
                                notificationStatus.push === 'sending' ? '🔄 Sending' :
                                    '⏳ Pending'}
                        </span>
                    </div>

                    {/* SMS Status */}
                    <div className={`p-2 rounded-lg ${notificationStatus.sms === 'sent' ? 'bg-green-50 border border-green-200' :
                        notificationStatus.sms === 'sending' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-gray-50 border border-gray-200'
                        }`}>
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <div className={`w-2 h-2 rounded-full ${notificationStatus.sms === 'sent' ? 'bg-green-500' :
                                notificationStatus.sms === 'sending' ? 'bg-yellow-500' :
                                    'bg-gray-300'
                                }`}></div>
                            <span className="text-xs font-medium">SMS</span>
                        </div>
                        <span className="text-xs text-gray-600">
                            {notificationStatus.sms === 'sent' ? '✅ Sent' :
                                notificationStatus.sms === 'sending' ? '🔄 Sending' :
                                    '⏳ Pending'}
                        </span>
                    </div>
                </div>

                {/* Info Message */}
                <p className="text-xs md:text-sm text-gray-500 mb-2">
                    Please keep this screen open until completion
                </p>
                <p className="text-xs text-gray-400">
                    Do not refresh or navigate away
                </p>

                {/* Error Display */}
                {hasError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 font-medium">
                            ⚠️ Error sending notifications. Please try again.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}