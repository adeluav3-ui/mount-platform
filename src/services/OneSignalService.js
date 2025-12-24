// src/services/OneSignalService.js
import OneSignal from 'react-onesignal';

class OneSignalService {
    static isInitialized = false;

    static async initialize(userId) {
        // Prevent duplicate initialization
        if (this.isInitialized) {
            console.log('✅ OneSignal already initialized');
            return true;
        }

        try {
            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

            console.log('🔍 OneSignal App ID from env:', appId);

            if (!appId || appId === "YOUR_ONESIGNAL_APP_ID") {
                console.warn('OneSignal App ID not configured properly');
                return false;
            }

            console.log('🚀 Initializing OneSignal...');

            // Check if already initialized globally
            if (window.OneSignal) {
                console.log('✅ OneSignal already initialized globally');
                this.isInitialized = true;
                return true;
            }

            await OneSignal.init({
                appId: appId,
                allowLocalhostAsSecureOrigin: true,
                serviceWorkerParam: { scope: "/" },
                serviceWorkerPath: "/OneSignalSDKWorker.js"
            });

            this.isInitialized = true;
            console.log('✅ OneSignal initialized');

            // Set external user ID
            if (userId) {
                await OneSignal.setExternalUserId(userId);
                console.log('✅ Set external user ID:', userId);
            }

            // Show permission prompt if not already granted
            const permission = await OneSignal.Notifications.permission;
            if (permission === 'default') {
                await OneSignal.Notifications.requestPermission();
            }

            return true;
        } catch (error) {
            // If "already initialized" error, still count as success
            if (error.message.includes('already initialized')) {
                console.log('⚠️ OneSignal was already initialized');
                this.isInitialized = true;
                return true;
            }

            console.error('❌ OneSignal initialization failed:', error);
            return false;
        }
    }

    static async getPlayerId() {
        try {
            if (!this.isInitialized) {
                console.warn('OneSignal not initialized');
                return null;
            }

            // Get push subscription ID
            const pushSubscription = await OneSignal.User.PushSubscription;
            return pushSubscription.id || null;
        } catch (error) {
            console.error('Error getting player ID:', error);
            return null;
        }
    }
}

export default OneSignalService;