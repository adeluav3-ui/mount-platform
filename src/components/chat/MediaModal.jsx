// src/components/chat/MediaModal.jsx
import React, { useEffect } from 'react';

export default function MediaModal({ isOpen, onClose, mediaUrl, mediaType }) {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition z-10"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Media content */}
            <div
                className="max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
            >
                {mediaType === 'image' ? (
                    <img
                        src={mediaUrl}
                        alt="Preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                ) : (
                    <video
                        src={mediaUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-[90vh] rounded-lg"
                    />
                )}
            </div>
        </div>
    );
}