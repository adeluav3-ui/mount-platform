import { useEffect } from 'react';

const NotificationItem = ({ notif, onQuoteAction, onMarkAsRead }) => {
    const job = notif.job || {};
    const isQuote = notif.type === 'quote_submitted' || notif.type.includes('quote');
    const isOnsite = notif.type === 'onsite_requested';

    // Enhanced debug logging
    useEffect(() => {
        console.log('🔍 NOTIFICATION DEBUG:', {
            notificationId: notif.id,
            notificationTitle: notif.title,
            notificationMessage: notif.message,
            notificationType: notif.type,
            hasJobId: !!notif.job_id,
            jobId: notif.job_id,
            hasJobObject: !!notif.job,
            jobObject: notif.job,
            jobTitleFromJob: notif.job?.title,
            jobDescriptionFromJob: notif.job?.description,
            jobCategoryFromJob: notif.job?.category
        });
    }, [notif]);

    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Get display title with fallbacks
    const getDisplayTitle = () => {
        console.log('🔍 getDisplayTitle called for notification:', notif.id);

        // 1. Try notification title
        if (notif.title && notif.title !== 'undefined' && !notif.title.includes('undefined')) {
            console.log('📌 Using notification.title:', notif.title);
            return notif.title;
        }

        // 2. Try job title from job object
        if (job.title && job.title !== 'undefined') {
            console.log('📌 Using job.title:', job.title);
            return job.title;
        }

        // 3. Try job description
        if (job.description) {
            const display = job.description.length > 50
                ? job.description.substring(0, 50) + '...'
                : job.description;
            console.log('📌 Using job.description:', display);
            return display;
        }

        // 4. Try custom sub description
        if (job.custom_sub_description) {
            console.log('📌 Using job.custom_sub_description:', job.custom_sub_description);
            return job.custom_sub_description;
        }

        // 5. Try category
        if (job.category) {
            console.log('📌 Using job.category:', `${job.category} Job`);
            return `${job.category} Job`;
        }

        // 6. Extract from message
        if (notif.message) {
            const match = notif.message.match(/"([^"]+)"/);
            const extracted = match ? match[1] : 'Your Job';
            console.log('📌 Extracted from message:', extracted);
            return extracted;
        }

        console.log('⚠️ No title found, using default');
        return 'Job Notification';
    };

    const displayTitle = getDisplayTitle();

    return (
        <div
            className={`relative bg-white rounded-2xl shadow-lg border-l-4 overflow-hidden transition-all duration-300 hover:shadow-xl ${notif.read
                ? 'border-gray-300'
                : isQuote
                    ? 'border-naijaGreen'
                    : 'border-orange-500'
                } ${!notif.read ? 'ring-2 ring-naijaGreen/30' : ''}`}
        >
            {!notif.read && (
                <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-naijaGreen rounded-full animate-pulse"></div>
                </div>
            )}

            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${isQuote ? 'bg-green-100' : 'bg-orange-100'
                        }`}>
                        {isQuote ? (
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg">
                                    {displayTitle}
                                    {!notif.read && (
                                        <span className="ml-2 text-xs bg-naijaGreen text-white px-2 py-1 rounded-full">
                                            NEW
                                        </span>
                                    )}
                                </h4>
                                <p className="text-gray-600 mt-1">{notif.message}</p>

                                {(job.category || job.location || job.quoted_price) && (
                                    <div className="mt-3">
                                        <div className="flex flex-wrap gap-2">
                                            {job.category && (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                    {job.category}
                                                </span>
                                            )}
                                            {job.location && (
                                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                    {job.location}
                                                </span>
                                            )}
                                            {isQuote && job.quoted_price && (
                                                <span className="px-3 py-1 bg-naijaGreen/10 text-naijaGreen rounded-full text-sm font-bold">
                                                    ₦{Number(job.quoted_price).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {job.company_notes && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-sm font-medium text-blue-700 mb-1">Company Notes:</p>
                                        <p className="text-blue-600">{job.company_notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-right">
                                <p className="text-sm text-gray-500 whitespace-nowrap">
                                    {getTimeAgo(notif.created_at)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 hidden sm:block">
                                    {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            {isQuote && job?.status === 'price_set' && (
                                <>
                                    <button
                                        onClick={() => onQuoteAction(job.id || notif.job_id, 'accept', notif.id)}
                                        className="flex-1 bg-gradient-to-r from-naijaGreen to-darkGreen text-white font-bold py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="truncate">Accept & Pay 50%</span>
                                    </button>
                                    <button
                                        onClick={() => onQuoteAction(job.id || notif.job_id, 'decline', notif.id)}
                                        className="flex-1 border-2 border-red-500 text-red-500 font-bold py-3 px-4 rounded-xl hover:bg-red-50 transition-all duration-300 text-sm sm:text-base"
                                    >
                                        <span className="truncate">Decline Quote</span>
                                    </button>
                                </>
                            )}

                            {isOnsite && (
                                <div className="w-full">
                                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <p className="text-orange-800 font-medium mb-2">
                                            📍 Onsite Visit Requested
                                        </p>
                                        <p className="text-orange-600 text-sm">
                                            The company wants to assess your location before providing a final quote.
                                            Please contact them to schedule a visit.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {!isQuote && !isOnsite && !notif.read && (
                                <button
                                    onClick={() => onMarkAsRead(notif.id)}
                                    className="w-full sm:w-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Mark as read
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`h-1 w-full ${notif.read ? 'bg-gray-200' : isQuote ? 'bg-gradient-to-r from-naijaGreen to-darkGreen' : 'bg-orange-500'
                }`}></div>
        </div>
    );
};

export default NotificationItem;