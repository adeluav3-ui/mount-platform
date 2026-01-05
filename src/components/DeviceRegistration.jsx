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

        // Update the checkAndRegisterDevice function in DeviceRegistration.jsx:
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

                console.log('Device status:', {
                    isSubscribed,
                    playerId: playerId ? `${playerId.substring(0, 10)}...` : 'none',
                    browserPermission: Notification.permission
                });

                // SIMPLE LOGIC: Always register this device if we have a Player ID
                if (playerId) {
                    console.log('📱 Registering current device with Player ID:', playerId);
                    await storePlayerId(user.id, playerId);

                    // Check if we need to request subscription
                    if (!isSubscribed && Notification.permission !== 'denied') {
                        console.log('Device has Player ID but not subscribed. Showing prompt...');
                        setShowPrompt(true);
                        setStatus('requesting');
                    } else {
                        console.log('✅ Device already registered');
                        setStatus('already-registered');
                        setShowPrompt(true);
                        setTimeout(() => {
                            setShowPrompt(false);
                            markAsCompleted();
                        }, 1500);
                    }
                } else {
                    // No Player ID yet, need to request permission
                    console.log('No Player ID yet. Need to request permission...');

                    if (Notification.permission === 'denied') {
                        console.log('Browser notifications denied');
                        setStatus('browser-denied');
                        setShowPrompt(true);
                    } else {
                        console.log('Requesting notification permission...');
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
            console.log('📱 Storing device:', {
                userId,
                playerId,
                deviceType: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                userAgent: navigator.userAgent
            });

            // ALWAYS store in company_devices table
            const { error: deviceError } = await supabase
                .from('company_devices')
                .upsert({
                    company_id: userId,
                    player_id: playerId,
                    device_type: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    device_name: navigator.userAgent.substring(0, 100),
                    is_active: true,
                    last_active: new Date().toISOString()
                }, {
                    onConflict: 'player_id'
                });

            if (deviceError) {
                console.warn('Could not save to company_devices:', deviceError);
            } else {
                console.log('✅ Device saved to company_devices');
            }

            // Also update companies table for backward compatibility (latest device)
            const { error: companyError } = await supabase
                .from('companies')
                .update({
                    onesignal_player_id: playerId,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (companyError) {
                console.warn('Could not update companies table:', companyError);
            } else {
                console.log('✅ Updated companies table with latest device');
            }

            return true;
        } catch (error) {
            console.error('Error storing player ID:', error);
            return false;
        }
    };

    // Handle request permission
    // Update the handleRequestPermission function in DeviceRegistration.jsx:
    const handleRequestPermission = async () => {
        try {
            console.log('Requesting notification permission...');

            // First check if we already have permission
            if (Notification.permission === 'granted') {
                console.log('Already have browser permission');

                // Try to trigger OneSignal subscription
                if (window.OneSignal && window.OneSignal.registerForPushNotifications) {
                    await window.OneSignal.registerForPushNotifications();
                }

                // Get the new player ID
                const newPlayerId = await window.OneSignal.User.PushSubscription.id;
                console.log('New Player ID:', newPlayerId);

                if (newPlayerId) {
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
                return;
            }

            // Use OneSignal's permission request
            const permission = await window.OneSignal.Notifications.requestPermission();
            console.log('Permission result:', permission);

            if (permission === 'granted') {
                // Get the new player ID
                const newPlayerId = await window.OneSignal.User.PushSubscription.id;
                console.log('New Player ID:', newPlayerId);

                if (newPlayerId) {
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
            }
        } catch (error) {
            console.error('Subscription error:', error);
            setStatus('error');

            // Try fallback method
            try {
                console.log('Trying fallback permission request...');
                const fallbackPermission = await Notification.requestPermission();
                console.log('Fallback permission:', fallbackPermission);

                if (fallbackPermission === 'granted' && window.OneSignal) {
                    // Manually trigger subscription
                    window.OneSignal.registerForPushNotifications();
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
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
}