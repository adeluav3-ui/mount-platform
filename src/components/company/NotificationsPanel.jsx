// src/components/company/NotificationsPanel.jsx — REFINED VERSION
import React from 'react'

// ─── NOTIFICATION CONFIG ──────────────────────────────────────────────────────
// Maps every notification type from the database to a label, icon, and color.
// BUG FIX: Original only checked for 'declined', treating every other type as
// a generic "Job Update". This maps all real notification types from the DB.
const NOTIF_CONFIG = {
    // Job lifecycle
    job_declined: { label: 'Job Declined', icon: '❌', accent: '#EF4444', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    declined_by_customer: { label: 'Job Cancelled by Customer', icon: '🚫', accent: '#EF4444', bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    quote_received: { label: 'New Quote Received', icon: '📋', accent: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
    work_completed: { label: 'Work Completed', icon: '✅', accent: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    work_disputed: { label: 'Work Disputed', icon: '⚠️', accent: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
    work_rectified: { label: 'Issue Fixed', icon: '🔧', accent: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6' },
    // Payments
    deposit_paid: { label: 'Deposit Received', icon: '💳', accent: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    intermediate_payment_requested: { label: 'Intermediate Payment Requested', icon: '💰', accent: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
    intermediate_paid: { label: 'Intermediate Payment Received', icon: '💰', accent: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6' },
    final_payment: { label: 'Final Payment Received', icon: '🏆', accent: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    completed_paid: { label: 'Job Complete & Paid', icon: '🏆', accent: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    // Onsite
    onsite_fee_requested: { label: 'Onsite Fee Requested', icon: '🏠', accent: '#F97316', bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
    onsite_fee_confirmed: { label: 'Onsite Fee Confirmed', icon: '✅', accent: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    onsite_fee_not_received: { label: 'Onsite Fee Not Received', icon: '⏳', accent: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
}

const getConfig = (type) =>
    NOTIF_CONFIG[type] || { label: 'Job Update', icon: '🔔', accent: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', text: '#374151' }

// ─── FORMAT TIMESTAMP ─────────────────────────────────────────────────────────
// BUG FIX: Original used notif.timestamp which doesn't exist in the DB.
// The real field is created_at. This handles both gracefully.
const formatTime = (notif) => {
    const raw = notif.created_at || notif.timestamp
    if (!raw) return 'Just now'
    const date = new Date(raw)
    if (isNaN(date)) return 'Just now'

    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: diffDays > 365 ? 'numeric' : undefined })
}

const formatFullTime = (notif) => {
    const raw = notif.created_at || notif.timestamp
    if (!raw) return ''
    const date = new Date(raw)
    if (isNaN(date)) return ''
    return date.toLocaleString('en-NG', {
        weekday: 'short', year: 'numeric', month: 'short',
        day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function NotificationsPanel({
    showNotifications,
    notifications,
    unreadNotificationsCount,
    onDismissAll
}) {
    if (!showNotifications) return null

    const hasNotifications = notifications && notifications.length > 0

    return (
        <div className="mt-6 bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-naijaGreen/10 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
                        {unreadNotificationsCount > 0 && (
                            <p className="text-xs text-gray-500">
                                {unreadNotificationsCount} unread
                            </p>
                        )}
                    </div>
                </div>

                {/* BUG FIX: Dismiss All was hidden when unreadCount was 0, but we still
                    want it visible as long as there are notifications to clear */}
                {hasNotifications && onDismissAll && (
                    <button
                        onClick={onDismissAll}
                        className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* ── Notification List ── */}
            <div className="divide-y divide-gray-50">
                {!hasNotifications ? (
                    // ── Empty State ──
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                            🔔
                        </div>
                        <p className="font-bold text-gray-600 text-base">You're all caught up</p>
                        <p className="text-gray-400 text-sm mt-1">New job updates and payment alerts will appear here.</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const config = getConfig(notif.type)
                        const isUnread = !notif.read

                        return (
                            <div
                                key={notif.id}
                                className={`relative flex items-start gap-3.5 px-5 sm:px-6 py-4 transition-colors ${isUnread ? 'bg-white' : 'bg-gray-50/40'}`}
                            >
                                {/* Unread indicator */}
                                {isUnread && (
                                    <span
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: config.accent }}
                                    />
                                )}

                                {/* Icon */}
                                <div
                                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base mt-0.5"
                                    style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}
                                >
                                    {config.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={`text-sm font-bold leading-snug ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}
                                            style={{ color: isUnread ? config.text : undefined }}
                                        >
                                            {config.label}
                                        </p>
                                        <time
                                            className="shrink-0 text-xs text-gray-400 mt-0.5"
                                            title={formatFullTime(notif)}
                                        >
                                            {formatTime(notif)}
                                        </time>
                                    </div>
                                    <p className={`text-sm mt-0.5 break-words leading-relaxed ${isUnread ? 'text-gray-700' : 'text-gray-400'}`}>
                                        {notif.message}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* ── Footer ── */}
            {hasNotifications && unreadNotificationsCount > 0 && (
                <div className="px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/60">
                    <button
                        onClick={onDismissAll}
                        className="w-full text-sm font-semibold text-gray-500 hover:text-naijaGreen transition-colors py-1.5 rounded-xl hover:bg-naijaGreen/5"
                    >
                        Mark all as read
                    </button>
                </div>
            )}
        </div>
    )
}