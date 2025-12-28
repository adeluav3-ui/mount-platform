// src/components/CustomerDashboard.jsx — SIMPLIFIED VERSION (NO BADGES)
// Replace your existing imports section with this:
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import { Link } from 'react-router-dom';
import PostJob from "./post-job/PostJob";
import CustomerNotifications from "./notifications/CustomerNotifications";
import MyJobs from "./MyJobs";
import VerificationBadge from '../components/VerificationBadge';
import logo from '../assets/logo.png';
import VerificationModal from './VerificationModal';

// --- Icons (using Tailwind's recommended Heroicons) ---
const BellIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.433-2.584c-3.14-2.822-5.714-4.225-7.79-4.225s-4.65 1.403-7.79 4.225a23.848 23.848 0 0 0 5.433 2.584c2.27 1.28 4.79 1.28 7.06 0ZM12 9a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V4.75A.75.75 0 0 1 12 4Z" />
    </svg>
);

const HammerIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75V15.75A3.75 3.75 0 0 1 15.75 12H19.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H15.75A3.75 3.75 0 0 0 12 8.25V2.25" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5A1.5 1.5 0 0 1 6 9.5a1.5 1.5 0 0 1-1.5 1.5H3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 19.5a1.5 1.5 0 0 0 1.5 1.5a1.5 1.5 0 0 0 1.5-1.5h-3" />
    </svg>
);

