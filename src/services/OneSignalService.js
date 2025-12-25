// src/services/OneSignalService.js - SIMPLIFIED WORKING VERSION
class OneSignalService {
    static async initialize(userId = null) {
        try {
            console.log('🔔 Starting OneSignal initialization');

            // Wait for OneSignal to be available
            await this.waitForOneSignal();

            if (!window.OneSignal) {
                console.error('❌ OneSignal not available');
                return false;
            }

            console.log('✅ OneSignal is available');

            const oneSignal = window.OneSignal;

            // DEBUG: Log OneSignal object structure
            console.log('🔍 OneSignal structure:', {
                hasUser: !!oneSignal.User,
                hasLogin: typeof oneSignal.login === 'function',
                hasRegisterForPush: typeof oneSignal.registerForPushNotifications === 'function'
            });

            // First, try to get current subscription state
            const playerId = await this.getPlayerId();
            console.log('📱 Current Player ID:', playerId);

            // If no player ID and permission is granted, try to subscribe
            if (!playerId && Notification.permission === 'granted') {
                console.log('🔄 Attempting to subscribe to push notifications...');

                // METHOD 1: Try registerForPushNotifications if available
                if (typeof oneSignal.registerForPushNotifications === 'function') {
                    try {
                        await oneSignal.registerForPushNotifications();
                        console.log('✅ registerForPushNotifications called');
                    } catch (error) {
                        console.log('⚠️ registerForPushNotifications failed:', error.message);
                    }
                }

                // METHOD 2: Wait a bit and check if subscription happened
                await new Promise(resolve => setTimeout(resolve, 2000));

                const newPlayerId = await this.getPlayerId();
                console.log('📱 Player ID after subscription attempt:', newPlayerId);

                if (newPlayerId) {
                    console.log('🎉 Successfully subscribed!');

                    // Now set external user ID if we have one
                    if (userId) {
                        await this.setExternalUserId(userId);
                    }

                    return true;
                }
            }

            // If we already have a player ID, just set external user ID
            if (playerId && userId) {
                await this.setExternalUserId(userId);
            }

            return !!playerId;

        } catch (error) {
            console.error('❌ OneSignal initialization error:', error);
            return false;
        }
    }

    static async waitForOneSignal(maxWait = 10000) {
        return new Promise((resolve) => {
            if (window.OneSignal) {
                resolve(true);
                return;
            }

            let elapsed = 0;
            const interval = 100;
            const timer = setInterval(() => {
                elapsed += interval;

                if (window.OneSignal) {
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

    static async getPlayerId() {
        try {
            if (!window.OneSignal) return null;

            const oneSignal = window.OneSignal;
            let playerId = null;

            // Try different ways to get player ID based on OneSignal SDK version
            if (oneSignal.User && oneSignal.User.PushSubscription && oneSignal.User.PushSubscription.id) {
                playerId = await oneSignal.User.PushSubscription.id;
            } else if (oneSignal.User && oneSignal.User.id) {
                playerId = await oneSignal.User.id;
            } else if (typeof oneSignal.getUserId === 'function') {
                playerId = await new Promise(resolve => oneSignal.getUserId(resolve));
            }

            return playerId;
        } catch (error) {
            console.error('Error getting player ID:', error);
            return null;
        }
    }

    static async setExternalUserId(userId) {
        try {
            if (!window.OneSignal || !userId) return false;

            const oneSignal = window.OneSignal;

            if (typeof oneSignal.setExternalUserId === 'function') {
                await oneSignal.setExternalUserId(userId);
                console.log('✅ External user ID set:', userId);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error setting external user ID:', error);
            return false;
        }
    }

    // Manual trigger for subscription
    static async triggerSubscription() {
        console.log('🔔 Manually triggering subscription...');

        // Check permission first
        if (Notification.permission === 'default') {
            console.log('📝 Requesting notification permission...');
            const permission = await Notification.requestPermission();
            console.log('📝 Permission result:', permission);

            if (permission !== 'granted') {
                console.log('❌ Permission not granted');
                return false;
            }
        }

        // Wait for OneSignal
        await this.waitForOneSignal();

        if (!window.OneSignal) {
            console.error('❌ OneSignal not available');
            return false;
        }

        const oneSignal = window.OneSignal;

        // Try to trigger subscription slidedown
        if (oneSignal.Slidedown && typeof oneSignal.Slidedown.promptPush === 'function') {
            console.log('🔄 Showing subscription prompt...');
            oneSignal.Slidedown.promptPush();
            return true;
        }

        console.log('⚠️ No subscription prompt method available');
        return false;
    }
}

export default OneSignalService;