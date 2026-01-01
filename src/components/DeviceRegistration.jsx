// src/components/DeviceRegistration.jsx - UPDATED WITH onComplete PROP
import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';

export default function DeviceRegistration({ onComplete }) {
    const { user, supabase } = useSupabase();
    const [status, setStatus] = useState('initializing');
    const [showPrompt, setShowPrompt] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    // Mark as completed and notify parent
    const markAsCompleted = useCallback(() => {
        console.log('DeviceRegistration marking as completed');
        setHasChecked(true);
        if (onComplete) {
            console.log('Calling onComplete callback');
            onComplete();
        }
    }, [onComplete]);

    useEffect(() => {
        if (!user || hasChecked) return;

        const checkAndRegisterDevice = async () => {
            try {
                console.log('=== DEVICE REGISTRATION START ===');
                setStatus('checking');

                // Wait for OneSignal
                let retries = 0;
                const maxRetries = 5;

                while (!window.OneSignal && retries < maxRetries) {
                    console.log('Waiting for OneSignal...', retries);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    retries++;
                }

                if (!window.OneSignal) {
                    console.error('OneSignal not available after retries');
                    setStatus('onesignal-not-loaded');
                    markAsCompleted();
                    return;
                }

                console.log('OneSignal is ready');

                // Get current player ID from OneSignal
                const playerId = await window.OneSignal.User.PushSubscription.id;
                const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;

                console.log('Current subscription status:', {
                    isSubscribed,
                    playerId: playerId ? `${playerId.substring(0, 10)}...` : 'none'
                });

                // Check if already registered in database
                const { data: company } = await supabase
                    .from('companies')
                    .select('onesignal_player_id')
                    .eq('id', user.id)
                    .single();

                const hasPlayerIdInDb = company?.onesignal_player_id;

                console.log('Database check:', {
                    hasPlayerIdInDb,
                    playerIdMatches: hasPlayerIdInDb === playerId
                });

                // SCENARIO 1: Already subscribed and player ID matches database
                if (isSubscribed && playerId && playerId === hasPlayerIdInDb) {
                    console.log('✅ Device already registered and subscribed');
                    setStatus('already-registered');
                    setShowPrompt(true); // Show briefly to confirm
                    setTimeout(() => {
                        setShowPrompt(false);
                        markAsCompleted();
                    }, 1500);
                    return;
                }

                // SCENARIO 2: Subscribed but player ID not in database
                if (isSubscribed && playerId && playerId !== hasPlayerIdInDb) {
                    console.log('Subscribed but player ID not in database. Updating...');
                    await storePlayerId(user.id, playerId);
                    setStatus('updated-database');
                    setShowPrompt(true);
                    setTimeout(() => {
                        setShowPrompt(false);
                        markAsCompleted();
                    }, 1500);
                    return;
                }

                // SCENARIO 3: Player ID in database but not currently subscribed
                if (hasPlayerIdInDb && !isSubscribed) {
                    console.log('Player ID in database but not subscribed. Checking browser permission...');

                    // Check browser notification permission
                    if (Notification.permission === 'granted') {
                        // Browser says granted but OneSignal says not subscribed
                        console.log('Browser permission granted but OneSignal not subscribed.');
                        setShowPrompt(true);
                        setStatus('needs-resubscribe');
                    } else if (Notification.permission === 'denied') {
                        console.log('Browser notifications denied');
                        setStatus('browser-denied');
                        setShowPrompt(true);
                        return;
                    } else {
                        // Default or prompt state
                        console.log('Browser permission:', Notification.permission);
                        setShowPrompt(true);
                        setStatus('requesting');
                    }
                }

                // SCENARIO 4: Not subscribed and no player ID
                if (!isSubscribed && !hasPlayerIdInDb) {
                    console.log('Not subscribed and no player ID in database');

                    // Check browser permission first
                    if (Notification.permission === 'granted') {
                        console.log('Browser permission already granted, requesting OneSignal subscription...');
                        setShowPrompt(true);
                        setStatus('requesting');
                    } else if (Notification.permission === 'denied') {
                        console.log('Browser notifications denied');
                        setStatus('browser-denied');
                        setShowPrompt(true);
                        return;
                    } else {
                        // Show prompt to request permission
                        console.log('Need to request browser permission');
                        setShowPrompt(true);
                        setStatus('requesting');
                    }
                }

            } catch (error) {
                console.error('Device registration error:', error);
                setStatus('error');
                setShowPrompt(true);
            }
        };

        // Start check with a small delay to ensure OneSignal is loaded
        setTimeout(checkAndRegisterDevice, 1000);
    }, [user, supabase, hasChecked, markAsCompleted]);

    const storePlayerId = async (userId, playerId) => {
        try {
            console.log('Storing player ID:', playerId);

            // Store in company_devices table
            const { error: deviceError } = await supabase
                .from('company_devices')
                .upsert({
                    company_id: userId,
                    player_id: playerId,
                    device_type: 'web',
                    device_name: navigator.userAgent.substring(0, 100),
                    is_active: true,
                    last_active: new Date().toISOString()
                }, {
                    onConflict: 'player_id'
                });

            if (deviceError) {
                console.warn('Could not save to company_devices:', deviceError);
            }

            // Also update companies table for backward compatibility
            const { error: companyError } = await supabase
                .from('companies')
                .update({ onesignal_player_id: playerId })
                .eq('id', userId);

            if (companyError) {
                console.warn('Could not update companies table:', companyError);
            }

            console.log('✅ Player ID stored successfully');
            return true;
        } catch (error) {
            console.error('Error storing player ID:', error);
            return false;
        }
    };

    // Handle request permission
    const handleRequestPermission = async () => {
        try {
            console.log('Requesting notification permission...');
            const permission = await window.OneSignal.Notifications.requestPermission();
            console.log('Permission result:', permission);

            if (permission === 'granted') {
                // Get the new player ID
                const newPlayerId = await window.OneSignal.User.PushSubscription.id;

                if (newPlayerId) {
                    console.log('New player ID obtained:', newPlayerId);
                    await storePlayerId(user.id, newPlayerId);
                    setStatus('registered');

                    // Hide after success
                    setTimeout(() => {
                        setShowPrompt(false);
                        markAsCompleted();
                    }, 1500);
                } else {
                    setStatus('no-player-id');
                }
            } else {
                setStatus('denied');
                // User can close manually
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');
        }
    };

    // Handle close button click
    const handleClose = () => {
        console.log('User closed device registration');
        setShowPrompt(false);
        markAsCompleted();
    };

    // Status messages
    const statusMessages = {
        'initializing': 'Checking notification status...',
        'checking': 'Checking notification status...',
        'requesting': 'Please allow notifications to get job alerts...',
        'needs-resubscribe': 'Updating notification subscription...',
        'registered': '✅ Notifications enabled! You will now receive job alerts.',
        'updated-database': '✅ Notification settings updated.',
        'already-registered': '✅ Notifications already enabled',
        'denied': '❌ Notifications were blocked.',
        'browser-denied': '❌ Browser notifications are blocked. Please enable them in browser settings.',
        'no-player-id': 'Could not get device ID. Please refresh the page.',
        'onesignal-not-loaded': 'OneSignal not loaded. Please refresh.',
        'error': 'An error occurred. Please refresh the page.'
    };

    return (
        <>
            {/* Permission Prompt Modal */}
            {showPrompt && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">🔔</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {status === 'already-registered' ? 'Notifications Active' :
                                    status === 'registered' || status === 'updated-database' ? 'Notifications Enabled!' :
                                        'Enable Job Notifications'}
                            </h3>
                            <p className="text-gray-600">
                                {status === 'already-registered' ?
                                    'You are already set up to receive job notifications.' :
                                    status === 'registered' || status === 'updated-database' ?
                                        'You will now receive instant alerts when customers send you jobs!' :
                                        'Get instant alerts when customers send you jobs. Never miss an opportunity!'
                                }
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Status display */}
                            <div className={`p-3 rounded-lg text-center ${status === 'requesting' || status === 'needs-resubscribe' ? 'bg-blue-50 text-blue-800' :
                                status === 'registered' || status === 'updated-database' || status === 'already-registered' ? 'bg-green-50 text-green-800' :
                                    status === 'denied' || status === 'browser-denied' ? 'bg-yellow-50 text-yellow-800' :
                                        'bg-gray-50 text-gray-800'
                                }`}>
                                {statusMessages[status]}
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                {status === 'requesting' || status === 'needs-resubscribe' ? (
                                    <>
                                        <button
                                            onClick={handleClose}
                                            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                                        >
                                            Skip for Now
                                        </button>
                                        <button
                                            onClick={handleRequestPermission}
                                            className="flex-1 bg-naijaGreen text-white py-3 rounded-lg font-medium hover:bg-darkGreen transition"
                                        >
                                            Allow Notifications
                                        </button>
                                    </>
                                ) : status === 'registered' || status === 'updated-database' || status === 'already-registered' ? (
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition"
                                    >
                                        Got It!
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleClose}
                                            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                                        >
                                            Close
                                        </button>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition"
                                        >
                                            Try Again
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Help text */}
                            {status === 'denied' && (
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    To enable later: Click the lock icon in your address bar → Site settings → Notifications → Allow
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}