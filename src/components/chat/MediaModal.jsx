// src/components/chat/MediaModal.jsx
import React, { useEffect, useRef } from 'react';

export default function MediaModal({ isOpen, onClose, mediaUrl, mediaType }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Pause video when closing
    useEffect(() => {
        if (!isOpen && videoRef.current) videoRef.current.pause();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 60,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16,
                animation: 'fadeIn 0.15s ease',
            }}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: 16, right: 16,
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', cursor: 'pointer', fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s', zIndex: 10,
                    backdropFilter: 'blur(4px)',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
                ×
            </button>

            {/* Tap hint */}
            <p style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 12, whiteSpace: 'nowrap' }}>
                Click anywhere to close
            </p>

            {/* Media */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '90vw', maxHeight: '85vh',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'popIn 0.2s ease',
                }}
            >
                {mediaType === 'image' ? (
                    <img
                        src={mediaUrl}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 10, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'block' }}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        src={mediaUrl}
                        controls
                        autoPlay
                        style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 10, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'block' }}
                    />
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}