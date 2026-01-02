// src/components/company/TelegramSetupGuide.jsx
import React from 'react';

const TelegramSetupGuide = ({ companyName }) => {
    return (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                </div>
                <h3 className="text-lg font-bold text-blue-800">
                    Get Instant Job Alerts on Telegram
                </h3>
            </div>

            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        1
                    </div>
                    <div>
                        <p className="font-medium">Open Telegram and search for</p>
                        <a
                            href="https://t.me/MountJobsBot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-bold hover:underline"
                        >
                            @MountJobsBot
                        </a>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        2
                    </div>
                    <div>
                        <p className="font-medium">Send this command to link your account:</p>
                        <code className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-mono">
                            /link YOUR_EMAIL_HERE
                        </code>
                        <p className="text-sm text-gray-600 mt-1">
                            Replace with your company email: {companyName}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                        3
                    </div>
                    <div>
                        <p className="font-medium">You'll receive:</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 ml-2">
                            <li>Instant job notifications</li>
                            <li>Accept/decline buttons in chat</li>
                            <li>Reminders for pending jobs</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-blue-200">
                <a
                    href="https://t.me/MountJobsBot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    <span>Open @MountJobsBot Now</span>
                    <span>→</span>
                </a>
            </div>
        </div>
    );
};

export default TelegramSetupGuide;