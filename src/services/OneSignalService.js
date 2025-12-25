// src/services/OneSignalService.js - CORRECTED VERSION
class OneSignalService {
    static async initialize(userId) {
        try {
            console.log('🔔 Starting OneSignal initialization');

            // Wait for global OneSignal
            if (!window.OneSignal) {
                console.log('⏳ Waiting for OneSignal to load...');
                await new Promise(resolve => {
                    const checkInterval = setInterval(() => {
                        if (window.OneSignal) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 500);
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve();
                    }, 5000);
                });
            }

            if (!window.OneSignal) {
                console.error('❌ OneSignal not available after waiting');
                return false;
            }

            console.log('✅ OneSignal is available');

            // IMPORTANT: OneSignal methods are accessed differently
            const oneSignal = window.OneSignal;

            // Check if user is subscribed using the correct method
            const isSubscribed = await oneSignal.User.PushSubscription.id ? true : false;
            console.log('📱 Push enabled:', isSubscribed);

            // Get player ID - CORRECT WAY
            const playerId = await oneSignal.User.PushSubscription.id ||
                await oneSignal.User.PushSubscription.identifier ||
                await oneSignal.User.id;
            console.log('📱 Player ID:', playerId);

            // If not subscribed and permission is granted, try to subscribe
            if (!isSubscribed && Notification.permission === 'granted') {
                console.log('🔄 Permission granted but not subscribed, attempting subscription...');
                try {
                    // Try to subscribe using OneSignal's internal method
                    await oneSignal.login();
                    console.log('✅ Login attempted');

                    // Wait and check again
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Check new player ID
                    const newPlayerId = await oneSignal.User.PushSubscription.id;
                    console.log('📱 New Player ID after login:', newPlayerId);
                } catch (error) {
                    console.log('⚠️ Login attempt failed:', error);
                }
            }

            // Set external user ID if we have playerId
            if (userId && playerId) {
                try {
                    await oneSignal.login(userId);
                    console.log('✅ External user ID set:', userId);
                } catch (error) {
                    console.log('⚠️ Could not set external ID:', error);
                }
            }

            return playerId !== null && playerId !== undefined;

        } catch (error) {
            console.error('❌ OneSignal error:', error);
            return false;
        }
    }

    static async getPlayerId() {
        try {
            if (!window.OneSignal) return null;

            // Correct way to get player ID
            const oneSignal = window.OneSignal;
            const playerId = await oneSignal.User.PushSubscription.id ||
                await oneSignal.User.PushSubscription.identifier ||
                await oneSignal.User.id;

            return playerId;
        } catch (error) {
            console.error('Error getting player ID:', error);
            return null;
        }
    }

    // Manual subscription trigger
    static async subscribeUser() {
        try {
            if (!window.OneSignal) {
                console.error('OneSignal not available');
                return false;
            }

            console.log('🔄 Manually subscribing user...');

            // Check permission first
            if (Notification.permission !== 'granted') {
                console.log('📝 Requesting notification permission...');
                const permission = await Notification.requestPermission();
                console.log('📝 Permission result:', permission);
            }

            // Try to trigger subscription
            const oneSignal = window.OneSignal;

            // Method 1: Try login (which often triggers subscription)
            await oneSignal.login();

            // Method 2: Try to show the subscription slider if available
            if (oneSignal.Slidedown) {
                oneSignal.Slidedown.promptPush();
            }

            // Wait and check
            await new Promise(resolve => setTimeout(resolve, 3000));

            const playerId = await this.getPlayerId();
            console.log('📱 Player ID after manual subscribe:', playerId);

            return playerId !== null;
        } catch (error) {
            console.error('Subscription error:', error);
            return false;
        }
    }

    // Check subscription status
    static async checkSubscription() {
        try {
            if (!window.OneSignal) return false;

            const oneSignal = window.OneSignal;
            const playerId = await this.getPlayerId();
            const isSubscribed = !!playerId;

            return {
                subscribed: isSubscribed,
                playerId: playerId,
                permission: Notification.permission
            };
        } catch (error) {
            console.error('Check subscription error:', error);
            return { subscribed: false, playerId: null, permission: Notification.permission };
        }
    }
}

export default OneSignalService;