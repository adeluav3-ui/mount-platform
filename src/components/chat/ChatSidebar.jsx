// src/components/chat/ChatSidebar.jsx
import React, { useMemo } from 'react';
import { formatDistanceToNow } from '../../utils/dateUtils';

const roleConfig = {
    admin: { label: 'Admin', color: '#7c3aed', bg: '#ede9fe' },
    company: { label: 'Provider', color: '#1d4ed8', bg: '#dbeafe' },
    default: { label: 'Customer', color: '#15803d', bg: '#dcfce7' },
};

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / 86400000);
        if (diffDays === 0) return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString('en', { weekday: 'short' });
        return date.toLocaleDateString('en', { day: 'numeric', month: 'short' });
    } catch { return ''; }
}

function getPreview(conversation) {
    const msg = conversation.last_message;
    if (!msg || msg === 'No messages yet') return { text: 'No messages yet', isMedia: false };
    if (msg === '[Media]' || msg === '📷 Photo' || msg.startsWith('📷')) return { text: '📷 Photo', isMedia: true };
    if (msg.startsWith('🎥')) return { text: '🎥 Video', isMedia: true };
    return { text: msg.length > 35 ? msg.substring(0, 35) + '…' : msg, isMedia: false };
}

export default function ChatSidebar({ conversations, activeConversation, onSelectConversation, loading, currentUserId }) {
    const sorted = useMemo(() => [...conversations].sort((a, b) =>
        new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
    ), [conversations]);

    return (
        <div style={{ width: '100%', background: '#fff', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Messages</h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    // Skeleton loading
                    <div style={{ padding: '8px 0' }}>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', alignItems: 'center' }}>
                                <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#f3f4f6', flexShrink: 0, animation: 'shimmer 1.5s infinite' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: 13, width: '55%', borderRadius: 6, background: '#f3f4f6', marginBottom: 8 }} />
                                    <div style={{ height: 11, width: '80%', borderRadius: 6, background: '#f9fafb' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sorted.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                        <p style={{ color: '#374151', fontWeight: 600, margin: '0 0 4px' }}>No conversations yet</p>
                        <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>Messages will appear here when you start chatting</p>
                    </div>
                ) : (
                    sorted.map((conv) => {
                        const other = conv.other_participant;
                        const role = roleConfig[other?.role] || roleConfig.default;
                        const isActive = activeConversation?.id === conv.id;
                        const hasUnread = conv.unread_count > 0;
                        const { text: preview } = getPreview(conv);

                        return (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv)}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                                    background: isActive ? '#f0fdf4' : hasUnread ? '#fafafa' : '#fff',
                                    borderLeft: isActive ? '3px solid #1a7a4a' : '3px solid transparent',
                                    transition: 'background 0.15s',
                                }}
                                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = hasUnread ? '#fafafa' : '#fff'; }}
                            >
                                {/* Avatar */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <div style={{
                                        width: 46, height: 46, borderRadius: '50%',
                                        background: role.bg, color: role.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 15,
                                    }}>
                                        {getInitials(other?.full_name)}
                                    </div>
                                    {hasUnread && (
                                        <span style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            width: 10, height: 10, borderRadius: '50%',
                                            background: '#1a7a4a', border: '2px solid #fff',
                                        }} />
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                                        <span style={{ fontWeight: hasUnread ? 700 : 600, color: '#111827', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>
                                            {other?.full_name || 'Unknown'}
                                        </span>
                                        <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>
                                            {formatTime(conv.last_message_at)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, color: role.color, background: role.bg, padding: '1px 6px', borderRadius: 100 }}>
                                            {role.label}
                                        </span>
                                        {conv.job && (
                                            <span style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                · {conv.job.category}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 12, color: hasUnread ? '#111827' : '#9ca3af', fontWeight: hasUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                            {preview}
                                        </span>
                                        {hasUnread && (
                                            <span style={{ flexShrink: 0, minWidth: 18, height: 18, borderRadius: 9, background: '#1a7a4a', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                                                {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            <style>{`
                @keyframes shimmer {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}