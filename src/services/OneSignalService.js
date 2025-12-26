// Replace your entire OneSignalService.js with this FIXED version:
import { MobileOneSignalFix } from './MobileOneSignalFix';

class OneSignalService {
    static onSubscriptionSuccess = null;
    static isInitializing = false;
    static initializationPromise = null;

    // Better initialization that waits for everything to be ready
    static async initialize(userId = null) {
        // Prevent multiple initializations
        if (this.isInitializing) {
            return await this.initializationPromise;
        }

        this.isInitializing = true;
        this.initializationPromise = this._initialize(userId);

        return await this.initializationPromise;
    }

    static async _initialize(userId = null) {
        try {
            console.log('🔔 OneSignalService: Starting initialization...');

            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // MOBILE FIX: Use special initialization for mobile
            if (isMobile) {
                console.log('📱 Mobile detected, using MobileOneSignalFix...');
                const initialized = await MobileOneSignalFix.initializeOneSignal();

                if (!initialized) {
                    console.error('❌ MobileOneSignalFix failed');
                    return false;
                }

                // Try to get Player ID with retry
                const playerId = await MobileOneSignalFix.getPlayerIdWithRetry();

                if (playerId) {
                    console.log('✅ Mobile Player ID obtained:', playerId);

                    // Trigger success callback
                    if (typeof this.onSubscriptionSuccess === 'function') {
                        this.onSubscriptionSuccess(playerId);
                    }

                    return true;
                }

                return false;
            }

            // DESKTOP: Use original initialization
            await this.waitForOneSignal();

            const oneSignal = window._OneSignal || window.OneSignal;

            if (!oneSignal) {
                console.error('❌ OneSignal not available after wait');
                return false;
            }

            console.log('✅ OneSignal SDK ready');

            // Wait for User object to be available
            await this.waitForOneSignalUser(oneSignal);

            // Get current state
            const playerId = await this.getPlayerId();
            const optedIn = await this.isOptedIn();

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
            console.error('❌ OneSignalService initialization error:', error);
            return false;
        } finally {
            this.isInitializing = false;
        }
    }

