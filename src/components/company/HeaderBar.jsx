// src/components/company/HeaderBar.jsx — USING YOUR EXISTING ANIMATIONS
import React from 'react'
export default function HeaderBar({
    showJobs,
    setShowJobs,
    showNotifications,
    setShowNotifications,
    newJobsCount,
    hasNewJobs,
    unreadNotificationsCount
}) {
    return (
        <div className="text-center mt-12 bg-white rounded-3xl shadow-2xl p-6 flex justify-around items-center">
            <div className="relative inline-block">
                <button
                    onClick={() => {
                        setShowJobs(true);
                        setShowNotifications(false);
                    }}
                    className="bg-naijaGreen text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-darkGreen transition shadow-lg relative group"
                >
                    View Jobs ({newJobsCount})

                    {/* Use your existing pulse-new animation */}
                    {hasNewJobs && (
                        <span className="absolute -top-1 -right-1">
                            <span className="relative flex h-5 w-5">
                                {/* Outer ping effect */}
                                <span className="animate-ping-new absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                {/* Inner solid dot with pulse effect */}
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 animate-pulse-new"></span>
                            </span>

                            {/* Optional: Tooltip text */}
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                New job alert!
                            </span>
                        </span>
                    )}
                </button>

                {/* Static red dot for pending jobs (with scale animation) */}
                {newJobsCount > 0 && !hasNewJobs && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center animate-scale">
                        {newJobsCount}
                    </span>
                )}
            </div>

            <div className="relative inline-block">
                <button
                    onClick={() => { setShowNotifications(p => !p); setShowJobs(false); }}
                    className="p-3 rounded-full bg-gray-200 text-naijaGreen hover:bg-gray-300 transition relative group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.424 0 23.834 23.834 0 0 0-5.424 0zM12 3v13.5m-3.952 2.872a3.344 3.344 0 0 0 7.904 0m-7.904 0a3.344 3.344 0 0 1-3.952-3.344V6.75A2.25 2.25 0 0 1 4.25 4.5h15.5a2.25 2.25 0 0 1 2.25 2.25v8.372a3.344 3.344 0 0 1-3.952 3.344z" />
                    </svg>

                    {/* Use glow animation for urgent notifications */}
                    {unreadNotificationsCount > 0 && (
                        <span className={`absolute top-0 right-0 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${unreadNotificationsCount > 3 ? 'animate-glow' : 'animate-ping-slow'
                            }`}>
                            {unreadNotificationsCount}
                        </span>
                    )}

                    {/* Tooltip for notification bell */}
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Notifications
                    </span>
                </button>
            </div>
        </div>
    )
}