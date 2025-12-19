// src/components/post-job/Step2ToStep3Loader.jsx
import { useState, useEffect } from 'react'
import React from 'react';
export default function Step2ToStep3Loader({ companyName, onComplete }) {
    const [progress, setProgress] = useState(0)
    const [message, setMessage] = useState('')

    const messages = [
        { percent: 10, text: 'Uploading your photos...' },
        { percent: 40, text: 'Processing job details...' },
        { percent: 70, text: 'Sending to ' + companyName + '...' },
        { percent: 90, text: 'Almost there!' },
        { percent: 100, text: 'Job sent successfully!' }
    ]

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer)
                    setTimeout(onComplete, 800) // Show "Job sent" for a moment
                    return 100
                }

                // Find next message
                const next = messages.find(m => m.percent > prev)
                if (next && prev < next.percent) {
                    setMessage(next.text)
                }

                return Math.min(prev + 2, 100)
            })
        }, 80)

        return () => clearInterval(timer)
    }, [onComplete])

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
                <div className="mb-8">
                    <div className="w-32 h-32 mx-auto bg-naijaGreen/20 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-16 h-16 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-9" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-naijaGreen mb-6">
                    Sending Your Job...
                </h2>

                <p className="text-lg text-gray-700 mb-8 min-h-8">
                    {message || 'Preparing your request...'}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-naijaGreen transition-all duration-500 ease-out rounded-full relative"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                    </div>
                </div>

                <p className="mt-4 text-2xl font-bold text-naijaGreen">
                    {progress}%
                </p>
            </div>
        </div>
    )
}