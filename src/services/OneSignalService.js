// src/services/OneSignalService.js - SIMPLIFIED
import DeviceService from './DeviceService.js';

class OneSignalService {
    static onSubscriptionSuccess = null;
    static isInitializing = false;

    static async initialize(userId = null) {
        if (this.isInitializing) return false;

        this.isInitializing = true;

        try {
            console.log('🔔 Initializing OneSignal...');

            await this.waitForOneSignal();

            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal) {
                console.error('❌ OneSignal not available');
                return false;
            }

            // Initialize with minimal settings
            await oneSignal.init({
                appId: "0186919f-3891-40a5-81b6-c9e70634bdef",
                allowLocalhostAsSecureOrigin: true,
                autoRegister: false,
                notifyButton: { enable: false }
            });

            console.log('✅ OneSignal initialized');

            // Monitor for subscription
            this.monitorSubscription(userId);

            return true;

        } catch (error) {
            console.error('❌ OneSignal initialization error:', error);
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    static monitorSubscription(userId) {
        console.log('👀 Monitoring subscription...');

        let checkCount = 0;
        const maxChecks = 20;

        const interval = setInterval(async () => {
            checkCount++;

            try {
                const playerId = await this.getPlayerId();

                if (playerId) {
                    clearInterval(interval);
                    console.log('🎉 Subscription detected:', playerId.substring(0, 20) + '...');

                    // Register device with DeviceService
                    if (userId) {
                        await DeviceService.registerDevice(userId, playerId);
                    }

                    // Call success callback if exists
                    if (typeof this.onSubscriptionSuccess === 'function') {
                        this.onSubscriptionSuccess(playerId);
                    }
                }

                if (checkCount >= maxChecks) {
                    clearInterval(interval);
                    console.log('⏹️ Stopped monitoring');
                }

            } catch (error) {
                console.error('Monitoring error:', error);
            }
        }, 1000);
    }

    static async getPlayerId() {
        try {
            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal || !oneSignal.User || !oneSignal.User.PushSubscription) {
                return null;
            }

            return await oneSignal.User.PushSubscription.id;
        } catch (error) {
            console.error('Error getting Player ID:', error);
            return null;
        }
    }

    static async waitForOneSignal(maxWait = 10000) {
        return new Promise((resolve) => {
            const checkOneSignal = () => {
                return (window.OneSignal && typeof window.OneSignal === 'function') ||
                    (window._OneSignal && typeof window._OneSignal === 'function');
            };

            if (checkOneSignal()) {
                resolve(true);
                return;
            }

            let elapsed = 0;
            const interval = 500;
            const timer = setInterval(() => {
                elapsed += interval;

                if (checkOneSignal()) {
                    clearInterval(timer);
                    resolve(true);
                }

                if (elapsed >= maxWait) {
                    clearInterval(timer);
                    resolve(false);
                }
            }, interval);
        });
    }
}

export default OneSignalService;