// Payment Component (keep as is)
const Payment = ({ jobDetails, onCancel, supabase, user, setViewWithHistory }) => {
    const [processing, setProcessing] = useState(false);
    const { payJobDeposit } = useSupabase();

    const handlePayment = async () => {
        setProcessing(true);
        try {
            const result = await payJobDeposit(
                jobDetails.jobId,
                user.email,
                jobDetails.quote,
                {
                    category: jobDetails.jobDescription.split(' - ')[0],
                    sub_service: jobDetails.jobDescription.split(' - ')[1] || 'General'
                }
            );

            if (result.success) {
                alert('Payment successful! Company has been notified.');
                setViewWithHistory('notifications');
            } else {
                alert(`Payment failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred during payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Complete Payment</h2>
            {/* ... rest of Payment component ... */}
        </div>
    );
};

export default function CustomerDashboard() {
    const { user, signOut, supabase } = useSupabase();
    const [jobs, setJobs] = useState([]);
    const [jobToPay, setJobToPay] = useState(null);
    const [userName, setUserName] = useState('Customer');
    const [loadingName, setLoadingName] = useState(true);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [verificationLevel, setVerificationLevel] = useState('basic');
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [customerData, setCustomerData] = useState(null);

    const [currentView, setCurrentView] = useState('dashboard');

    const handleVerificationSubmitted = (newStatus) => {
        setVerificationLevel(newStatus);
        // You might want to refresh user data here
        console.log('Verification submitted, new status:', newStatus);
    };
    // Helper to play notification sound
    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3');
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (error) {
            console.log('Notification sound error:', error);
        }
    };

    // REAL-TIME NOTIFICATIONS (Keep this for notifications)
    useEffect(() => {
        if (!user || !supabase) return;

        console.log('🔔 Setting up real-time notifications for customer:', user.id);

        // Channel for notifications
        const notificationChannel = supabase
            .channel(`customer-all-notifications-${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('🎯 NEW NOTIFICATION RECEIVED:', {
                    type: payload.new.type,
                    title: payload.new.title,
                    read: payload.new.read
                });

                // Play sound when new notification arrives
                if (currentView !== 'notifications') {
                    playNotificationSound();
                    console.log('🔊 Played notification sound');
                }
            })
            .subscribe();

        // Channel for job updates
        const jobChannel = supabase
            .channel(`customer-job-updates-${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'jobs',
                filter: `customer_id=eq.${user.id}`
            }, (payload) => {
                console.log('📦 Job updated:', {
                    oldStatus: payload.old.status,
                    newStatus: payload.new.status,
                    jobId: payload.new.id
                });

                // Play sound for important job updates
                if (payload.new.status === 'price_set' && payload.old.status !== 'price_set') {
                    console.log('💰 New quote received!');
                    if (currentView !== 'myJobs') {
                        playNotificationSound();
                    }
                }

                if (payload.new.status === 'onsite_pending' && payload.old.status !== 'onsite_pending') {
                    console.log('📍 Onsite check requested!');
                    if (currentView !== 'myJobs') {
                        playNotificationSound();
                    }
                }

                if (payload.new.status === 'work_completed' && payload.old.status !== 'work_completed') {
                    console.log('✅ Work marked as completed!');
                    if (currentView !== 'myJobs') {
                        playNotificationSound();
                    }
                }
            })
            .subscribe();

        // ADD THIS: Channel for immediate review updates
        const reviewChannel = supabase
            .channel(`customer-review-updates-${user.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'jobs',
                filter: `customer_id=eq.${user.id}`
            }, (payload) => {
                console.log('⭐ Review update detected:', {
                    jobId: payload.new.id,
                    reviewed: payload.new.reviewed,
                    review_id: payload.new.review_id,
                    customer_rating: payload.new.customer_rating
                });

                // Force refresh jobs when review status changes
                if (payload.new.reviewed !== payload.old.reviewed) {
                    console.log('🔄 Review status changed, refreshing jobs...');
                    // Trigger a refresh by calling loadJobs from the outer scope
                    // We need to call the actual loadJobs function
                    const refreshJobs = async () => {
                        try {
                            const { data: jobsData } = await supabase
                                .from("jobs")
                                .select("*")
                                .eq("customer_id", user.id)
                                .order("created_at", { ascending: false });

                            if (jobsData) {
                                const jobsWithCompanies = await Promise.all(
                                    jobsData.map(async (job) => {
                                        if (job.company_id) {
                                            const { data: company } = await supabase
                                                .from("companies")
                                                .select("id, company_name, picture_url")
                                                .eq("id", job.company_id)
                                                .single();
                                            return { ...job, company: company };
                                        }
                                        return job;
                                    })
                                );
                                setJobs(jobsWithCompanies);
                            }
                        } catch (error) {
                            console.error('Error refreshing jobs:', error);
                        }
                    };
                    refreshJobs();
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(notificationChannel);
            supabase.removeChannel(jobChannel);
            supabase.removeChannel(reviewChannel);
            console.log('🧹 Cleaned up notification channels');
        };
    }, [user, supabase, currentView]);

    // Custom setView function
    const setViewWithHistory = (view) => {
        setCurrentView(view);
    };

    // Fetch user name AND verification data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id || !supabase) {
                console.log('No user or supabase available');
                return;
            }

            try {
                // Try to fetch from customers table first (this should have verification data)
                const { data: customer, error: customerError } = await supabase
                    .from('customers')
                    .select('customer_name, verification_level, id_verified_at, id_type, id_number, id_front_url, id_back_url, trust_score')
                    .eq('id', user.id)
                    .single();

                if (customer) {
                    setUserName(customer.customer_name || 'Customer');
                    setVerificationLevel(customer.verification_level || 'basic');
                    setCustomerData(customer);
                    setLoadingName(false);
                    return;
                }

                // Fallback to profiles table
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (profile?.full_name) {
                    setUserName(profile.full_name);
                    setLoadingName(false);
                    return;
                }

                // Fallback to user metadata
                if (user.user_metadata?.name) {
                    setUserName(user.user_metadata.name);
                    setLoadingName(false);
                    return;
                }

                // Final fallback
                const emailName = user.email?.split('@')[0] || 'Customer';
                setUserName(emailName);

            } catch (error) {
                console.error('❌ Error fetching user data:', error);
                setUserName(user.email?.split('@')[0] || 'Customer');
            } finally {
                setLoadingName(false);
            }
        };

        fetchUserData();
    }, [user, supabase]);

    // Load jobs
    useEffect(() => {
        if (!user || !supabase) return;

        const loadJobs = async () => {
            setLoadingJobs(true);
            try {
                const { data: jobsData, error: jobsError } = await supabase
                    .from("jobs")
                    .select("*")
                    .eq("customer_id", user.id)
                    .order("created_at", { ascending: false });

                if (jobsError) {
                    console.error('Failed to load jobs:', jobsError);
                    setJobs([]);
                    return;
                }

                if (!jobsData || jobsData.length === 0) {
                    setJobs([]);
                    return;
                }

                // When loading jobs, fetch company info too
                const jobsWithCompanies = await Promise.all(
                    jobsData.map(async (job) => {
                        if (job.company_id) {
                            const { data: company } = await supabase
                                .from("companies")
                                .select("id, company_name, picture_url")
                                .eq("id", job.company_id)
                                .single();

                            return { ...job, company: company };
                        }
                        return job;
                    })
                );

                setJobs(jobsWithCompanies);
            } catch (error) {
                console.error('Error loading jobs:', error);
                setJobs([]);
            } finally {
                setLoadingJobs(false);
            }
        };

        loadJobs();

        const channel = supabase
            .channel('customer-jobs')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'jobs',
                filter: `customer_id=eq.${user.id}`
            }, loadJobs)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, supabase]);

    const handleQuoteAction = async (jobId, action, notificationId = null) => {
        if (action === 'decline') {
            const { error } = await supabase
                .from('jobs')
                .update({
                    status: 'declined_by_customer',
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (error) {
                console.error('Failed to decline job:', error);
                alert('Error declining job');
                return;
            }

            alert('Job declined');
            return;
        }


        const jobToAccept = jobs.find(j => j.id === jobId);
        if (!jobToAccept) {
            alert('Job not found');
            return;
        }

        const needsReview = jobs.filter(j =>
            j.status === 'completed' &&
            !j.review_id &&
            !j.customer_rating
        ).length > 0;

        const quoteAmount = Number(jobToAccept.quoted_price);
        const upfrontAmount = quoteAmount * 0.50;
        const serviceFee = quoteAmount * 0.05;
        const paymentRequired = upfrontAmount + serviceFee;

        setJobToPay({
            jobId: jobId,
            quote: quoteAmount,
            upfront: upfrontAmount,
            serviceFee: serviceFee,
            total: paymentRequired,
            companyName: jobToAccept.company?.company_name || 'Unknown Company',
            jobDescription: `${jobToAccept.category} - ${jobToAccept.sub_service}`
        });

        setViewWithHistory('payment');
    };

    // Dashboard render function
    const renderDashboard = () => (

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10 mb-8 sm:mb-12 border-b-8 border-naijaGreen">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
                            👋 Hi there, <span className="text-naijaGreen">
                                {loadingName ? '...' : userName}!
                            </span>
                        </h3>

                        {/* Verification Badge - Clickable if basic */}
                        <div className="flex items-center gap-3">
                            <VerificationBadge
                                verificationLevel={verificationLevel}
                                size="medium"
                                onClick={() => {
                                    if (verificationLevel === 'basic') {
                                        setShowVerificationModal(true);
                                    }
                                }}
                            />
                            {verificationLevel === 'basic' && (
                                <button
                                    onClick={() => setShowVerificationModal(true)}
                                    className="text-sm text-naijaGreen hover:text-darkGreen underline font-medium"
                                >
                                    Get Verified →
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
                    Ready to find a trusted expert for your home fix?
                </p>
                <button
                    onClick={() => setViewWithHistory('postJob')}
                    className="w-full sm:w-auto bg-naijaGreen text-white px-6 sm:px-10 py-4 sm:py-5 rounded-xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-darkGreen transition shadow-lg"
                >
                    <HammerIcon className="w-5 sm:w-6 h-5 sm:h-6" />
                    I need a service!
                </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                    <h4 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-3">
                        Our Mission
                    </h4>
                    <p className="text-gray-700">
                        Mount connects you only with verified, experienced, and insured companies. We ensure peace of mind by simplifying the process of finding highly skilled artisans for every job.
                    </p>
                </div>

                {/* Pending Reviews Section - FIXED */}
                {jobs.filter(j => j.status === 'completed' && j.reviewed === false).length > 0 && (
                    <div className="mt-8 bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <h4 className="text-xl font-bold text-yellow-600 mb-3">📝 Pending Reviews</h4>
                        <p className="text-gray-700 mb-4">
                            You have {jobs.filter(j => j.status === 'completed' && j.reviewed === false).length} completed job{jobs.filter(j => j.status === 'completed' && j.reviewed === false).length !== 1 ? 's' : ''} waiting for your review.
                        </p>
                        <div className="space-y-3">
                            {jobs.filter(j => j.status === 'completed' && j.reviewed === false).slice(0, 3).map(job => (
                                <div key={job.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">{job.category} - {job.sub_service}</p>
                                        <p className="text-sm text-gray-600">Company: {job.company?.company_name || 'Unknown'}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            // Open the review page for this specific job
                                            window.open(`/review/${job.id}`, '_blank');
                                        }}
                                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                                    >
                                        Leave Review
                                    </button>
                                </div>
                            ))}
                        </div>
                        {jobs.filter(j => j.status === 'completed' && j.reviewed === false).length > 3 && (
                            <button
                                onClick={() => setViewWithHistory('myJobs')}
                                className="mt-3 text-sm text-yellow-600 hover:text-yellow-800 underline"
                            >
                                View all ({jobs.filter(j => j.status === 'completed' && j.reviewed === false).length}) jobs needing review
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    const renderMyJobs = () => (
        <MyJobs
            initialJobs={jobs}
            parentUser={user}
            parentSupabase={supabase}
        />
    );

    console.log('🔍 Jobs needing review:', {
        allJobs: jobs.length,
        completedJobs: jobs.filter(j => j.status === 'completed'),
        reviewedFalse: jobs.filter(j => j.status === 'completed' && j.reviewed === false),
        hasReviewId: jobs.filter(j => j.review_id),
        hasCustomerRating: jobs.filter(j => j.customer_rating),
        finalCount: jobs.filter(j => j.status === 'completed' && j.reviewed === false).length
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Top Navigation Bar */}
            <div className="bg-naijaGreen text-white shadow-2xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <button onClick={() => setViewWithHistory('dashboard')} className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                                src={logo}
                                alt="Mount Logo"
                                className="w-full h-full object-contain p-1"
                            />
                        </div>
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-wider">Mount</span>
                    </button>

                    <div className="flex items-center gap-3 sm:gap-6">
                        <button
                            onClick={() => {
                                setViewWithHistory('myJobs');
                            }}
                            className={`font-medium px-3 sm:px-4 py-2 rounded-full transition ${currentView === 'myJobs'
                                ? 'bg-white text-naijaGreen'
                                : 'text-white hover:bg-white/20'
                                }`}
                        >
                            <span className="sm:hidden">📋</span>
                            <span className="hidden sm:inline">My Jobs</span>
                        </button>

                        {/* Notification Bell Button - NO BADGE */}
                        <button
                            onClick={() => {
                                setViewWithHistory('notifications');
                            }}
                            className="p-2 text-white hover:text-yellow-300 transition"
                        >
                            <BellIcon className="w-6 sm:w-7 h-6 sm:h-7" />
                        </button>

                        <button
                            onClick={signOut}
                            className="bg-white text-naijaGreen font-bold px-3 sm:px-4 py-2 rounded-full hover:bg-gray-100 transition text-sm sm:text-base"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* BANNER */}
            {currentView === 'dashboard' && (
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white py-12 sm:py-20 text-center px-4">
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4">
                        Get Your Home Fixed Fast & Safe
                    </h2>
                    <p className="text-lg sm:text-2xl opacity-90">
                        Verified companies • Highly skilled artisans
                    </p>
                </div>
            )}

            {/* DYNAMIC CONTENT AREA */}
            <div className={`max-w-6xl mx-auto pb-20 sm:pb-8 ${currentView === 'dashboard' ? '-mt-8 sm:-mt-16' : 'py-4 sm:py-8'}`}>
                {currentView === 'dashboard' && renderDashboard()}

                {currentView === 'payment' && jobToPay && (
                    <div className="px-4 sm:px-6">
                        <button
                            onClick={() => setViewWithHistory('notifications')}
                            className="mb-6 flex items-center gap-2 text-naijaGreen font-bold hover:underline"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Notifications
                        </button>
                        <Payment
                            jobDetails={jobToPay}
                            onCancel={() => setViewWithHistory('notifications')}
                            supabase={supabase}
                            user={user}
                            setViewWithHistory={setViewWithHistory}
                        />
                    </div>
                )}

                {currentView === 'postJob' && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6">
                        <button onClick={() => setViewWithHistory('dashboard')} className="flex items-center gap-2 text-naijaGreen font-bold mb-4 hover:underline">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Dashboard
                        </button>
                        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10">
                            <PostJob />
                        </div>
                    </div>
                )}

                {currentView === 'myJobs' && renderMyJobs()}

                {currentView === 'notifications' && (
                    <CustomerNotifications
                        user={user}
                        supabase={supabase}
                        currentView={currentView}
                        setViewWithHistory={setViewWithHistory}
                        jobs={jobs}
                        onQuoteAction={handleQuoteAction}
                    />
                )}
            </div>

            {/* Mobile Navigation Footer - NO BADGES */}
            {currentView && (
                <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 px-4 z-40">
                    <div className="flex justify-around">
                        <button
                            onClick={() => setViewWithHistory('dashboard')}
                            className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-naijaGreen' : 'text-gray-600'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-xs">Dashboard</span>
                        </button>

                        <button
                            onClick={() => {
                                setViewWithHistory('myJobs');
                            }}
                            className={`flex flex-col items-center gap-1 ${currentView === 'myJobs' ? 'text-naijaGreen' : 'text-gray-600'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="text-xs">My Jobs</span>
                        </button>

                        <button
                            onClick={() => setViewWithHistory('postJob')}
                            className={`flex flex-col items-center gap-1 ${currentView === 'postJob' ? 'text-naijaGreen' : 'text-gray-600'}`}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-xs">Post Job</span>
                        </button>
                    </div>
                </div>
            )}
            {/* Verification Modal */}
            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onVerificationSubmitted={handleVerificationSubmitted}
            />
        </div>
    );
}