    // Wait for OneSignal SDK to load
    static async waitForOneSignal(maxWait = 15000) {
        return new Promise((resolve) => {
            // Check if OneSignal is ready (either global or _OneSignal)
            const checkOneSignal = () => {
                return (window.OneSignal && typeof window.OneSignal === 'function') ||
                    (window._OneSignal && typeof window._OneSignal === 'function');
            };

            if (checkOneSignal()) {
                console.log('✅ OneSignal SDK already loaded');
                resolve(true);
                return;
            }

            let elapsed = 0;
            const interval = 500;
            const timer = setInterval(() => {
                elapsed += interval;

                if (checkOneSignal()) {
                    clearInterval(timer);
                    console.log('✅ OneSignal SDK loaded after', elapsed, 'ms');
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

    // Wait for OneSignal User object to be available
    static async waitForOneSignalUser(oneSignal, maxWait = 10000) {
        return new Promise((resolve, reject) => {
            let elapsed = 0;
            const interval = 500;
            const timer = setInterval(() => {
                elapsed += interval;

                if (oneSignal.User && oneSignal.User.PushSubscription) {
                    clearInterval(timer);
                    console.log('✅ OneSignal User object ready after', elapsed, 'ms');
                    resolve(true);
                }

                if (elapsed >= maxWait) {
                    clearInterval(timer);
                    console.error('❌ OneSignal User object not ready after timeout');
                    reject(new Error('OneSignal User object timeout'));
                }
            }, interval);
        });
    }

    static async getPlayerId() {
        try {
            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal || !oneSignal.User || !oneSignal.User.PushSubscription) {
                console.log('⚠️ OneSignal User.PushSubscription not ready');
                return null;
            }

            return await oneSignal.User.PushSubscription.id;
        } catch (error) {
            console.error('Error getting player ID:', error);
            return null;
        }
    }

    static async isOptedIn() {
        try {
            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal || !oneSignal.User || !oneSignal.User.PushSubscription) {
                console.log('⚠️ OneSignal User.PushSubscription not ready for optedIn check');
                return false;
            }

            return await oneSignal.User.PushSubscription.optedIn;
        } catch (error) {
            console.error('Error checking optedIn:', error);
            return false;
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

            try {
                const playerId = await this.getPlayerId();

                // If we got a player ID
                // If we got a player ID
                if (playerId && playerId !== lastPlayerId) {
                    console.log('🎉 SUBSCRIPTION DETECTED! Player ID:', playerId);
                    lastPlayerId = playerId;

                    clearInterval(checkInterval);

                    // CRITICAL: Save device to database if it's a company user
                    try {
                        // Get current user from your auth system
                        const currentUser = JSON.parse(
                            localStorage.getItem('sb-zaupoobfkajpdaqglqwh-auth-token') || // Supabase default key
                            localStorage.getItem('supabase.auth.token') ||
                            sessionStorage.getItem('currentUser') ||
                            '{}'
                        );

                        if (currentUser && (currentUser.user?.id || currentUser.userId)) {
                            const userId = currentUser.user?.id || currentUser.userId;
                            console.log(`👤 Found user ID for device saving: ${userId}`);

                            // Check if this is a company user (simplified check)
                            // You might need to adjust this based on your user type detection
                            const isCompanyUser = currentUser.user?.email?.includes('@company.') || // Adjust domain
                                currentUser.user?.user_metadata?.user_type === 'company' ||
                                currentUser.user?.app_metadata?.user_type === 'company';

                            if (isCompanyUser) {
                                console.log('🏢 Company user detected, saving device...');
                                await this.saveCompanyDevice(userId, playerId);
                            } else {
                                console.log('👤 Customer user, not saving to company_devices');
                            }
                        } else {
                            console.log('⚠️ No user ID found for device saving');
                        }
                    } catch (error) {
                        console.error('❌ Error during device saving:', error);
                    }

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
            } catch (error) {
                console.error('Subscription monitoring error:', error);
            }
        }, 1000); // Check every second
    }

    static async ensureSubscription(userId) {
        try {
            console.log('🔍 Ensuring subscription for user:', userId);

            // Wait for OneSignal to be fully ready
            await this.waitForOneSignalUser(window._OneSignal || window.OneSignal);

            // Check current state
            const playerId = await this.getPlayerId();
            const optedIn = await this.isOptedIn();

            console.log('Current subscription state:', { playerId, optedIn });

            // If already subscribed, return success
            if (playerId && optedIn) {
                console.log('✅ Already subscribed');
                return { success: true, playerId, alreadySubscribed: true };
            }

            // If not subscribed, try to trigger subscription
            console.log('Not subscribed, attempting to subscribe...');
            const success = await this.triggerSubscription();

            if (success) {
                // Wait a bit and check again
                await new Promise(resolve => setTimeout(resolve, 3000));

                const newPlayerId = await this.getPlayerId();
                const newOptedIn = await this.isOptedIn();

                return {
                    success: newPlayerId && newOptedIn,
                    playerId: newPlayerId,
                    optedIn: newOptedIn
                };
            }

            return { success: false, error: 'Failed to trigger subscription' };

        } catch (error) {
            console.error('ensureSubscription error:', error);
            return { success: false, error: error.message };
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

        // Ensure User object is ready
        await this.waitForOneSignalUser(oneSignal);

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

        // Try direct registration
        if (oneSignal.registerForPushNotifications) {
            console.log('🔄 Calling registerForPushNotifications...');
            await oneSignal.registerForPushNotifications();
            return true;
        }

        console.log('⚠️ Could not trigger subscription');
        return false;
    }

    // New method: Check subscription status
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

    // New method: Force mobile subscription
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
    // Add this NEW method to save company devices
    static async saveCompanyDevice(userId, playerId) {
        try {
            console.log('💾 Saving company device to database:', {
                userId,
                playerId,
                isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
            });

            // Determine device type
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const deviceType = isMobile ? 'mobile' : 'desktop';
            const deviceName = isMobile ? 'Mobile Device' : 'Desktop Device';

            // Import NotificationService to use addCompanyDevice
            const NotificationService = await import('./NotificationService.js');

            // Save to company_devices table
            const success = await NotificationService.default.addCompanyDevice(
                userId,
                playerId,
                deviceType,
                deviceName
            );

            if (success) {
                console.log('✅ Device saved to company_devices table');
            } else {
                console.error('❌ Failed to save device');
            }

            return success;
        } catch (error) {
            console.error('❌ Error saving company device:', error);
            return false;
        }
    }
}

export default OneSignalService;