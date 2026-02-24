// src/context/MessagingContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from './SupabaseContext';

const MessagingContext = createContext();

export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (!context) throw new Error('useMessaging must be used within a MessagingProvider');
    return context;
};

// ── Module-level flag — survives modal open/close/re-render cycles ────────────
// The provider itself never unmounts (it wraps the whole app), but just in case,
// keeping this outside the component guarantees it is never accidentally reset.
let _initialized = false;

export const MessagingProvider = ({ children }) => {
    const { user, supabase } = useSupabase();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const activeConvRef = useRef(null);
    const channelRef = useRef(null);

    useEffect(() => { activeConvRef.current = activeConversation; }, [activeConversation]);

    // ── Load conversations ────────────────────────────────────────────────
    const loadConversations = useCallback(async () => {
        if (!user || !supabase) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participant_one:profiles!conversations_participant_one_fkey(id, full_name, role),
                    participant_two:profiles!conversations_participant_two_fkey(id, full_name, role),
                    job:jobs(id, category, sub_service, status)
                `)
                .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            const convIds = data.map(c => c.id);
            let unreadMap = {};
            if (convIds.length > 0) {
                const { data: unreadRows } = await supabase
                    .from('messages')
                    .select('conversation_id')
                    .in('conversation_id', convIds)
                    .eq('is_read', false)
                    .neq('sender_id', user.id);

                (unreadRows || []).forEach(r => {
                    unreadMap[r.conversation_id] = (unreadMap[r.conversation_id] || 0) + 1;
                });
            }

            // For any conversation with messages but no last_message saved,
            // fetch and backfill the preview so future loads are correct.
            const needsPreview = data.filter(c => !c.last_message && convIds.includes(c.id));
            if (needsPreview.length > 0) {
                const previews = await Promise.all(needsPreview.map(async (c) => {
                    const { data: msgs } = await supabase
                        .from('messages')
                        .select('message, media_types, created_at')
                        .eq('conversation_id', c.id)
                        .order('created_at', { ascending: false })
                        .limit(1);
                    if (!msgs?.length) return null;
                    const latest = msgs[0];
                    const preview = latest.message || (latest.media_types?.[0] === 'image' ? '📷 Photo' : '🎥 Video');
                    // Write it to DB so this backfill only needs to happen once
                    await supabase.from('conversations')
                        .update({ last_message: preview, last_message_at: latest.created_at })
                        .eq('id', c.id);
                    return { id: c.id, preview, last_message_at: latest.created_at };
                }));

                // Merge backfilled previews into data before setting state
                previews.filter(Boolean).forEach(p => {
                    const conv = data.find(c => c.id === p.id);
                    if (conv) {
                        conv.last_message = p.preview;
                        conv.last_message_at = p.last_message_at;
                    }
                });
            }

            const processed = data.map(conv => ({
                ...conv,
                other_participant: conv.participant_one.id === user.id
                    ? conv.participant_two : conv.participant_one,
                last_message: conv.last_message || 'No messages yet',
                unread_count: unreadMap[conv.id] || 0,
            }));

            setConversations(processed);
            const total = Object.values(unreadMap).reduce((s, v) => s + v, 0);
            setUnreadCount(total);
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    // ── Load messages ─────────────────────────────────────────────────────
    const loadMessages = useCallback(async (conversationId) => {
        if (!conversationId || !supabase || !user) return;
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Clear badge immediately in local state
            setConversations(prev => prev.map(c => {
                if (c.id !== conversationId) return c;
                const wasUnread = c.unread_count || 0;
                if (wasUnread > 0) setUnreadCount(u => Math.max(0, u - wasUnread));
                return { ...c, unread_count: 0 };
            }));

            // Backfill preview from real messages if still showing placeholder
            if (data?.length > 0) {
                const latest = data[data.length - 1];
                const derivedPreview = latest.message
                    || (latest.media_types?.[0] === 'image' ? '📷 Photo' : '🎥 Video');

                setConversations(prev => prev.map(c => {
                    if (c.id !== conversationId) return c;
                    if (c.last_message && c.last_message !== 'No messages yet') return c;
                    // Fix it in the DB so modal re-opens don't regress
                    supabase.from('conversations')
                        .update({ last_message: derivedPreview, last_message_at: latest.created_at })
                        .eq('id', conversationId);
                    return { ...c, last_message: derivedPreview, last_message_at: latest.created_at };
                }));
            }

            // AWAIT the mark-as-read so if loadConversations ever re-runs,
            // the DB rows are already clean and won't re-inflate the badge.
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', user.id)
                .eq('is_read', false);

            return data;
        } catch (err) {
            console.error('Error loading messages:', err);
        }
    }, [supabase, user]);

    // ── Send message ──────────────────────────────────────────────────────
    const sendMessage = useCallback(async (conversationId, message, mediaFiles = [], onProgress) => {
        if (!conversationId || !user || !supabase) return;

        const tempId = `temp_${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: user.id,
            message: message || null,
            media_urls: [],
            media_types: [],
            is_read: false,
            created_at: new Date().toISOString(),
            _pending: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            let mediaUrls = [];
            let mediaTypes = [];

            for (let i = 0; i < mediaFiles.length; i++) {
                const file = mediaFiles[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${conversationId}/${Date.now()}_${i}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('chat-media')
                    .upload(`message-media/${fileName}`, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('chat-media')
                    .getPublicUrl(`message-media/${fileName}`);

                mediaUrls.push(publicUrl);
                mediaTypes.push(file.type.startsWith('image/') ? 'image' : 'video');
                onProgress?.((i + 1) / mediaFiles.length);
            }

            const messagePreview = message
                || (mediaFiles[0]?.type.startsWith('image/') ? '📷 Photo' : '🎥 Video')
                || '';

            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    message: message || null,
                    media_urls: mediaUrls,
                    media_types: mediaTypes,
                    is_read: false,
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;

            setMessages(prev => prev.map(m => m.id === tempId ? data : m));

            // Always write last_message to DB — this is the source of truth for
            // all future loads, so every open of the modal gets correct previews.
            await supabase.from('conversations').update({
                last_message: messagePreview,
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }).eq('id', conversationId);

            setConversations(prev =>
                prev.map(conv => conv.id === conversationId
                    ? { ...conv, last_message: messagePreview, last_message_at: new Date().toISOString() }
                    : conv
                ).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
            );

            return data;
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            console.error('Error sending message:', err);
            throw err;
        }
    }, [user, supabase]);

    // ── Create conversation ───────────────────────────────────────────────
    const createConversation = useCallback(async (otherUserId, jobId = null) => {
        if (!user || !otherUserId || !supabase) return;
        try {
            const { data: existing } = await supabase
                .from('conversations')
                .select('*')
                .or(`and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`);

            if (existing?.length > 0) {
                setActiveConversation(existing[0]);
                await loadMessages(existing[0].id);
                return existing[0];
            }

            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    participant_one: user.id,
                    participant_two: otherUserId,
                    job_id: jobId,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select(`
                    *,
                    participant_one:profiles!conversations_participant_one_fkey(id, full_name, role),
                    participant_two:profiles!conversations_participant_two_fkey(id, full_name, role)
                `)
                .single();

            if (error) throw error;

            const newConv = {
                ...data,
                other_participant: data.participant_one.id === user.id ? data.participant_two : data.participant_one,
                unread_count: 0,
                last_message: 'No messages yet',
            };

            setConversations(prev => [newConv, ...prev]);
            setActiveConversation(newConv);
            return newConv;
        } catch (err) {
            console.error('Error creating conversation:', err);
            throw err;
        }
    }, [user, supabase, loadMessages]);

    // ── Initialize once, subscribe to real-time ───────────────────────────
    useEffect(() => {
        if (!user || !supabase) return;
        if (_initialized) return; // module-level guard — never resets on re-render
        _initialized = true;

        loadConversations();

        if (channelRef.current) supabase.removeChannel(channelRef.current);

        channelRef.current = supabase
            .channel(`messages-${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
                const msg = payload.new;

                const { data: conv } = await supabase
                    .from('conversations')
                    .select('participant_one, participant_two')
                    .eq('id', msg.conversation_id)
                    .single();

                if (!conv || (conv.participant_one !== user.id && conv.participant_two !== user.id)) return;
                if (msg.sender_id === user.id) return;

                const preview = msg.message
                    || (msg.media_types?.[0] === 'image' ? '📷 Photo' : '🎥 Video');

                // Always write last_message to DB so modal re-opens load correctly
                supabase.from('conversations')
                    .update({ last_message: preview, last_message_at: msg.created_at })
                    .eq('id', msg.conversation_id);

                if (activeConvRef.current?.id === msg.conversation_id) {
                    // User is in this conversation — append message, mark read, no badge
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                    supabase.from('messages').update({ is_read: true }).eq('id', msg.id);
                    setConversations(prev => prev.map(c =>
                        c.id === msg.conversation_id
                            ? { ...c, last_message: preview, last_message_at: msg.created_at }
                            : c
                    ));
                } else {
                    // User is not in this conversation — show badge + update preview
                    setUnreadCount(prev => prev + 1);
                    setConversations(prev => prev.map(c =>
                        c.id === msg.conversation_id
                            ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: preview, last_message_at: msg.created_at }
                            : c
                    ));
                }
            })
            .subscribe();

        // No cleanup that resets _initialized — the subscription should live
        // for the entire user session. It will be removed when the user logs out
        // and the component fully unmounts (page unload / auth change).
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            // Reset module flag only when user changes (logout/login)
            _initialized = false;
        };
    }, [user, supabase, loadConversations]);

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
        fetchUnreadCount: async () => unreadCount,
        getDirectUnreadCount: async () => unreadCount,
    };

    return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};