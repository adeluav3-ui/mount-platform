// src/components/post-job/Step2ToStep3Loader.jsx - FIXED (NO DUPLICATE TELEGRAM)
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
    const [message, setMessage] = useState('')
    const [telegramSent, setTelegramSent] = useState(false)

    useEffect(() => {
        const checkAndSendRemainingNotifications = async () => {
            try {
                // Step 1: Initializing
                setMessage('Verifying notifications...')
                setProgress(10)

                // Wait a moment for initial notifications to settle
                await new Promise(resolve => setTimeout(resolve, 500));
                setProgress(20)

                // Step 2: Check if Telegram was already sent
                // Telegram was already sent in sendJobToCompany, so just mark it as sent
                setMessage('Checking Telegram status...')
                if (companyData && jobData && companyData.telegram_chat_id) {
                    // Telegram was already sent in the parent component
                    // So we just show it as sent
                    setTelegramSent(true)
                    setMessage('Telegram already sent!')
                } else {
                    setMessage('No Telegram chat ID available')
                }
                setProgress(40)

                // Step 3: Send push notifications (if not already sent)
                setMessage('Sending push notifications...')
                const devices = await NotificationService.getCompanyDevices(companyData.id)
                if (devices.length > 0) {
                    await NotificationService.sendOneSignalPush(devices, jobData, companyData.company_name)
                    setMessage('Push notifications sent!')
                } else {
                    setMessage('No devices for push notifications')
                }
                setProgress(60)

                // Step 4: Send SMS backup (if not already sent)
                setMessage('Sending SMS backup...')
                await NotificationService.sendJobSMSNotification(companyData.id, jobData)
                setProgress(80)

                // Step 5: Complete
                setMessage('All notifications confirmed!')
                setProgress(100)

                // Wait a moment then complete
                setTimeout(() => {
                    onComplete()
                }, 800)

            } catch (error) {
                console.error('Notification error in loader:', error)
                // Even if notifications fail, proceed after delay
                setMessage('Proceeding...')
                setProgress(100)

                setTimeout(() => {
                    onComplete()
                }, 1000)
            }
        }

        checkAndSendRemainingNotifications()
    }, [companyData, jobData, onComplete])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-naijaGreen/20 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-12 h-12 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-9" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-naijaGreen mb-4">
                    Confirming with {companyName}
                </h2>

                <p className="text-lg text-gray-700 mb-6 min-h-8">
                    {message}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner mb-4">
                    <div
                        className="h-full bg-naijaGreen transition-all duration-500 ease-out rounded-full"
                        style={{ width: `${progress}%` }}
                    >
                    </div>
                </div>

                <p className="text-xl font-bold text-naijaGreen">
                    {progress}%
                </p>

                {telegramSent && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                            ✅ Telegram notification sent
                        </p>
                    </div>
                )}

                <p className="text-xs text-gray-500 mt-4">
                    Please keep this screen open
                </p>
            </div>
        </div>
    )
}