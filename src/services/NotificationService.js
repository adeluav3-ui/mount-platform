// src/services/NotificationService.js - UPDATED
class NotificationService {
    // Accept company OBJECT instead of just ID
    static async notifyCompanyNewJob(company, jobData) {
        const notifications = [];

        console.log('🔔 Sending notifications for:', {
            company: company.company_name,
            companyId: company.id,
            jobId: jobData.id
        });

        if (!company) {
            return { success: false, error: 'Company not provided' };
        }

        // 2. Send OneSignal Push (Instant)
        if (company.onesignal_player_id) {
            const pushResult = await this.sendOneSignalPush(
                company.onesignal_player_id,
                jobData,
                company.company_name
            );
            notifications.push({ type: 'push', success: pushResult.success });
        } else {
            console.log('⚠️ Company has no OneSignal player ID:', company.company_name);
            notifications.push({ type: 'push', success: false, reason: 'no_player_id' });
        }

        // 3. Send Email (Backup) - SKIP FOR NOW
        if (company.email) {
            console.log('📧 Email available but skipping for now:', company.email);
            notifications.push({ type: 'email', success: false, reason: 'not_configured' });
        }

        // Note: Database notification is already done in Step2Companies.jsx
        // So we don't need to do it here

        return {
            success: notifications.some(n => n.success),
            notifications,
            company: company.company_name
        };
    }

    static async sendOneSignalPush(playerId, jobData, companyName) {
        try {
            console.log('🚀 Sending push to player ID:', playerId);

            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
            const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

            if (!appId || !apiKey) {
                console.error('❌ Missing OneSignal credentials');
                return { success: false, error: 'Credentials missing' };
            }

            if (!playerId) {
                console.error('❌ No player ID provided');
                return { success: false, error: 'No player ID' };
            }

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

            console.log('📥 OneSignal response:', {
                success: response.ok,
                status: response.status,
                resultId: result.id
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