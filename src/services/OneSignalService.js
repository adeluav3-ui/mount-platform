// src/services/OneSignalService.js
import OneSignal from 'react-onesignal';

class OneSignalService {
    static async initialize(userId) {
        try {
            // Get from environment variable
            const appId = process.env.REACT_APP_ONESIGNAL_APP_ID;

            if (!appId) {
                console.error('OneSignal App ID not found in environment variables');
                return false;
            }

            console.log('Initializing OneSignal with App ID:', appId);
            await OneSignal.init({
                appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: true,
                serviceWorkerParam: { scope: "/" },
                serviceWorkerPath: "OneSignalSDKWorker.js"
            });

            // Set user ID for targeting
            await OneSignal.setExternalUserId(userId);

            // Subscribe to notifications
            await OneSignal.registerForPushNotifications();

            console.log('OneSignal initialized for user:', userId);
            return true;
        } catch (error) {
            console.error('OneSignal initialization failed:', error);
            return false;
        }
    }

    static async getPlayerId() {
        return new Promise((resolve) => {
            OneSignal.getUserId((userId) => {
                resolve(userId);
            });
        });
    }
}

export default OneSignalService;