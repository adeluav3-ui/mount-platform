// src/services/OneSignalService.js - FIXED VERSION
class OneSignalService {
    static isInitialized = false;
    static initializationPromise = null;

    static async initialize(userId = null) {
        // If already initialized, return
        if (this.isInitialized) {
            console.log('✅ OneSignal already initialized');
            return true;
        }

        // If initializing, wait for promise
        if (this.initializationPromise) {
            return await this.initializationPromise;
        }

        this.initializationPromise = this._initialize(userId);
        return await this.initializationPromise;
    }

    static async _initialize(userId = null) {
        try {
            console.log('🔔 Initializing OneSignal...');

            // Check if OneSignal is already initialized globally
            if (window.OneSignalDeferred && window.OneSignalDeferred.length > 0) {
                console.log('⚠️ OneSignalDeferred detected - SDK will initialize automatically');
                this.isInitialized = true;
                return true;
            }

            // Wait for SDK to load
            const sdkLoaded = await this.waitForOneSignal();
            if (!sdkLoaded) {
                console.error('❌ OneSignal SDK failed to load');
                return false;
            }

            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal) {
                console.error('❌ OneSignal not available');
                return false;
            }

            // Check if already initialized
            if (oneSignal.initialized) {
                console.log('✅ OneSignal already initialized by index.html');
                this.isInitialized = true;
                return true;
            }

            // Initialize with minimal settings
            await oneSignal.init({
                appId: "0186919f-3891-40a5-81b6-c9e70634bdef",
                allowLocalhostAsSecureOrigin: true,
                autoRegister: false,
                notifyButton: { enable: false },
                serviceWorkerParam: { scope: '/' }
            });

            console.log('✅ OneSignal initialized');
            this.isInitialized = true;

            // Start monitoring subscription
            this.monitorSubscription(userId);

            return true;

        } catch (error) {
            console.error('❌ OneSignal initialization error:', error);

            // If error is "already initialized", mark as initialized
            if (error.message.includes('already initialized') ||
                error.message.includes('SDK already initialized')) {
                this.isInitialized = true;
                return true;
            }

            return false;
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

                    // Save device
                    await this.saveDevice(userId, playerId);
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

    static async saveDevice(userId, playerId) {
        try {
            if (!userId) return;

            console.log('💾 Saving device for user:', userId);

            const { supabase } = await import('../context/SupabaseContext.jsx');

            // Check if this device already exists
            const { data: existingDevice } = await supabase
                .from('company_devices')
                .select('id, is_primary')
                .eq('player_id', playerId)
                .maybeSingle();

            if (existingDevice) {
                // Update existing
                await supabase
                    .from('company_devices')
                    .update({
                        last_active: new Date().toISOString(),
                        is_active: true
                    })
                    .eq('player_id', playerId);
                console.log('✅ Existing device updated');
                return;
            }

            // Check if company has any devices
            const { data: companyDevices } = await supabase
                .from('company_devices')
                .select('id')
                .eq('company_id', userId)
                .eq('is_active', true);

            const isFirstDevice = !companyDevices || companyDevices.length === 0;

            // Save new device
            const deviceData = {
                company_id: userId,
                player_id: playerId,
                device_type: this.getDeviceType(),
                device_name: this.generateDeviceName(),
                is_primary: isFirstDevice,
                is_active: true,
                last_active: new Date().toISOString()
            };

            const { error } = await supabase
                .from('company_devices')
                .upsert(deviceData, { onConflict: 'player_id' });

            if (error) throw error;

            console.log(`✅ Device saved (${isFirstDevice ? 'Primary' : 'Additional'})`);

            // If first device, update companies table
            if (isFirstDevice) {
                await supabase
                    .from('companies')
                    .update({ onesignal_player_id: playerId })
                    .eq('id', userId);
            }

        } catch (error) {
            console.error('❌ Error saving device:', error);
        }
    }

    static async getPlayerId() {
        try {
            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal || !oneSignal.User || !oneSignal.User.PushSubscription) {
                return null;
            }

            const ps = oneSignal.User.PushSubscription;

            // Try different possible property names (minified and unminified)
            if (ps.q && typeof ps.q === 'string') {
                // Minified version (what we found)
                return ps.q;
            } else if (ps.id && typeof ps.id === 'string') {
                // Unminified version
                return ps.id;
            } else if (ps.getId && typeof ps.getId === 'function') {
                // Method version
                return await ps.getId();
            } else if (ps.id && typeof ps.id === 'function') {
                // Function version
                return await ps.id();
            }

            return null;
        } catch (error) {
            console.error('Error getting Player ID:', error);
            return null;
        }
    }
    static async ensureMobileSubscription(userId) {
        try {
            console.log('📱 Ensuring mobile subscription for user:', userId);

            // Wait for OneSignal to load
            await this.waitForOneSignal(10000);

            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal) {
                console.error('❌ OneSignal not available on mobile');
                return false;
            }

            // Check current permission
            const permission = await oneSignal.Notifications.permissionNative;
            console.log('📱 Mobile permission:', permission);

            if (permission === 'default') {
                console.log('📱 Requesting permission...');

                // For mobile, we need to use registerForPushNotifications
                if (oneSignal.registerForPushNotifications) {
                    await oneSignal.registerForPushNotifications();
                    console.log('✅ Mobile push registration triggered');
                } else {
                    console.error('❌ registerForPushNotifications not available');
                    return false;
                }

                // Wait and check for Player ID
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Get Player ID
            const playerId = await this.getPlayerId();
            console.log('📱 Mobile Player ID after attempt:', playerId);

            if (playerId) {
                await this.saveDevice(userId, playerId);
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Mobile subscription error:', error);
            return false;
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

    static getDeviceType() {
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
        if (/Android/i.test(ua)) return 'android';
        return 'desktop';
    }

    static generateDeviceName() {
        const deviceType = this.getDeviceType();
        const browser = this.getBrowserName();
        return `${this.capitalizeFirst(deviceType)} ${browser}`;
    }

    static getBrowserName() {
        const ua = navigator.userAgent;
        if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
        if (/Firefox/i.test(ua)) return 'Firefox';
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
        return 'Browser';
    }

    static capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    static async triggerSubscription() {
        try {
            console.log('🔔 Triggering subscription...');

            const oneSignal = window._OneSignal || window.OneSignal;
            if (!oneSignal) {
                console.error('❌ OneSignal not available');
                return false;
            }

            // Try different methods based on OneSignal documentation
            if (oneSignal.Notifications && oneSignal.Notifications.requestPermission) {
                // Method 1: requestPermission
                const permission = await oneSignal.Notifications.requestPermission();
                console.log('Permission result:', permission);
                return permission === 'granted';
            } else if (oneSignal.registerForPushNotifications) {
                // Method 2: registerForPushNotifications
                await oneSignal.registerForPushNotifications();
                console.log('✅ Push notifications registered');
                return true;
            } else if (oneSignal.Slidedown && oneSignal.Slidedown.promptPush) {
                // Method 3: Slidedown prompt
                await oneSignal.Slidedown.promptPush();
                console.log('✅ Push prompt shown');
                return true;
            } else {
                console.error('❌ No subscription method found');
                return false;
            }
        } catch (error) {
            console.error('❌ Error triggering subscription:', error);
            return false;
        }
    }
}

export default OneSignalService;