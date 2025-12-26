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

    // In OneSignalService.js, add these methods:

    static async initializeWithRetry(userId, maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔄 OneSignal initialization attempt ${attempt}/${maxAttempts}`);

            try {
                const success = await this.initialize(userId);

                if (success) {
                    // Check if actually subscribed
                    const playerId = await this.getPlayerId();
                    const optedIn = await this.isOptedIn();

                    if (playerId && optedIn) {
                        console.log('✅ OneSignal fully initialized and subscribed');
                        return { success: true, playerId, optedIn };
                    } else {
                        console.log('⚠️ Initialized but not subscribed');
                        await this.triggerSubscription(); // Try to subscribe
                    }
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));

            } catch (error) {
                console.error(`❌ Attempt ${attempt} failed:`, error);
            }
        }

        console.error('❌ All OneSignal initialization attempts failed');
        return { success: false, playerId: null, optedIn: false };
    }

    static async isOptedIn() {
        try {
            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal || !oneSignal.User || !oneSignal.User.PushSubscription) {
                return false;
            }

            return await oneSignal.User.PushSubscription.optedIn;
        } catch (error) {
            console.error('Error checking optedIn:', error);
            return false;
        }
    }

    static async ensureSubscription(userId) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        // Check current state
        const playerId = await this.getPlayerId();
        const optedIn = await this.isOptedIn();

        console.log('🔍 Subscription state:', {
            isMobile,
            playerId,
            optedIn,
            permission: Notification.permission
        });

        // If mobile and not subscribed, try to resubscribe
        if (isMobile && (!playerId || !optedIn)) {
            console.log('📱 Mobile not subscribed, attempting to resubscribe...');

            // iOS Safari needs special handling
            if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                return await this.handleIOSResubscription(userId);
            } else {
                // Android/other mobile
                return await this.handleMobileResubscription(userId);
            }
        }

        return { playerId, optedIn };
    }

    static async handleMobileResubscription(userId) {
        console.log('📱 Handling mobile resubscription...');

        const oneSignal = window._OneSignal || window.OneSignal;
        if (!oneSignal) {
            console.error('📱 OneSignal not available');
            return { success: false };
        }

        try {
            // Try to register for push
            if (oneSignal.registerForPushNotifications) {
                await oneSignal.registerForPushNotifications();

                // Wait and check
                await new Promise(resolve => setTimeout(resolve, 3000));

                const playerId = await this.getPlayerId();
                const optedIn = await this.isOptedIn();

                if (playerId && optedIn) {
                    console.log('✅ Mobile resubscription successful:', playerId);

                    // Save to database
                    if (userId && typeof this.onSubscriptionSuccess === 'function') {
                        this.onSubscriptionSuccess(playerId);
                    }

                    return { success: true, playerId, optedIn };
                }
            }

            // If above failed, try slidedown
            if (oneSignal.Slidedown && oneSignal.Slidedown.promptPush) {
                console.log('📱 Showing slidedown prompt...');
                oneSignal.Slidedown.promptPush();
                return { success: true, showingPrompt: true };
            }

            console.error('📱 All resubscription methods failed');
            return { success: false };

        } catch (error) {
            console.error('📱 Resubscription error:', error);
            return { success: false, error };
        }
    }

    static async handleIOSResubscription(userId) {
        console.log('📱 iOS detected - manual subscription required');

        // iOS requires user gesture, so we need to show a button
        // We'll create a persistent notification in the UI

        // Create a function to show iOS prompt
        const showIOSPrompt = () => {
            const promptDiv = document.createElement('div');
            promptDiv.id = 'ios-push-prompt';
            promptDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 24px; border-radius: 12px; max-width: 400px; text-align: center;">
                    <h3 style="margin-bottom: 16px;">🔔 Enable Notifications</h3>
                    <p style="margin-bottom: 20px; color: #666;">Get instant job alerts on your iPhone. Tap below to enable.</p>
                    <button id="ios-enable-btn" style="background: #10B981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%;">
                        Enable Push Notifications
                    </button>
                    <button id="ios-close-btn" style="margin-top: 12px; background: transparent; border: none; color: #666; cursor: pointer;">
                        Not Now
                    </button>
                </div>
            </div>
        `;

            document.body.appendChild(promptDiv);

            document.getElementById('ios-enable-btn').addEventListener('click', async () => {
                const oneSignal = window._OneSignal || window.OneSignal;
                if (oneSignal && oneSignal.registerForPushNotifications) {
                    await oneSignal.registerForPushNotifications();
                }
                document.body.removeChild(promptDiv);
            });

            document.getElementById('ios-close-btn').addEventListener('click', () => {
                document.body.removeChild(promptDiv);
            });
        };

        // Show the prompt
        showIOSPrompt();

        return { success: true, showingPrompt: true };
    }
    // Add these methods to your existing OneSignalService class:

    static async isOptedIn() {
        try {
            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal || !oneSignal.User || !oneSignal.User.PushSubscription) {
                return false;
            }

            return await oneSignal.User.PushSubscription.optedIn;
        } catch (error) {
            console.error('Error checking optedIn:', error);
            return false;
        }
    }

    static async checkSubscriptionStatus() {
        try {
            const playerId = await this.getPlayerId();
            const optedIn = await this.isOptedIn();
            const permission = Notification.permission;

            return {
                playerId,
                optedIn,
                permission,
                isSubscribed: !!(playerId && optedIn),
                isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
                isIOS: /iPhone|iPad|iPod/.test(navigator.userAgent)
            };
        } catch (error) {
            console.error('Error checking subscription status:', error);
            return {
                playerId: null,
                optedIn: false,
                permission: Notification.permission,
                isSubscribed: false,
                error: error.message
            };
        }
    }

    static async forceMobileSubscription() {
        console.log('📱 Forcing mobile subscription...');

        const status = await this.checkSubscriptionStatus();
        console.log('📱 Current status:', status);

        if (status.isSubscribed) {
            console.log('📱 Already subscribed');
            return { success: true, alreadySubscribed: true };
        }

        // If permission is default, request it
        if (status.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('📱 Permission result:', permission);

            if (permission !== 'granted') {
                return { success: false, reason: 'permission_denied' };
            }
        }

        // Try to trigger subscription
        return await this.triggerSubscription();
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