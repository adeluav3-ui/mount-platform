// src/context/MessagingContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';

const MessagingContext = createContext();

export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (!context) {
        throw new Error('useMessaging must be used within a MessagingProvider');
    }
    return context;
};

export const MessagingProvider = ({ children }) => {
    const { user, supabase } = useSupabase();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Simple function to fetch unread count directly
    const fetchUnreadCount = useCallback(async () => {
        if (!user || !supabase) return 0;

        try {
            // Get all conversations for user
            const { data: userConversations, error: convError } = await supabase
                .from('conversations')
                .select('id')
                .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

            if (convError || !userConversations || userConversations.length === 0) {
                setUnreadCount(0);
                return 0;
            }

            // Count unread messages
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', userConversations.map(c => c.id))
                .eq('is_read', false)
                .neq('sender_id', user.id);

            if (error) {
                console.error('Error counting unread messages:', error);
                setUnreadCount(0);
                return 0;
            }

            console.log('📊 Unread count fetched:', count);
            setUnreadCount(count || 0);
            return count || 0;
        } catch (error) {
            console.error('Error in fetchUnreadCount:', error);
            setUnreadCount(0);
            return 0;
        }
    }, [user, supabase]);

    // Load conversations
    const loadConversations = useCallback(async () => {
        if (!user || !supabase) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                *,
                participant_one:profiles!conversations_participant_one_fkey (
                    id,
                    full_name,
                    role
                ),
                participant_two:profiles!conversations_participant_two_fkey (
                    id,
                    full_name,
                    role
                ),
                job:jobs (
                    id,
                    category,
                    sub_service,
                    status
                )
            `)
                .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            // Process conversations
            const processedConvos = await Promise.all(data.map(async conv => {
                const otherParticipant = conv.participant_one.id === user.id
                    ? conv.participant_two
                    : conv.participant_one;

                // Get the last message from messages table if last_message is null
                let lastMessage = conv.last_message;
                if (!lastMessage) {
                    const { data: lastMsg } = await supabase
                        .from('messages')
                        .select('message, media_types')
                        .eq('conversation_id', conv.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single();

                    if (lastMsg) {
                        if (lastMsg.message) {
                            lastMessage = lastMsg.message;
                        } else if (lastMsg.media_types && lastMsg.media_types.length > 0) {
                            lastMessage = lastMsg.media_types[0] === 'image' ? '📷 Photo' : '🎥 Video';
                        }
                    }
                }

                // Get unread count
                const { count } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .eq('is_read', false)
                    .neq('sender_id', user.id);

                return {
                    ...conv,
                    other_participant: otherParticipant,
                    last_message: lastMessage || 'No messages yet',
                    unread_count: count || 0
                };
            }));

            setConversations(processedConvos);

            // Update total unread count
            const totalUnread = processedConvos.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
            setUnreadCount(totalUnread);

        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    // Load messages for a conversation
    const loadMessages = useCallback(async (conversationId) => {
        if (!conversationId || !supabase || !user) return;

        try {
            // Get messages
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(data || []);

            // Mark messages as read
            const { error: updateError } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            if (!updateError) {
                // Small delay to ensure database update completes
                setTimeout(async () => {
                    await fetchUnreadCount();
                }, 100);
            }

            return data;
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }, [supabase, user, fetchUnreadCount]);

    // Send a message
    // In MessagingContext.jsx, update the sendMessage function:

    const sendMessage = useCallback(async (conversationId, message, mediaFiles = []) => {
        if (!conversationId || !user || !supabase) return;

        try {
            // Upload media if any
            let mediaUrls = [];
            let mediaTypes = [];

            if (mediaFiles.length > 0) {
                for (const file of mediaFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${conversationId}/${Date.now()}_${Math.random()}.${fileExt}`;
                    const filePath = `message-media/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('chat-media')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('chat-media')
                        .getPublicUrl(filePath);

                    mediaUrls.push(publicUrl);
                    mediaTypes.push(file.type.startsWith('image/') ? 'image' : 'video');
                }
            }

            // Determine the message preview text
            let messagePreview = message || '';
            if (mediaFiles.length > 0 && !message) {
                messagePreview = mediaFiles[0].type.startsWith('image/') ? '📷 Photo' : '🎥 Video';
            }

            // Insert message
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    message: message || null,
                    media_urls: mediaUrls,
                    media_types: mediaTypes,
                    is_read: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Update local messages
            setMessages(prev => [...prev, data]);

            // Update the conversations table with the last message
            const { error: updateError } = await supabase
                .from('conversations')
                .update({
                    last_message: messagePreview || (mediaFiles.length > 0 ? '📷 Photo' : message),
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', conversationId);

            if (updateError) {
                console.error('Error updating conversation last_message:', updateError);
            }

            // Update local conversations list
            setConversations(prev =>
                prev.map(conv =>
                    conv.id === conversationId
                        ? {
                            ...conv,
                            last_message: messagePreview || (mediaFiles.length > 0 ? '📷 Photo' : message),
                            last_message_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                        : conv
                ).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
            );

            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }, [user, supabase]);
    // Create conversation
    const createConversation = useCallback(async (otherUserId, jobId = null) => {
        if (!user || !otherUserId || !supabase) return;

        try {
            // Check if exists
            const { data: existing, error: checkError } = await supabase
                .from('conversations')
                .select('*')
                .or(`and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`);

            if (checkError) throw checkError;

            if (existing && existing.length > 0) {
                setActiveConversation(existing[0]);
                await loadMessages(existing[0].id);
                return existing[0];
            }

            // Create new
            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    participant_one: user.id,
                    participant_two: otherUserId,
                    job_id: jobId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select(`
                    *,
                    participant_one:profiles!conversations_participant_one_fkey (
                        id,
                        full_name,
                        role
                    ),
                    participant_two:profiles!conversations_participant_two_fkey (
                        id,
                        full_name,
                        role
                    )
                `)
                .single();

            if (error) throw error;

            const otherParticipant = data.participant_one.id === user.id
                ? data.participant_two
                : data.participant_one;

            const newConversation = {
                ...data,
                other_participant: otherParticipant
            };

            setConversations(prev => [newConversation, ...prev]);
            setActiveConversation(newConversation);

            return newConversation;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    }, [user, supabase, loadMessages]);

    // Real-time subscription
    useEffect(() => {
        if (!user || !supabase) return;

        loadConversations();

        const messageChannel = supabase
            .channel('messages-changes')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, async (payload) => {
                // Check if this message belongs to user
                const { data: conv, error } = await supabase
                    .from('conversations')
                    .select('participant_one, participant_two')
                    .eq('id', payload.new.conversation_id)
                    .single();

                if (!error && conv && (conv.participant_one === user.id || conv.participant_two === user.id)) {

                    // If active conversation, add message and mark as read
                    if (activeConversation?.id === payload.new.conversation_id) {
                        setMessages(prev => [...prev, payload.new]);

                        if (payload.new.sender_id !== user.id) {
                            await supabase
                                .from('messages')
                                .update({ is_read: true })
                                .eq('id', payload.new.id);
                        }
                    }

                    // Refresh unread count
                    await fetchUnreadCount();

                    // Refresh conversations
                    loadConversations();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(messageChannel);
        };
    }, [user, supabase, activeConversation, fetchUnreadCount, loadConversations]);

    // Add this function inside your MessagingProvider, before the value object
    const getDirectUnreadCount = useCallback(async () => {
        if (!user || !supabase) return 0;

        try {
            // Get all conversations for user
            const { data: conversations, error: convError } = await supabase
                .from('conversations')
                .select('id')
                .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

            if (convError || !conversations || conversations.length === 0) {
                return 0;
            }

            // Count unread messages
            const { count, error } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversations.map(c => c.id))
                .eq('is_read', false)
                .neq('sender_id', user.id);

            if (error) {
                console.error('Error counting unread messages:', error);
                return 0;
            }

            console.log('Direct unread count query result:', count);
            return count || 0;
        } catch (error) {
            console.error('Error in getDirectUnreadCount:', error);
            return 0;
        }
    }, [user, supabase]);

    // Add it to the value object
    const value = {
        conversations,
        activeConversation,
        messages,
        loading,
        unreadCount,
        setActiveConversation,
        loadMessages,
        sendMessage,
        createConversation,
        refreshConversations: loadConversations,
        getDirectUnreadCount // Add this
    };

    return (
        <MessagingContext.Provider value={value}>
            {children}
        </MessagingContext.Provider>
    );
};