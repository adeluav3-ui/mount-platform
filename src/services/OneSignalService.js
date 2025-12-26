// src/services/OneSignalService.js - SIMPLIFIED v16
class OneSignalService {
    static onSubscriptionSuccess = null;

    // Simple initialization
    static async initialize(userId = null) {
        try {
            console.log('🔔 OneSignalService: Waiting for SDK...');

            // Wait for OneSignal to be ready
            await this.waitForOneSignal();

            if (!window._OneSignal && !window.OneSignal) {
                console.error('❌ OneSignal not available');
                return false;
            }

            const oneSignal = window._OneSignal || window.OneSignal;

            console.log('✅ OneSignal SDK ready');

            // Get current subscription state
            const playerId = await this.getPlayerId();
            const optedIn = await oneSignal.User.PushSubscription.optedIn;

            console.log('📊 Current state:', {
                playerId,
                optedIn,
                permission: Notification.permission
            });

            // Set external user ID if we have playerId
            if (userId && playerId) {
                await this.setExternalUserId(oneSignal, userId);
            }

            // Setup subscription monitoring
            this.monitorSubscription();

            return !!playerId;

        } catch (error) {
            console.error('❌ OneSignalService error:', error);
            return false;
        }
    }

    static async waitForOneSignal(maxWait = 10000) {
        return new Promise((resolve) => {
            // Check if OneSignal is ready (either global or _OneSignal)
            const checkOneSignal = () => {
                return (window.OneSignal && window.OneSignal.User) ||
                    (window._OneSignal && window._OneSignal.User);
            };

            if (checkOneSignal()) {
                resolve(true);
                return;
            }

            let elapsed = 0;
            const interval = 200;
            const timer = setInterval(() => {
                elapsed += interval;

                if (checkOneSignal()) {
                    clearInterval(timer);
                    resolve(true);
                }

                if (elapsed >= maxWait) {
                    clearInterval(timer);
                    console.warn('⚠️ OneSignal not ready after timeout');
                    resolve(false);
                }
            }, interval);
        });
    }

    static async getPlayerId() {
        try {
            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal || !oneSignal.User) return null;

            return await oneSignal.User.PushSubscription.id;
        } catch (error) {
            console.error('Error getting player ID:', error);
            return null;
        }
    }

    static async setExternalUserId(oneSignal, userId) {
        try {
            if (typeof oneSignal.setExternalUserId === 'function') {
                await oneSignal.setExternalUserId(userId);
                console.log('✅ External ID set:', userId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error setting external ID:', error);
            return false;
        }
    }

    // Monitor subscription changes
    static monitorSubscription() {
        console.log('👀 Monitoring subscription changes...');

        let lastPlayerId = null;
        let checkCount = 0;
        const maxChecks = 30; // Check for 30 seconds

        const checkInterval = setInterval(async () => {
            checkCount++;

            const playerId = await this.getPlayerId();

            // If we got a player ID
            if (playerId && playerId !== lastPlayerId) {
                console.log('🎉 SUBSCRIPTION DETECTED! Player ID:', playerId);
                lastPlayerId = playerId;

                clearInterval(checkInterval);

                // Trigger success callback
                if (typeof this.onSubscriptionSuccess === 'function') {
                    this.onSubscriptionSuccess(playerId);
                }
            }

            // Stop checking after max attempts
            if (checkCount >= maxChecks) {
                clearInterval(checkInterval);
                console.log('⏹️ Stopped subscription monitoring');
            }
        }, 1000); // Check every second
    }
    // src/services/OneSignalService.js - Add this method
    // Replace this entire function in OneSignalService.js:
    static async syncPlayerIdToDatabase(userId) {
        try {
            if (!userId) {
                console.log('❌ No user ID provided for sync');
                return false;
            }

            // Get current Player ID
            const playerId = await this.getPlayerId();
            if (!playerId) {
                console.log('⚠️ No Player ID available yet');
                return false;
            }

            console.log('🔄 Syncing Player ID to database:', {
                userId,
                playerId
            });

            // We need to get supabase client from somewhere
            // For now, return success but log the data
            console.log('📝 Player ID to save:', {
                user_id: userId,
                onesignal_player_id: playerId,
                onesignal_updated_at: new Date().toISOString()
            });

            // IMPORTANT: This needs to be called with proper supabase client
            // We'll fix this in the next step
            console.log('✅ Player ID ready for database sync');
            return playerId; // Return the playerId for saving

        } catch (error) {
            console.error('❌ Sync error:', error);
            return false;
        }
    }


    // Manual trigger (for testing)
    static async triggerSubscription() {
        console.log('🔔 Manual subscription trigger');

        const oneSignal = window._OneSignal || window.OneSignal;
        if (!oneSignal) {
            console.error('OneSignal not available');
            return false;
        }

        // If permission is default, request it
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Permission result:', permission);

            if (permission !== 'granted') {
                return false;
            }
        }

        // Try to trigger the slidedown
        if (oneSignal.Slidedown && oneSignal.Slidedown.promptPush) {
            console.log('🔄 Triggering slidedown prompt...');
            oneSignal.Slidedown.promptPush();
            return true;
        }

        console.log('⚠️ Could not trigger subscription');
        return false;
    }
}

export default OneSignalService;