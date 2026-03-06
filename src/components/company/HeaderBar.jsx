// src/components/company/HeaderBar.jsx — REFINED VERSION
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
        <div className="mt-12 bg-white rounded-3xl shadow-xl border border-gray-100 px-4 sm:px-8 py-5 flex items-center justify-between gap-4">

            {/* ── View Jobs Button ── */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowJobs(true)
                        setShowNotifications(false)
                    }}
                    className={`relative flex items-center gap-2.5 font-bold text-sm sm:text-base px-5 sm:px-8 py-3 rounded-2xl transition-all duration-200 shadow-sm ${showJobs
                            ? 'bg-naijaGreen text-white shadow-md shadow-naijaGreen/20'
                            : 'bg-naijaGreen/10 text-naijaGreen hover:bg-naijaGreen hover:text-white hover:shadow-md hover:shadow-naijaGreen/20'
                        }`}
                >
                    {/* BUG FIX: Original showed count BOTH in the button label AND as a 
                        separate red badge — double display. Now: label shows count only,
                        badge is reserved for the "new jobs" pulse animation state. */}
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Jobs</span>
                    {newJobsCount > 0 && (
                        <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${showJobs ? 'bg-white/25 text-white' : 'bg-naijaGreen text-white'
                            }`}>
                            {newJobsCount}
                        </span>
                    )}

                    {/* Pulse ring for brand-new jobs */}
                    {hasNewJobs && (
                        <span className="absolute -top-1 -right-1 group/tip">
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
                            </span>
                            {/* Tooltip */}
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded-lg opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                New jobs!
                            </span>
                        </span>
                    )}
                </button>
            </div>

            {/* ── Notifications Bell ── */}
            <button
                onClick={() => {
                    setShowNotifications(prev => !prev)
                    setShowJobs(false)
                }}
                className={`relative p-3 rounded-2xl transition-all duration-200 group/bell ${showNotifications
                        ? 'bg-naijaGreen text-white shadow-md shadow-naijaGreen/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-naijaGreen/10 hover:text-naijaGreen'
                    }`}
                aria-label="Notifications"
            >
                {/* BUG FIX: Original bell SVG had an incorrect/broken path that didn't
                    render a bell shape. Replaced with a correct bell icon. */}
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Unread badge */}
                {unreadNotificationsCount > 0 && (
                    <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white text-xs font-bold ${unreadNotificationsCount > 3 ? 'bg-red-600 animate-pulse' : 'bg-red-500'
                        }`}>
                        {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </span>
                )}

                {/* Tooltip */}
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded-lg opacity-0 group-hover/bell:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {unreadNotificationsCount > 0 ? `${unreadNotificationsCount} unread` : 'Notifications'}
                </span>
            </button>
        </div>
    )
}