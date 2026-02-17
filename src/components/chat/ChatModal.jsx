// src/components/chat/ChatModal.jsx
import React, { useState, useEffect } from 'react';
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
        refreshConversations
    } = useMessaging();

    const [view, setView] = useState('list');

    // Load conversations when modal opens
    useEffect(() => {
        if (isOpen) {
            refreshConversations();
            setView('list');
        }
    }, [isOpen, refreshConversations]);

    const handleSelectConversation = async (conversation) => {
        setActiveConversation(conversation);
        await loadMessages(conversation.id);
        setView('chat');
    };

    const handleBackToList = () => {
        setView('list');
        setActiveConversation(null);
    };

    const handleSendMessage = async (text, files) => {
        if (!activeConversation) return;
        await sendMessage(activeConversation.id, text, files);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Header */}
            <div className="bg-naijaGreen text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    {view === 'chat' && (
                        <button
                            onClick={handleBackToList}
                            className="mr-3 p-1 hover:bg-green-600 rounded-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <h2 className="text-lg font-bold">
                        {view === 'chat'
                            ? activeConversation?.other_participant?.full_name || 'Chat'
                            : 'Messages'}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-green-600 rounded-lg"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {view === 'list' ? (
                    <div className="h-full overflow-y-auto">
                        <ChatSidebar
                            conversations={conversations}
                            activeConversation={activeConversation}
                            onSelectConversation={handleSelectConversation}
                            loading={loading}
                            currentUserId={currentUserId}
                        />
                    </div>
                ) : (
                    <ChatWindow
                        conversation={activeConversation}
                        messages={messages}
                        currentUserId={currentUserId}
                        onSendMessage={handleSendMessage}
                        loading={loading}
                        isMobile={true}
                    />
                )}
            </div>
        </div>
    );
}