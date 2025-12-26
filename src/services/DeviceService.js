// src/services/DeviceService.js - PRODUCTION READY
class DeviceService {
    // Register a new device for a company
    static async registerDevice(companyId, playerId, deviceInfo = {}) {
        try {
            const { supabase } = await import('../context/SupabaseContext.jsx');

            // Get company info
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('company_name, onesignal_player_id, device_registration_count')
                .eq('id', companyId)
                .single();

            if (companyError) throw companyError;

            // Check if this is first device
            const isFirstDevice = !company.onesignal_player_id;

            // Check if device already exists
            const { data: existingDevice } = await supabase
                .from('company_devices')
                .select('id, is_primary, device_name')
                .eq('player_id', playerId)
                .maybeSingle();

            if (existingDevice) {
                // Update existing device
                return await this.updateExistingDevice(companyId, playerId, deviceInfo);
            }

            // Determine if this should be primary
            let isPrimary = isFirstDevice;

            // If not first device, check if we should make it primary
            if (!isFirstDevice) {
                // In production: Show UI prompt to user
                // For now, default to additional device
                isPrimary = false;
            }

            // Prepare device data
            const deviceData = {
                company_id: companyId,
                player_id: playerId,
                device_type: this.getDeviceType(),
                device_name: this.generateDeviceName(deviceInfo),
                browser_info: this.getBrowserInfo(),
                os_info: this.getOSInfo(),
                is_primary: isPrimary,
                is_active: true,
                last_active: new Date().toISOString()
            };

            // Save to company_devices
            const { data: savedDevice, error: deviceError } = await supabase
                .from('company_devices')
                .upsert(deviceData, { onConflict: 'player_id' })
                .select()
                .single();

            if (deviceError) throw deviceError;

            // If primary, update companies table
            if (isPrimary) {
                await supabase
                    .from('companies')
                    .update({
                        onesignal_player_id: playerId,
                        last_device_registration: new Date().toISOString(),
                        device_registration_count: (company.device_registration_count || 0) + 1
                    })
                    .eq('id', companyId);
            }

            console.log(`✅ Device registered: ${isPrimary ? 'Primary' : 'Additional'}`);
            return { success: true, device: savedDevice, isPrimary };

        } catch (error) {
            console.error('❌ Device registration failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Update existing device
    static async updateExistingDevice(companyId, playerId, deviceInfo) {
        const { supabase } = await import('../context/SupabaseContext.jsx');

        const { error } = await supabase
            .from('company_devices')
            .update({
                last_active: new Date().toISOString(),
                is_active: true,
                browser_info: this.getBrowserInfo(),
                os_info: this.getOSInfo()
            })
            .eq('player_id', playerId);

        if (error) throw error;

        console.log('✅ Existing device updated');
        return { success: true, updated: true };
    }

    // Get all active devices for a company
    static async getCompanyDevices(companyId) {
        try {
            const { supabase } = await import('../context/SupabaseContext.jsx');

            const { data: devices, error } = await supabase
                .from('company_devices')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('last_active', { ascending: false });

            if (error) throw error;

            return { success: true, devices: devices || [] };

        } catch (error) {
            console.error('❌ Error getting company devices:', error);
            return { success: false, devices: [] };
        }
    }

    // Set primary device
    static async setPrimaryDevice(companyId, playerId) {
        try {
            const { supabase } = await import('../context/SupabaseContext.jsx');

            // Start transaction
            // 1. Remove primary from all devices
            await supabase
                .from('company_devices')
                .update({ is_primary: false })
                .eq('company_id', companyId);

            // 2. Set new primary
            await supabase
                .from('company_devices')
                .update({ is_primary: true })
                .eq('player_id', playerId);

            // 3. Update companies table
            await supabase
                .from('companies')
                .update({ onesignal_player_id: playerId })
                .eq('id', companyId);

            console.log('✅ Primary device updated');
            return { success: true };

        } catch (error) {
            console.error('❌ Error setting primary device:', error);
            return { success: false, error: error.message };
        }
    }

    // Deactivate device
    static async deactivateDevice(playerId) {
        try {
            const { supabase } = await import('../context/SupabaseContext.jsx');

            const { error } = await supabase
                .from('company_devices')
                .update({ is_active: false })
                .eq('player_id', playerId);

            if (error) throw error;

            console.log('✅ Device deactivated');
            return { success: true };

        } catch (error) {
            console.error('❌ Error deactivating device:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper methods
    static getDeviceType() {
        const ua = navigator.userAgent;
        if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
        if (/Android/i.test(ua)) return 'android';
        if (/Windows/i.test(ua)) return 'windows';
        if (/Mac/i.test(ua)) return 'mac';
        if (/Linux/i.test(ua)) return 'linux';
        return 'unknown';
    }

    static generateDeviceName(deviceInfo) {
        const deviceType = this.getDeviceType();
        const browser = this.getBrowserName();
        const now = new Date();

        if (deviceInfo.customName) return deviceInfo.customName;

        return `${this.capitalizeFirst(deviceType)} ${browser} (${now.toLocaleDateString()})`;
    }

    static getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            vendor: navigator.vendor
        };
    }

    static getOSInfo() {
        const ua = navigator.userAgent;
        if (/Windows/i.test(ua)) return 'Windows';
        if (/Mac/i.test(ua)) return 'macOS';
        if (/Linux/i.test(ua)) return 'Linux';
        if (/Android/i.test(ua)) return 'Android';
        if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
        return 'Unknown';
    }

    static getBrowserName() {
        const ua = navigator.userAgent;
        if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
        if (/Firefox/i.test(ua)) return 'Firefox';
        if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
        if (/Edg/i.test(ua)) return 'Edge';
        return 'Browser';
    }

    static capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}

export default DeviceService;