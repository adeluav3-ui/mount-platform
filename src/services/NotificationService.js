// src/services/NotificationService.js - FIXED
import { EmailService } from './EmailService'; // Changed from sendJobNotificationEmail to EmailService

class NotificationService {
    static async notifyCompanyNewJob(companyId, jobData) {
        // ... your code

        // 3. Send Email (Backup)
        if (company.email) {
            const emailResult = await EmailService.sendJobNotificationEmail( // Use class.staticMethod
                company.email,
                jobData,
                company.company_name
            );
            notifications.push({ type: 'email', success: emailResult.success });
        }

        // 3. Send Email (Backup)
        if (company.email) {
            const emailResult = await sendJobNotificationEmail(
                company.email,
                jobData,
                company.company_name
            );
            notifications.push({ type: 'email', success: emailResult.success });
        }

        // 4. Database Notification (Real-time)
        const dbResult = await supabase
            .from('notifications')
            .insert({
                user_id: companyId,
                job_id: jobData.id,
                title: 'New Job Available',
                message: `New ${jobData.category} job in ${jobData.location}`,
                type: 'new_job',
                read: false,
                created_at: new Date().toISOString()
            });
        notifications.push({ type: 'database', success: !dbResult.error });

        return {
            success: notifications.some(n => n.success),
            notifications,
            company
        };
    }

    static async sendOneSignalPush(playerId, jobData, companyName) {
        try {
            console.log('🚀 SENDING PUSH NOTIFICATION:', {
                playerId: playerId ? '✅ Has ID' : '❌ Missing ID',
                company: companyName,
                jobId: jobData.id,
                time: new Date().toISOString()
            });

            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
            const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

            if (!appId || !apiKey) {
                console.error('❌ Missing OneSignal credentials');
                return { success: false, error: 'Credentials missing' };
            }

            if (!playerId) {
                console.error('❌ No player ID for company:', companyName);
                return { success: false, error: 'No player ID' };
            }

            console.log('📤 Sending to OneSignal API...');

            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app_id: appId,
                    include_player_ids: [playerId],
                    headings: { en: `🚨 New ${jobData.category} Job!` },
                    contents: { en: `${jobData.sub_service} in ${jobData.location}` },
                    data: {
                        jobId: jobData.id,
                        url: `/dashboard/jobs/${jobData.id}`,
                        type: 'new_job'
                    },
                    url: `https://mountltd.com/dashboard/jobs/${jobData.id}`,
                    chrome_web_icon: 'https://mountltd.com/logo.png',
                    priority: 10
                }),
            });

            const result = await response.json();
            console.log('📥 OneSignal API response:', {
                success: response.ok,
                status: response.status,
                result: result
            });

            return {
                success: response.ok,
                response: result,
                playerId: playerId
            };

        } catch (error) {
            console.error('❌ OneSignal push failed:', error);
            return { success: false, error };
        }
    }
}

export default NotificationService;
