// src/components/chat/ChatInput.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function ChatInput({ onSendMessage, disabled }) {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0); // 0–1
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }, [message]);

    // Generate previews when files change
    useEffect(() => {
        if (!selectedFiles.length) { setPreviews([]); return; }
        const urls = selectedFiles.map(f => ({ url: URL.createObjectURL(f), type: f.type, name: f.name }));
        setPreviews(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u.url));
    }, [selectedFiles]);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
        e.target.value = ''; // allow re-selecting same file
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = useCallback(async (e) => {
        e?.preventDefault();
        if ((!message.trim() && !selectedFiles.length) || disabled || isSending) return;

        const msgToSend = message;
        const filesToSend = [...selectedFiles];

        // Clear inputs immediately for snappy UX
        setMessage('');
        setSelectedFiles([]);
        setPreviews([]);
        setUploadProgress(0);
        setIsSending(true);

        try {
            await onSendMessage(msgToSend, filesToSend, (progress) => {
                setUploadProgress(progress);
            });
        } catch (err) {
            console.error('Send failed:', err);
            // Restore message on failure
            setMessage(msgToSend);
        } finally {
            setIsSending(false);
            setUploadProgress(0);
        }
    }, [message, selectedFiles, disabled, isSending, onSendMessage]);

    const canSend = (message.trim() || selectedFiles.length > 0) && !disabled;

    return (
        <div style={{ background: '#fff', borderTop: '1px solid #e5e7eb' }}>

            {/* Upload progress bar */}
            {isSending && selectedFiles.length > 0 && (
                <div style={{ height: 3, background: '#e5e7eb', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        background: 'var(--green, #1a7a4a)',
                        width: `${Math.round(uploadProgress * 100)}%`,
                        transition: 'width 0.2s ease',
                        borderRadius: '0 2px 2px 0',
                    }} />
                </div>
            )}

            {/* File previews */}
            {previews.length > 0 && (
                <div style={{ padding: '10px 14px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {previews.map((p, i) => (
                        <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                            {p.type.startsWith('image/') ? (
                                <img src={p.url} alt="preview"
                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', display: 'block' }} />
                            ) : (
                                <div style={{ width: 60, height: 60, borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                    <span style={{ fontSize: 20 }}>🎥</span>
                                    <span style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', padding: '0 4px', lineHeight: 1.2, wordBreak: 'break-all' }}>
                                        {p.name.length > 10 ? p.name.substring(0, 8) + '…' : p.name}
                                    </span>
                                </div>
                            )}
                            <button onClick={() => removeFile(i)}
                                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 12px' }}>
                {/* Attach button */}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={disabled}
                    style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s, background 0.15s' }}
                    onMouseOver={e => { if (!disabled) e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </button>

                <input type="file" ref={fileInputRef} onChange={handleFileSelect}
                    multiple accept="image/*,video/*" style={{ display: 'none' }} />

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={isSending ? 'Sending…' : 'Type a message…'}
                    disabled={disabled || isSending}
                    rows={1}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                    }}
                    style={{
                        flex: 1, resize: 'none', border: '1.5px solid #e5e7eb', borderRadius: 20,
                        padding: '8px 14px', fontSize: 14, lineHeight: '20px', outline: 'none',
                        background: disabled || isSending ? '#f9fafb' : '#fff',
                        color: '#111827', fontFamily: 'inherit', maxHeight: 120,
                        overflowY: 'auto', transition: 'border-color 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#1a7a4a'; }}
                    onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
                />

                {/* Send button */}
                <button type="button" onClick={handleSubmit} disabled={!canSend}
                    style={{
                        flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: canSend ? '#1a7a4a' : '#e5e7eb',
                        color: canSend ? '#fff' : '#9ca3af',
                        cursor: canSend ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s, transform 0.1s',
                        transform: canSend ? 'scale(1)' : 'scale(0.95)',
                    }}>
                    {isSending ? (
                        <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeWidth="2.5" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                </button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}