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

            const playerId = await oneSignal.User.PushSubscription.id;
            return playerId || null;
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
}

export default OneSignalService;