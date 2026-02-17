// src/components/chat/ChatInput.jsx
import React, { useState, useRef } from 'react';

export default function ChatInput({ onSendMessage, isUploading, disabled }) {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if ((!message.trim() && selectedFiles.length === 0) || disabled || isUploading) return;

        onSendMessage(message, selectedFiles);
        setMessage('');
        setSelectedFiles([]);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white border-t border-gray-200 p-4">
            {/* Selected files preview */}
            {selectedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                            {file.type.startsWith('image/') ? (
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt="Preview"
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <span className="text-2xl">🎥</span>
                                </div>
                            )}
                            <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Input form */}
            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                {/* Attachment button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="p-2 text-gray-500 hover:text-naijaGreen hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                />

                {/* Text input */}
                <div className="flex-1">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={isUploading ? 'Uploading...' : 'Type a message...'}
                        disabled={disabled || isUploading}
                        rows="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-naijaGreen resize-none disabled:bg-gray-100"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                </div>

                {/* Send button */}
                <button
                    type="submit"
                    disabled={(!message.trim() && selectedFiles.length === 0) || disabled || isUploading}
                    className="p-2 bg-naijaGreen text-white rounded-lg hover:bg-darkGreen transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    )}
                </button>
            </form>
        </div>
    );
}