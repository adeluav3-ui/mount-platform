// src/components/chat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import ChatInput from './ChatInput';
import { format } from '../../utils/dateUtils';
import MediaModal from './MediaModal';

export default function ChatWindow({
    conversation,
    messages,
    currentUserId,
    onSendMessage,
    loading,
    isMobile = false
}) {
    const messagesEndRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const messagesContainerRef = useRef(null);
    const [mediaModal, setMediaModal] = useState({ isOpen: false, url: '', type: '' });

    const otherParticipant = conversation?.other_participant;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text, files) => {
        if ((!text.trim() && (!files || files.length === 0)) || !conversation) return;

        setIsUploading(true);
        try {
            await onSendMessage(text, files);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const formatMessageTime = (timestamp) => {
        try {
            return format(new Date(timestamp), 'h:mm a');
        } catch {
            return '';
        }
    };

    const formatMessageDate = (timestamp) => {
        try {
            const date = new Date(timestamp);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            } else {
                return format(date, 'MMM d, yyyy');
            }
        } catch {
            return '';
        }
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatMessageDate(message.created_at);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-gray-500 text-lg">Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50">
            {/* Chat Header - Only show on mobile if needed */}
            {!isMobile && (
                <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${otherParticipant?.role === 'admin' ? 'bg-purple-500' :
                            otherParticipant?.role === 'company' ? 'bg-blue-500' :
                                'bg-green-500'
                            }`}>
                            {otherParticipant?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '?'}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-800">
                            {otherParticipant?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {otherParticipant?.role === 'admin' ? 'Admin' :
                                otherParticipant?.role === 'company' ? 'Service Provider' : 'Customer'}
                        </p>
                    </div>
                </div>
            )}

            {/* Messages Area - Flexible height */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-6"
                style={{ maxHeight: 'calc(100vh - 140px)' }}
            >
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-naijaGreen"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400">No messages yet. Say hello! 👋</p>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([date, dateMessages]) => (
                        <div key={date}>
                            {/* Date separator */}
                            <div className="flex justify-center mb-4">
                                <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                                    {date}
                                </span>
                            </div>

                            {/* Messages for this date */}
                            <div className="space-y-3">
                                {dateMessages.map((message) => {
                                    const isOwnMessage = message.sender_id === currentUserId;

                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : ''}`}>
                                                {/* Message bubble */}
                                                <div
                                                    className={`rounded-2xl px-4 py-2 ${isOwnMessage
                                                        ? 'bg-naijaGreen text-white rounded-br-none'
                                                        : 'bg-white border border-gray-200 rounded-bl-none'
                                                        }`}
                                                >
                                                    {/* Message text */}
                                                    {message.message && (
                                                        <p className="whitespace-pre-wrap break-words">
                                                            {message.message}
                                                        </p>
                                                    )}

                                                    {/* Media attachments */}
                                                    {message.media_urls && message.media_urls.length > 0 && (
                                                        <div className={`mt-2 space-y-2`}>
                                                            {message.media_urls.map((url, index) => (
                                                                <div key={index}>
                                                                    {message.media_types[index] === 'image' ? (
                                                                        <img
                                                                            src={url}
                                                                            alt="Attachment"
                                                                            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition max-h-64 object-cover"
                                                                            onClick={() => setMediaModal({
                                                                                isOpen: true,
                                                                                url: url,
                                                                                type: 'image'
                                                                            })}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            className="relative cursor-pointer group"
                                                                            onClick={() => setMediaModal({
                                                                                isOpen: true,
                                                                                url: url,
                                                                                type: 'video'
                                                                            })}
                                                                        >
                                                                            <video
                                                                                src={url}
                                                                                className="max-w-full rounded-lg max-h-64 object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-50 transition">
                                                                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                                                    <path d="M8 5v14l11-7z" />
                                                                                </svg>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Message time */}
                                                <p className={`text-xs text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                                    {formatMessageTime(message.created_at)}
                                                    {message.is_read && isOwnMessage && (
                                                        <span className="ml-2 text-green-500">✓✓</span>
                                                    )}
                                                </p>
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

            {/* Chat Input - Fixed at bottom */}
            <div className="bg-white border-t border-gray-200">
                <ChatInput
                    onSendMessage={handleSendMessage}
                    isUploading={isUploading}
                    disabled={loading}
                />
            </div>
            <MediaModal
                isOpen={mediaModal.isOpen}
                onClose={() => setMediaModal({ isOpen: false, url: '', type: '' })}
                mediaUrl={mediaModal.url}
                mediaType={mediaModal.type}
            />
        </div>
    );
}