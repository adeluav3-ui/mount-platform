// src/components/chat/ChatModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessaging } from '../../context/MessagingContext.jsx';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

export default function ChatModal({ isOpen, onClose, currentUserId }) {
    const {
        conversations,
        activeConversation,
        messages,
        loading,
        setActiveConversation,
        loadMessages,
        sendMessage,
        refreshConversations,
    } = useMessaging();

    const [view, setView] = useState('list'); // 'list' | 'chat' (mobile only)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const hasLoadedRef = useRef(false);

    // Detect mobile
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    // Only refresh conversations once per open, not every render
    useEffect(() => {
        if (isOpen && !hasLoadedRef.current) {
            refreshConversations();
            hasLoadedRef.current = true;
        }
        if (!isOpen) {
            hasLoadedRef.current = false;
            setView('list');
        }
    }, [isOpen, refreshConversations]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const handleSelectConversation = useCallback(async (conversation) => {
        setActiveConversation(conversation);
        await loadMessages(conversation.id);
        setView('chat');
    }, [setActiveConversation, loadMessages]);

    const handleBack = useCallback(() => {
        setView('list');
        setActiveConversation(null);
    }, [setActiveConversation]);

    const handleSendMessage = useCallback(async (text, files, onProgress) => {
        if (!activeConversation) return;
        await sendMessage(activeConversation.id, text, files, onProgress);
    }, [activeConversation, sendMessage]);

    if (!isOpen) return null;

    return (
        // Backdrop
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.15s ease' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Modal container */}
            <div style={{
                background: '#fff',
                borderRadius: isMobile ? '20px 20px 0 0' : 16,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                width: isMobile ? '100%' : 'min(920px, 95vw)',
                height: isMobile ? '92vh' : 'min(680px, 90vh)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
                animation: isMobile ? 'slideUp 0.25s ease' : 'popIn 0.2s ease',
            }}>

                {/* Header */}
                <div style={{ background: '#1a7a4a', color: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isMobile && view === 'chat' && (
                            <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: 6, marginRight: 2 }}>
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            💬
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                                {isMobile && view === 'chat'
                                    ? activeConversation?.other_participant?.full_name || 'Chat'
                                    : 'Messages'}
                            </div>
                            {(!isMobile || view === 'list') && (
                                <div style={{ fontSize: 11, opacity: 0.8 }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: '#fff', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
                    {isMobile ? (
                        // ── Mobile: stacked views ──
                        view === 'list' ? (
                            <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
                                <ChatSidebar
                                    conversations={conversations}
                                    activeConversation={activeConversation}
                                    onSelectConversation={handleSelectConversation}
                                    loading={loading}
                                    currentUserId={currentUserId}
                                />
                            </div>
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <ChatWindow
                                    conversation={activeConversation}
                                    messages={messages}
                                    currentUserId={currentUserId}
                                    onSendMessage={handleSendMessage}
                                    loading={loading}
                                    isMobile={true}
                                    onBack={handleBack}
                                />
                            </div>
                        )
                    ) : (
                        // ── Desktop: side-by-side ──
                        <>
                            <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid #e5e7eb', overflowY: 'auto' }}>
                                <ChatSidebar
                                    conversations={conversations}
                                    activeConversation={activeConversation}
                                    onSelectConversation={handleSelectConversation}
                                    loading={loading}
                                    currentUserId={currentUserId}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                                <ChatWindow
                                    conversation={activeConversation}
                                    messages={messages}
                                    currentUserId={currentUserId}
                                    onSendMessage={handleSendMessage}
                                    loading={loading}
                                    isMobile={false}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}