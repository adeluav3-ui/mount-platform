// src/components/company/NotificationsPanel.jsx — FINAL & PERFECT
import React from 'react'
export default function NotificationsPanel({
    showNotifications,
    notifications,
    unreadNotificationsCount,
    onDismissAll
}) {
    if (!showNotifications) return null

    return (
        <div className="mt-6 bg-white rounded-3xl shadow-2xl p-8">
            <h3 className="text-2xl font-bold text-naijaGreen mb-6">
                Recent Notifications
            </h3>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No recent activity.</p>
                ) : (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            className={`p-5 rounded-2xl border-2 transition-all ${notif.type === 'declined'
                                ? 'bg-red-50 border-red-300'
                                : 'bg-green-50 border-green-300'
                                }`}
                        >
                            <p className="font-bold text-lg">
                                {notif.type === 'declined' ? 'Job Cancelled' : 'Job Update'}
                            </p>
                            <p className={`mt-1 font-medium ${notif.type === 'declined' ? 'text-red-700' : 'text-green-700'
                                }`}>
                                {notif.message}
                            </p>
                            <span className="text-xs text-gray-500 block mt-2">
                                {new Date(notif.timestamp).toLocaleString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Dismiss All Button */}
            {unreadNotificationsCount > 0 && (
                <div className="mt-8 text-center">
                    <button
                        onClick={onDismissAll}
                        className="text-sm font-medium text-gray-600 hover:text-naijaGreen underline transition"
                    >
                        Dismiss All Notifications
                    </button>
                </div>
            )}
        </div>
    )
}