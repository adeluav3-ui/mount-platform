// src/components/chat/ChatSidebar.jsx
import React from 'react';
import { formatDistanceToNow } from '../../utils/dateUtils';

export default function ChatSidebar({
    conversations,
    activeConversation,
    onSelectConversation,
    loading,
    currentUserId
}) {
    const getOtherParticipant = (conversation) => {
        return conversation.other_participant;
    };

    const getParticipantRole = (participant) => {
        switch (participant?.role) {
            case 'admin':
                return '👑 Admin';
            case 'company':
                return '🏢 Company';
            default:
                return '👤 Customer';
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        } catch {
            return '';
        }
    };

    // Get message preview text
    // In ChatSidebar.jsx, update the getMessagePreview function:

    const getMessagePreview = (conversation) => {
        if (!conversation.last_message || conversation.last_message === 'No messages yet') {
            // Try to get from messages if available
            if (conversation.messages && conversation.messages.length > 0) {
                const lastMsg = conversation.messages[conversation.messages.length - 1];
                if (lastMsg.message) {
                    return lastMsg.message.length > 30
                        ? lastMsg.message.substring(0, 30) + '...'
                        : lastMsg.message;
                } else if (lastMsg.media_types && lastMsg.media_types.length > 0) {
                    return lastMsg.media_types[0] === 'image' ? '📷 Photo' : '🎥 Video';
                }
            }
            return 'No messages yet';
        }

        // Check if it's a media message
        if (conversation.last_message === '[Media]' || conversation.last_message === '📷 Photo' || conversation.last_message === '🎥 Video') {
            return conversation.last_message.includes('📷') ? '📷 Photo' : '🎥 Video';
        }

        // Truncate long messages
        return conversation.last_message.length > 30
            ? conversation.last_message.substring(0, 30) + '...'
            : conversation.last_message;
    };

    return (
        <div className="w-full bg-white flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-naijaGreen">Messages</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-naijaGreen"></div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <div className="text-4xl mb-3">💬</div>
                        <p className="text-gray-500">No conversations yet</p>
                        <p className="text-sm text-gray-400 mt-2">
                            Messages will appear here when you start chatting
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {conversations.map((conversation) => {
                            const other = getOtherParticipant(conversation);
                            const isActive = activeConversation?.id === conversation.id;
                            const hasUnread = conversation.unread_count > 0;
                            const messagePreview = getMessagePreview(conversation);

                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => onSelectConversation(conversation)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${isActive ? 'bg-green-50 border-l-4 border-naijaGreen' : ''
                                        } ${hasUnread ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {other?.avatar_url ? (
                                                <img
                                                    src={other.avatar_url}
                                                    alt={other.full_name}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${other?.role === 'admin' ? 'bg-purple-500' :
                                                    other?.role === 'company' ? 'bg-blue-500' :
                                                        'bg-green-500'
                                                    }`}>
                                                    {getInitials(other?.full_name)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className={`font-semibold text-gray-800 truncate ${hasUnread ? 'font-bold' : ''
                                                    }`}>
                                                    {other?.full_name || 'Unknown User'}
                                                </p>
                                                <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                                    {formatTime(conversation.last_message_at)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-500 mb-1">
                                                {getParticipantRole(other)}
                                            </p>

                                            {conversation.job && (
                                                <p className="text-xs text-naijaGreen mb-1 truncate">
                                                    📋 {conversation.job.category}
                                                    {conversation.job.sub_service && ` • ${conversation.job.sub_service}`}
                                                </p>
                                            )}

                                            {/* Message Preview - Like WhatsApp */}
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm truncate max-w-[180px] ${hasUnread
                                                    ? 'font-semibold text-gray-900'
                                                    : 'text-gray-500'
                                                    }`}>
                                                    {messagePreview}
                                                </p>
                                                {hasUnread && (
                                                    <span className="inline-block w-2 h-2 bg-naijaGreen rounded-full flex-shrink-0 ml-2"></span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}