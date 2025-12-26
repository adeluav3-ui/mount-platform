// src/services/MobileDebugService.js
export class MobileDebugService {
    static async checkOneSignalSetup() {
        const results = {
            isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
            isIOS: /iPhone|iPad|iPod/i.test(navigator.userAgent),
            isAndroid: /Android/i.test(navigator.userAgent),
            isChrome: /Chrome/i.test(navigator.userAgent),
            isSafari: /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent),
            https: window.location.protocol === 'https:',
            serviceWorker: 'serviceWorker' in navigator,
            notificationPermission: Notification.permission,
            oneSignalLoaded: !!(window.OneSignal || window._OneSignal),
            userAgent: navigator.userAgent
        };

        console.log('📱 MOBILE DEBUG REPORT:');
        console.table(results);

        // Additional checks
        if (results.serviceWorker) {
            const registration = await navigator.serviceWorker.getRegistration();
            results.serviceWorkerRegistered = !!registration;
            results.serviceWorkerScope = registration?.scope;
        }

        // Check OneSignal details if loaded
        if (results.oneSignalLoaded) {
            const oneSignal = window.OneSignal || window._OneSignal;
            try {
                const playerId = await oneSignal.User.PushSubscription.id;
                results.playerId = playerId;
                const optedIn = await oneSignal.User.PushSubscription.optedIn;
                results.optedIn = optedIn;
            } catch (error) {
                results.oneSignalError = error.message;
            }
        }

        return results;
    }

    static async forceMobileSubscription() {
        console.log('📱 Attempting to force mobile subscription...');

        // First, ensure permission
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('📱 Notification permission result:', permission);

            if (permission !== 'granted') {
                console.log('📱 Permission denied. Cannot subscribe.');
                return false;
            }
        } else if (Notification.permission === 'denied') {
            console.log('📱 Permission permanently denied. User must enable in browser settings.');
            return false;
        }

        // Check if OneSignal loaded
        if (!window.OneSignal && !window._OneSignal) {
            console.error('📱 OneSignal not loaded on mobile!');

            // Try to reload OneSignal SDK
            await this.loadOneSignalSDK();

            // Wait a bit
            await new Promise(resolve => setTimeout(resolve, 3000));

            if (!window.OneSignal && !window._OneSignal) {
                console.error('📱 Still no OneSignal after reload');
                return false;
            }
        }

        const oneSignal = window.OneSignal || window._OneSignal;

        // Try to trigger subscription
        try {
            // First check current state
            const playerId = await oneSignal.User.PushSubscription.id;
            const optedIn = await oneSignal.User.PushSubscription.optedIn;

            console.log('📱 Current subscription state:', { playerId, optedIn });

            if (optedIn && playerId) {
                console.log('📱 Already subscribed with Player ID:', playerId);
                return true;
            }

            // Try to register for push
            console.log('📱 Attempting to register for push notifications...');

            // iOS Safari requires user gesture, so we use showSlidedown
            if (oneSignal.Slidedown && oneSignal.Slidedown.promptPush) {
                console.log('📱 Showing OneSignal slidedown...');
                oneSignal.Slidedown.promptPush();
            } else if (oneSignal.registerForPushNotifications) {
                console.log('📱 Calling registerForPushNotifications...');
                await oneSignal.registerForPushNotifications();
            } else if (oneSignal.showSlidedown) {
                console.log('📱 Calling showSlidedown...');
                oneSignal.showSlidedown();
            } else {
                console.error('📱 No subscription method available');
                return false;
            }

            return true;
        } catch (error) {
            console.error('📱 Subscription error:', error);
            return false;
        }
    }

    static async loadOneSignalSDK() {
        return new Promise((resolve) => {
            // Check if already loading
            if (window.OneSignalLoading) {
                console.log('📱 OneSignal SDK already loading...');
                return resolve(false);
            }

            console.log('📱 Loading OneSignal SDK...');
            window.OneSignalLoading = true;

            const script = document.createElement('script');
            script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
            script.async = true;
            script.onload = () => {
                console.log('✅ OneSignal SDK loaded');
                window.OneSignalLoading = false;
                resolve(true);
            };
            script.onerror = () => {
                console.error('❌ Failed to load OneSignal SDK');
                window.OneSignalLoading = false;
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }
}