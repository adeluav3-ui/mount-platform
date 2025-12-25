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
            const appId = process.env.VITE_ONESIGNAL_APP_ID;
            const apiKey = process.env.VITE_ONESIGNAL_REST_API_KEY; // Updated name
            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app_id: process.env.VITE_ONESIGNAL_APP_ID,
                    include_player_ids: [playerId],
                    headings: { en: `🚨 New ${jobData.category} Job!` },
                    contents: { en: `${jobData.location} • ₦${Number(jobData.budget).toLocaleString()}` },
                    data: {
                        jobId: jobData.id,
                        url: `/dashboard/jobs/${jobData.id}`,
                        type: 'new_job'
                    },
                    url: `https://yourapp.com/dashboard/jobs/${jobData.id}`,
                    chrome_web_icon: 'https://yourapp.com/logo.png',
                    priority: 10 // High priority
                }),
            });

            return { success: response.ok, response: await response.json() };
        } catch (error) {
            console.error('OneSignal push failed:', error);
            return { success: false, error };
        }
    }
}

export default NotificationService;
