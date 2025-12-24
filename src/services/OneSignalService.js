// src/services/OneSignalService.js
import OneSignal from 'react-onesignal';

class OneSignalService {
    static async initialize(userId) {
        try {
            // Get from environment variable (works in Vite/React)
            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID || process.env.VITE_ONESIGNAL_APP_ID;

            console.log('🔍 OneSignal App ID from env:', appId);

            if (!appId || appId === "YOUR_ONESIGNAL_APP_ID") {
                console.error('OneSignal App ID not configured properly');
                return false;
            }

            console.log('🚀 Initializing OneSignal...');

            // Initialize OneSignal
            await OneSignal.init({
                appId: appId,
                allowLocalhostAsSecureOrigin: true,
                serviceWorkerParam: { scope: "/" },
                serviceWorkerPath: "/OneSignalSDKWorker.js"
            });

            console.log('✅ OneSignal initialized');

            // Set external user ID
            if (userId) {
                await OneSignal.setExternalUserId(userId);
                console.log('✅ Set external user ID:', userId);
            }

            // Register for push notifications
            await OneSignal.showSlidedownPrompt();

            return true;
        } catch (error) {
            console.error('❌ OneSignal initialization failed:', error);
            return false;
        }
    }

    static async getPlayerId() {
        try {
            // Use the correct OneSignal method
            const subscription = await OneSignal.User.PushSubscription.id;
            return subscription || null;
        } catch (error) {
            console.error('Error getting player ID:', error);
            return null;
        }
    }

    static async isSubscribed() {
        try {
            return await OneSignal.User.PushSubscription.optedIn;
        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    }
}

export default OneSignalService;