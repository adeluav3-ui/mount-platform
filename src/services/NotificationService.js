// src/services/NotificationService.js - COMPLETE VERSION WITH SMS
import smsService from './SMSService';

class NotificationService {
    constructor() {
        // We'll use dynamic imports for Supabase context
    }

    // Get all active devices for a company
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

    // Get company phone number
    static async getCompanyPhone(companyId) {
        try {
            const { supabase } = await import('../context/SupabaseContext.jsx');

            const { data: company, error } = await supabase
                .from('companies')
                .select('phone, company_name')
                .eq('id', companyId)
                .single();

            if (error) {
                console.error('❌ Error getting company phone:', error);
                return null;
            }

            return company;
        } catch (error) {
            console.error('❌ Error in getCompanyPhone:', error);
            return null;
        }
    }

    // Main notification method with SMS fallback
    static async notifyCompanyNewJob(company, jobData) {
        console.log('🔔 Sending notifications to company:', company.company_name);

        if (!company || !company.id) {
            return { success: false, error: 'Company not provided' };
        }

        const results = {
            push: null,
            sms: null,
            success: false
        };

        // 1. Get all active devices for this company
        const devices = await this.getCompanyDevices(company.id);

        // 2. Send push notifications if devices exist
        if (devices.length > 0) {
            console.log(`📤 Sending push to ${devices.length} devices`);
            results.push = await this.sendOneSignalPush(devices, jobData, company.company_name);
        } else {
            console.log('⚠️ No active devices found for push notifications');
        }

        // 3. Always send SMS as backup (even if push succeeds)
        console.log('📱 Sending SMS backup notification');
        results.sms = await this.sendJobSMSNotification(company.id, jobData);

        // 4. Determine overall success
        results.success = results.push?.success || results.sms?.success;

        // 5. Log all notifications to database
        await this.logNotification({
            user_id: company.id,
            job_id: jobData.id,
            title: `New ${jobData.category} Job`,
            message: `${jobData.sub_service} in ${jobData.location}`,
            type: 'new_job',
            push_success: results.push?.success || false,
            sms_success: results.sms?.success || false,
            devices_count: devices.length
        });

        return {
            success: results.success,
            notifications: {
                push: results.push,
                sms: results.sms
            },
            company: company.company_name,
            devices_count: devices.length
        };
    }

    // Send SMS for job notifications
    static async sendJobSMSNotification(companyId, jobData) {
        try {
            // Get company phone
            const company = await this.getCompanyPhone(companyId);

            if (!company?.phone) {
                console.log('📵 No phone number found for company');
                return { success: false, error: 'No phone number' };
            }

            // Create SMS message
            const smsMessage = `Mount: New ${jobData.category} job! ${jobData.sub_service} in ${jobData.location}. Price: ₦${jobData.budget}. Reply YES to accept.`;

            // Send SMS
            const smsResult = await smsService.sendSMS(
                company.phone,
                smsMessage
            );

            console.log('📲 SMS sent result:', {
                success: smsResult.success,
                to: company.phone,
                company: company.company_name
            });

            // Log SMS specifically
            await this.logNotification({
                user_id: companyId,
                job_id: jobData.id,
                title: 'SMS Job Alert',
                message: smsMessage,
                type: 'sms',
                sms_status: smsResult.success ? 'sent' : 'failed',
                sms_message_id: smsResult.messageId
            });

            return {
                ...smsResult,
                phone: company.phone,
                companyName: company.company_name
            };

        } catch (error) {
            console.error('❌ SMS notification error:', error);
            return { success: false, error: error.message };
        }
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

    // Log notification to database
    static async logNotification(notificationData) {
        try {
            const { supabase } = await import('../context/SupabaseContext.jsx');

            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: notificationData.user_id,
                    job_id: notificationData.job_id,
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type,
                    sms_status: notificationData.sms_status,
                    sms_message_id: notificationData.sms_message_id,
                    push_success: notificationData.push_success,
                    sms_success: notificationData.sms_success,
                    devices_count: notificationData.devices_count,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('❌ Error logging notification:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('❌ Error in logNotification:', error);
            return false;
        }
    }

    // Optional: Send urgent SMS only (for critical alerts)
    static async sendUrgentSMS(companyId, message) {
        try {
            const company = await this.getCompanyPhone(companyId);

            if (!company?.phone) {
                return { success: false, error: 'No phone number' };
            }

            const smsResult = await smsService.sendSMS(
                company.phone,
                `URGENT: ${message}`
            );

            return smsResult;
        } catch (error) {
            console.error('Urgent SMS error:', error);
            return { success: false, error: error.message };
        }
    }
}

export default NotificationService;