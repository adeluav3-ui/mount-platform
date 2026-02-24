// src/components/chat/ChatWindow.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatInput from './ChatInput';
import { format } from '../../utils/dateUtils';
import MediaModal from './MediaModal';

function formatMessageTime(timestamp) {
    try { return format(new Date(timestamp), 'h:mm a'); } catch { return ''; }
}

function formatMessageDate(timestamp) {
    try {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return format(date, 'MMM d, yyyy');
    } catch { return ''; }
}

const roleColors = {
    admin: '#7c3aed',
    company: '#1d4ed8',
    default: '#15803d',
};

function Avatar({ participant, size = 36 }) {
    const color = roleColors[participant?.role] || roleColors.default;
    const initials = participant?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?';
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0 }}>
            {initials}
        </div>
    );
}

export default function ChatWindow({ conversation, messages, currentUserId, onSendMessage, loading, isMobile = false, onBack }) {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const [mediaModal, setMediaModal] = useState({ isOpen: false, url: '', type: '' });
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [newMsgCount, setNewMsgCount] = useState(0);
    const prevMsgCountRef = useRef(0);

    const other = conversation?.other_participant;

    // Smart scroll — only auto-scroll if user is near bottom
    const scrollToBottom = useCallback((force = false) => {
        if (force || isAtBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setNewMsgCount(0);
        }
    }, [isAtBottom]);

    useEffect(() => {
        const newCount = messages.length;
        const diff = newCount - prevMsgCountRef.current;
        prevMsgCountRef.current = newCount;

        if (diff <= 0) return;

        // If own message (optimistic), force scroll
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.sender_id === currentUserId) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            setNewMsgCount(0);
        } else if (!isAtBottom) {
            setNewMsgCount(prev => prev + diff);
        } else {
            scrollToBottom();
        }
    }, [messages.length]);

    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        setIsAtBottom(atBottom);
        if (atBottom) setNewMsgCount(0);
    }, []);

    // Group messages by date
    const grouped = messages.reduce((acc, msg) => {
        const date = formatMessageDate(msg.created_at);
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
    }, {});

    if (!conversation) {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 56 }}>💬</div>
                <p style={{ color: '#6b7280', fontSize: 16, fontWeight: 500 }}>Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f9fafb' }}>

            {/* Chat Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {(isMobile && onBack) && (
                    <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1a7a4a', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <Avatar participant={other} size={38} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{other?.full_name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                        {other?.role === 'admin' ? '👑 Admin' : other?.role === 'company' ? '🏢 Service Provider' : '👤 Customer'}
                    </div>
                </div>
            </div>

            {/* Messages area */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 0 }}
            >
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#1a7a4a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ color: '#9ca3af', fontSize: 14 }}>No messages yet. Say hello! 👋</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([date, dateMessages]) => (
                        <div key={date}>
                            {/* Date separator */}
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 8px' }}>
                                <span style={{ background: '#e5e7eb', color: '#6b7280', borderRadius: 100, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>
                                    {date}
                                </span>
                            </div>

                            {/* Messages */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {dateMessages.map((msg, i) => {
                                    const isOwn = msg.sender_id === currentUserId;
                                    const isPending = msg._pending;
                                    const prevMsg = dateMessages[i - 1];
                                    const nextMsg = dateMessages[i + 1];
                                    const isFirst = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                    const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                                    return (
                                        <div key={msg.id} style={{
                                            display: 'flex',
                                            justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                            marginBottom: isLast ? 8 : 2,
                                        }}>
                                            <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                                                {/* Bubble */}
                                                <div style={{
                                                    padding: '8px 12px',
                                                    borderRadius: isOwn
                                                        ? `16px 16px ${isLast ? '4px' : '16px'} 16px`
                                                        : `16px 16px 16px ${isLast ? '4px' : '16px'}`,
                                                    background: isOwn ? '#1a7a4a' : '#fff',
                                                    color: isOwn ? '#fff' : '#111827',
                                                    border: isOwn ? 'none' : '1px solid #e5e7eb',
                                                    opacity: isPending ? 0.75 : 1,
                                                    transition: 'opacity 0.2s',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                                                }}>
                                                    {msg.message && (
                                                        <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                            {msg.message}
                                                        </p>
                                                    )}

                                                    {/* Media */}
                                                    {msg.media_urls?.length > 0 && (
                                                        <div style={{ marginTop: msg.message ? 6 : 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                            {msg.media_urls.map((url, idx) => (
                                                                <div key={idx}>
                                                                    {msg.media_types?.[idx] === 'image' ? (
                                                                        <img src={url} alt="attachment"
                                                                            onClick={() => setMediaModal({ isOpen: true, url, type: 'image' })}
                                                                            style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, objectFit: 'cover', cursor: 'pointer', display: 'block', transition: 'opacity 0.15s' }}
                                                                            onMouseOver={e => e.target.style.opacity = '0.9'}
                                                                            onMouseOut={e => e.target.style.opacity = '1'}
                                                                        />
                                                                    ) : (
                                                                        <div style={{ position: 'relative', cursor: 'pointer', borderRadius: 10, overflow: 'hidden' }}
                                                                            onClick={() => setMediaModal({ isOpen: true, url, type: 'video' })}>
                                                                            <video src={url} style={{ maxWidth: '100%', maxHeight: 220, display: 'block', borderRadius: 10 }} />
                                                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
                                                                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                    <svg width="18" height="18" fill="#111827" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Timestamp + status */}
                                                {isLast && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, padding: '0 4px' }}>
                                                        <span style={{ fontSize: 10, color: '#9ca3af' }}>{formatMessageTime(msg.created_at)}</span>
                                                        {isOwn && (
                                                            <span style={{ fontSize: 11, color: isPending ? '#9ca3af' : msg.is_read ? '#1a7a4a' : '#9ca3af' }}>
                                                                {isPending ? '○' : msg.is_read ? '✓✓' : '✓'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {newMsgCount > 0 && (
                <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)' }}>
                    <button
                        onClick={() => { scrollToBottom(true); setNewMsgCount(0); }}
                        style={{ background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        ↓ {newMsgCount} new message{newMsgCount > 1 ? 's' : ''}
                    </button>
                </div>
            )}

            {/* Input */}
            <ChatInput onSendMessage={onSendMessage} disabled={loading} />

            <MediaModal
                isOpen={mediaModal.isOpen}
                onClose={() => setMediaModal({ isOpen: false, url: '', type: '' })}
                mediaUrl={mediaModal.url}
                mediaType={mediaModal.type}
            />

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}