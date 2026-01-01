// src/services/NotificationService.js - FIXED VERSION
import smsService from './SMSService';
class NotificationService {
    // Get all active devices for a company
    // In NotificationService.js, update getCompanyDevices method:
    // In NotificationService.js, update getCompanyDevices:
    static async getCompanyDevices(companyId) {
        try {
            const { supabase } = await import('../context/SupabaseContext.jsx');

            // Get ALL active devices for this company
            const { data: devices, error } = await supabase
                .from('company_devices')
                .select('player_id, device_type, last_active')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('last_active', { ascending: false });

            if (error) {
                console.error('Error getting company devices:', error);
                return [];
            }

            console.log(`📱 Found ${devices?.length || 0} active devices for company ${companyId}`);

            // Filter to valid Player IDs
            const validPlayerIds = devices
                ?.filter(device => {
                    const isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(device.player_id);
                    if (!isValid) {
                        console.warn('Invalid Player ID:', device.player_id);
                    }
                    return isValid;
                })
                .map(device => device.player_id) || [];

            return validPlayerIds;

        } catch (error) {
            console.error('❌ Error getting company devices:', error);
            return [];
        }
    }

    // Main notification method
    static async notifyCompanyNewJob(company, jobData) {
        console.log('🔔 Sending notifications to company:', company.company_name);

        if (!company || !company.id) {
            return { success: false, error: 'Company not provided' };
        }

        // 1. Get all active devices for this company
        const devices = await this.getCompanyDevices(company.id);

        if (devices.length === 0) {
            console.log('⚠️ No active devices found for company');

            // Fallback to single player_id
            if (company.onesignal_player_id) {
                console.log('🔄 Falling back to single Player ID');
                const fallbackResult = await this.sendOneSignalPush(
                    company.onesignal_player_id,
                    jobData,
                    company.company_name
                );
                return {
                    success: fallbackResult.success,
                    notifications: [{ type: 'push', success: fallbackResult.success, fallback: true }],
                    company: company.company_name,
                    devices: 1
                };
            }

            return { success: false, error: 'No active devices' };
        }

        // 2. Send to all devices
        const playerIds = devices;
        console.log(`📤 Sending to ${devices.length} devices:`, devices, 'Type:', typeof devices[0]);

        const pushResult = await this.sendOneSignalPush(playerIds, jobData, company.company_name);

        // 3. Return results
        return {
            success: pushResult.success,
            notifications: [{
                type: 'push',
                success: pushResult.success,
                devices: playerIds.length,
                playerIds: playerIds,
                recipients: pushResult.recipients
            }],
            company: company.company_name,
            devices: playerIds.length
        };
    }

    // Send to multiple player IDs
    static async sendOneSignalPush(playerIds, jobData, companyName) {
        try {
            // Ensure playerIds is an array
            const idsArray = Array.isArray(playerIds) ? playerIds : [playerIds];

            console.log('🚀 Sending OneSignal push to:', idsArray.length, 'device(s)');

            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
            const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

            if (!appId || !apiKey) {
                console.error('❌ Missing OneSignal credentials');
                return { success: false, error: 'Credentials missing' };
            }

            // Filter valid UUIDs
            const validPlayerIds = idsArray.filter(id =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
            );

            if (validPlayerIds.length === 0) {
                console.error('❌ No valid Player IDs');
                return { success: false, error: 'No valid Player IDs' };
            }

            const payload = {
                app_id: appId,
                include_player_ids: validPlayerIds,
                headings: { en: `🚨 New ${jobData.category} Job!` },
                contents: { en: `${jobData.sub_service} in ${jobData.location}` },
                data: {
                    jobId: jobData.id,
                    url: `https://mountltd.com/dashboard/jobs/${jobData.id}`,
                    type: 'new_job',
                    companyName: companyName
                },
                url: `https://mountltd.com/dashboard/jobs/${jobData.id}`,
                chrome_web_icon: 'https://mountltd.com/logo.png',
                priority: 10
            };

            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            console.log('📥 OneSignal Response:', {
                status: response.status,
                recipients: result.recipients,
                invalid_ids: result.invalid_player_ids
            });

            return {
                success: response.ok,
                recipients: result.recipients || 0,
                invalidIds: result.invalid_player_ids || []
            };

        } catch (error) {
            console.error('❌ OneSignal push failed:', error);
            return { success: false, error };
        }
    }

    // Add/update a company device
    static async addCompanyDevice(companyId, playerId, deviceType = 'desktop', deviceName = 'Unknown Device') {
        try {
            // Use dynamic import
            const { supabase } = await import('../context/SupabaseContext.jsx');

            const { data, error } = await supabase
                .from('company_devices')
                .upsert({
                    company_id: companyId,
                    player_id: playerId,
                    device_type: deviceType,
                    device_name: deviceName,
                    is_active: true,
                    last_active: new Date().toISOString()
                }, {
                    onConflict: 'player_id'
                })
                .select();

            if (error) {
                console.error('❌ Error adding company device:', error);
                return false;
            }

            console.log('✅ Device saved to company_devices:', data);
            return true;

        } catch (error) {
            console.error('❌ Error in addCompanyDevice:', error);
            return false;
        }
    }
    async sendSMSNotification(companyId, message, jobId = null) {
        try {
            // Get company phone number from database
            const { data: company, error } = await this.supabase
                .from('companies')
                .select('phone, company_name')
                .eq('id', companyId)
                .single();

            if (error || !company?.phone) {
                console.error('No phone number found for company:', companyId);
                return { success: false, error: 'No phone number' };
            }

            // Send SMS via SendChamp
            const smsResult = await smsService.sendSMS(
                company.phone,
                message
            );

            // Log SMS notification
            await this.logNotification({
                user_id: companyId,
                job_id: jobId,
                title: 'SMS Alert',
                message: message,
                type: 'sms',
                sms_status: smsResult.success ? 'sent' : 'failed',
                sms_message_id: smsResult.messageId
            });

            return smsResult;
        } catch (error) {
            console.error('SMS notification error:', error);
            return { success: false, error: error.message };
        }
    }

    // Update your main sendNotification method to include SMS fallback
    async sendNotification(userId, notification, jobId = null) {
        try {
            // 1. Try push notification first
            const pushResult = await this.sendPushNotification(userId, notification);

            // 2. If push fails or after 5 minutes no response, send SMS
            if (!pushResult.success) {
                console.log('Push failed, falling back to SMS...');

                // Create SMS-friendly message
                const smsMessage = `Mount: ${notification.title} - ${notification.message}`;

                // Send SMS
                const smsResult = await this.sendSMSNotification(userId, smsMessage, jobId);

                return {
                    ...smsResult,
                    fallbackUsed: 'sms',
                    originalPushFailed: true
                };
            }

            return pushResult;
        } catch (error) {
            console.error('Notification sending error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default NotificationService;