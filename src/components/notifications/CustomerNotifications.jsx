// src/components/notifications/CustomerNotifications.jsx
import { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';

const CustomerNotifications = ({
    user,
    supabase,
    currentView,
    setViewWithHistory,
    jobs,
    onViewNotifications,
    onQuoteAction

}) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all');
    const [progress, setProgress] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 20;

    // Add this useEffect after loadNotifications useEffect:
    useEffect(() => {
        if (onViewNotifications) {
            onViewNotifications();
        }
    }, [onViewNotifications]);

    const loadNotifications = async () => {
        if (!user || !supabase) return;

        setLoading(true);
        try {
            // First, fetch notifications
            const { data: notificationsData, error: notificationsError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (notificationsError) throw notificationsError;

            if (!notificationsData || notificationsData.length === 0) {
                setNotifications([]);
                setLoading(false);
                return;
            }

            // Get all job IDs from notifications
            const jobIds = notificationsData
                .filter(n => n.job_id)
                .map(n => n.job_id);

            if (jobIds.length === 0) {
                // No job IDs, just return notifications as-is
                setNotifications(notificationsData);
                setLoading(false);
                return;
            }

            // Fetch jobs with their companies in a separate query
            // Fetch jobs with their companies in a separate query
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select(`
        id,
        category,
        sub_service,
        custom_sub_description,
        description,
        location,
        quoted_price,
        status,
        company_notes,
        companies!inner (
            company_name,
            picture_url
        )
    `)
                .in('id', jobIds);

            if (jobsError) throw jobsError;

            // Create a map of job_id -> job data for quick lookup
            const jobsMap = {};
            if (jobsData) {
                jobsData.forEach(job => {
                    jobsMap[job.id] = {
                        id: job.id,
                        title: job.description || job.custom_sub_description || job.category || 'Job',
                        category: job.category,
                        sub_service: job.sub_service,
                        description: job.description,
                        location: job.location,
                        quoted_price: job.quoted_price,
                        status: job.status,
                        company_notes: job.company_notes,
                        company: job.companies || {}
                    };
                });
            }

            // Combine notifications with job data
            const formattedNotifications = notificationsData.map(notification => ({
                ...notification,
                job: jobsMap[notification.job_id] || null
            }));

            setNotifications(formattedNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Even if there's an error, show basic notifications
            try {
                // Try to get basic notifications without job data
                const { data: basicNotifications } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(100);
                setNotifications(basicNotifications || []);
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                setNotifications([]);
            }
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return 90;
                    return prev + 10;
                });
            }, 100);

            return () => {
                clearInterval(interval);
                setProgress(0);
            };
        } else {
            setProgress(100);
            setTimeout(() => setProgress(0), 500);
        }
    }, [loading]);
    const markAllNotificationsAsRead = async () => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (error) throw error;

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const loadMoreNotifications = async () => {
        if (!hasMore || !user || !supabase) return;

        try {
            const nextPage = page + 1;
            const { data: newNotifications, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range((nextPage - 1) * PAGE_SIZE, nextPage * PAGE_SIZE - 1);

            if (error) throw error;

            if (newNotifications && newNotifications.length > 0) {
                // Get job IDs for these notifications
                const jobIds = newNotifications
                    .filter(n => n.job_id)
                    .map(n => n.job_id);

                let jobsMap = {};
                if (jobIds.length > 0) {
                    const { data: jobsData, error: jobsError } = await supabase
                        .from('jobs')
                        .select(`
        id,
        category,
        sub_service,
        custom_sub_description,
        description,      // ← USE THIS INSTEAD OF title
        location,
        quoted_price,
        status,
        company_notes,
        companies!inner (
            company_name,
            picture_url
        )
    `)
                        .in('id', jobIds);

                    if (!jobsError && jobsData) {
                        jobsData.forEach(job => {
                            jobsMap[job.id] = {
                                id: job.id,
                                title: job.description || job.custom_sub_description || job.category || 'Job', // Use description as title
                                category: job.category,
                                sub_service: job.sub_service,
                                description: job.description,
                                location: job.location,
                                quoted_price: job.quoted_price,
                                status: job.status,
                                company_notes: job.company_notes,
                                company: job.companies || {}
                            };
                        });
                    }
                }

                const formattedNotifications = newNotifications.map(notification => ({
                    ...notification,
                    job: jobsMap[notification.job_id] || null
                }));

                setNotifications(prev => [...prev, ...formattedNotifications]);
                setPage(nextPage);

                if (newNotifications.length < PAGE_SIZE) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more notifications:', error);
        }
    };
    // Load notifications and mark as read when component mounts
    useEffect(() => {
        if (currentView === 'notifications') {
            loadNotifications();
        }
    }, [currentView, user, supabase]);

    const getFilteredNotifications = () => {
        if (!notifications.length) return [];

        // Define which notification types belong to each category
        const QUOTE_TYPES = [
            'quote_received',
            'quote_submitted',
            'new_quote',
            'quote_declined',
            'quote_accepted',
            'quote_expired'
        ];

        const UPDATE_TYPES = [
            'deposit_paid',
            'work_started',
            'work_completed',
            'work_disputed',
            'work_rectified',
            'final_payment',
            'final_payment_initiated',
            'job_completed',
            'job_cancelled',
            'onsite_requested',
            'onsite_completed',
            'payment_verified'
        ];

        switch (filterType) {
            case 'quotes':
                return notifications.filter(n => QUOTE_TYPES.includes(n.type));
            case 'updates':
                return notifications.filter(n => UPDATE_TYPES.includes(n.type));
            case 'all':
            default:
                return notifications;
        }
    };

    const filteredNotifications = getFilteredNotifications();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naijaGreen"></div>
                    <p className="mt-4 text-gray-500">Loading notifications...</p>
                </div>
            </div>
        );
    }

    if (filteredNotifications.length === 0) {
        let emptyMessage = "";
        let emptyDescription = "";

        switch (filterType) {
            case 'quotes':
                emptyMessage = "No quote notifications";
                emptyDescription = "You'll see quotes here when companies send them";
                break;
            case 'updates':
                emptyMessage = "No update notifications";
                emptyDescription = "Updates will appear here for your jobs";
                break;
            default:
                emptyMessage = "No notifications yet";
                emptyDescription = "You'll see notifications here when companies send you quotes or request onsite checks.";
        }

        return (
            <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-naijaGreen/10 rounded-full mb-6">
                    <svg className="w-12 h-12 text-naijaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
                <h4 className="text-2xl font-bold text-gray-700 mb-3">{emptyMessage}</h4>
                <p className="text-gray-500 max-w-md mx-auto">{emptyDescription}</p>

                {filterType !== 'all' && notifications.length > 0 && (
                    <button
                        onClick={() => setFilterType('all')}
                        className="mt-8 bg-naijaGreen text-white px-8 py-3 rounded-xl font-bold hover:bg-darkGreen transition shadow-lg"
                    >
                        View All Notifications
                    </button>
                )}

                {filterType === 'all' && notifications.length === 0 && (
                    <button
                        onClick={() => setViewWithHistory('postJob')}
                        className="mt-8 bg-naijaGreen text-white px-8 py-3 rounded-xl font-bold hover:bg-darkGreen transition shadow-lg"
                    >
                        Post Your First Job
                    </button>
                )}
            </div>
        );
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const todaysNotifications = filteredNotifications.filter(n => {
        const date = new Date(n.created_at);
        return date.toDateString() === today.toDateString();
    });

    const yesterdaysNotifications = filteredNotifications.filter(n => {
        const date = new Date(n.created_at);
        return date.toDateString() === yesterday.toDateString();
    });

    const olderNotifications = filteredNotifications.filter(n => {
        const date = new Date(n.created_at);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        return date < twoDaysAgo;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center w-full max-w-md">
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                            className="bg-naijaGreen h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naijaGreen"></div>
                    <p className="mt-4 text-gray-500">Loading notifications...</p>
                    <p className="text-sm text-gray-400 mt-2">
                        {progress > 0 ? `Loading... ${progress}%` : 'Starting...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-0 sm:px-4">
            <div className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white p-4 sm:p-6 rounded-t-3xl sm:rounded-3xl shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl sm:text-3xl font-bold">Notifications</h3>
                        <p className="text-naijaGreen-100 mt-1 sm:mt-2">
                            {notifications.length > 0
                                ? `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
                                : 'All caught up!'}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {notifications.some(n => !n.read) && (
                            <button
                                onClick={markAllNotificationsAsRead}
                                className="flex-1 sm:flex-none bg-white text-naijaGreen font-semibold px-4 py-3 rounded-xl hover:bg-gray-50 transition shadow-lg flex items-center justify-center gap-2 min-w-[140px]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="truncate">Mark all read</span>
                            </button>
                        )}

                        <button
                            onClick={loadNotifications}
                            disabled={loading}
                            className="flex-1 sm:flex-none bg-white/20 backdrop-blur-sm text-white font-semibold px-4 py-3 rounded-xl hover:bg-white/30 transition shadow-lg flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>

                        <button
                            onClick={() => setViewWithHistory('dashboard')}
                            className="flex-1 sm:flex-none bg-darkGreen text-white font-semibold px-4 py-3 rounded-xl hover:bg-naijaGreen transition shadow-lg flex items-center justify-center gap-2 min-w-[140px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="truncate">Back to Dashboard</span>
                        </button>
                    </div>
                </div>

                <div className="mt-6 flex overflow-x-auto pb-2">
                    <div className="flex gap-2 min-w-max">
                        {[
                            { id: 'all', label: 'All', icon: '📋' },
                            { id: 'quotes', label: 'Quotes', icon: '💰' },
                            { id: 'updates', label: 'Updates', icon: '📝' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterType(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${filterType === tab.id
                                    ? 'bg-white text-naijaGreen shadow-lg'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-b-3xl sm:rounded-3xl shadow-xl -mt-2 sm:-mt-6 p-4 sm:p-6">
                <div className="space-y-6">
                    Showing {filteredNotifications.length}

                    {todaysNotifications.length > 0 && (
                        <div>
                            <h4 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-naijaGreen rounded-full"></div>
                                Today
                            </h4>
                            <div className="space-y-4">
                                {todaysNotifications.map(notif => (
                                    <NotificationItem
                                        key={notif.id}
                                        notif={notif}
                                        onQuoteAction={onQuoteAction}
                                        onMarkAsRead={markNotificationAsRead}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {yesterdaysNotifications.length > 0 && (
                        <div>
                            <h4 className="text-lg font-bold text-gray-700 mb-4">Yesterday</h4>
                            <div className="space-y-4">
                                {yesterdaysNotifications.map(notif => (
                                    <NotificationItem
                                        key={notif.id}
                                        notif={notif}
                                        onQuoteAction={onQuoteAction}
                                        onMarkAsRead={markNotificationAsRead}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {olderNotifications.length > 0 && (
                        <div>
                            <h4 className="text-lg font-bold text-gray-700 mb-4">Older</h4>
                            <div className="space-y-4">
                                {olderNotifications.map(notif => (
                                    <NotificationItem
                                        key={notif.id}
                                        notif={notif}
                                        onQuoteAction={onQuoteAction}
                                        onMarkAsRead={markNotificationAsRead}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {(todaysNotifications.length === 0 && yesterdaysNotifications.length === 0 && olderNotifications.length === 0) && (
                        <div className="space-y-4">
                            {filteredNotifications.map(notif => (
                                <NotificationItem
                                    key={notif.id}
                                    notif={notif}
                                    onQuoteAction={onQuoteAction}
                                    onMarkAsRead={markNotificationAsRead}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerNotifications;