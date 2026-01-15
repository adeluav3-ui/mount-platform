// src/components/onboarding/VideoTutorial.jsx
import React, { useState } from 'react';

const VideoTutorial = () => {
    const [showVideo, setShowVideo] = useState(false);

    // Replace with your actual video URL
    const videoUrl = "https://www.youtube.com/embed/YOUR_VIDEO_ID";

    return (
        <>
            {/* Video Thumbnail/Trigger */}
            <div
                onClick={() => setShowVideo(true)}
                className="cursor-pointer bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold mb-2">🎬 Watch Quick Tutorial</h3>
                        <p className="text-white/90 text-sm">
                            3-minute guide to using Mount effectively
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">▶️</span>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            {showVideo && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-bold">How to Use Mount</h3>
                            <button
                                onClick={() => setShowVideo(false)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <iframe
                                    src={videoUrl}
                                    className="w-full h-full"
                                    title="Mount Platform Tutorial"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <h4 className="font-bold text-gray-800">📝 Posting a Job</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        1. Tap "I need a service"<br />
                                        2. Describe your needs<br />
                                        3. Select category
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <h4 className="font-bold text-gray-800">💰 Making Payments</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        1. Accept a quote<br />
                                        2. Pay 50% deposit<br />
                                        3. Pay balance upon completion
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VideoTutorial;