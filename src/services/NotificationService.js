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

    // In NotificationService.js, update the sendOneSignalPush function:
    static async sendOneSignalPush(playerId, jobData, companyName) {
        try {
            console.log('🚀 [DEBUG] SENDING ONESIGNAL PUSH:');
            console.log('📱 Player ID:', playerId);
            console.log('🏢 Company:', companyName);
            console.log('📦 Job Data:', jobData);

            const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
            const apiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

            console.log('🔑 Credentials check:', {
                hasAppId: !!appId,
                hasApiKey: !!apiKey,
                appIdFirst10: appId ? appId.substring(0, 10) + '...' : 'missing',
                apiKeyFirst10: apiKey ? apiKey.substring(0, 10) + '...' : 'missing'
            });

            if (!appId || !apiKey) {
                console.error('❌ Missing OneSignal credentials');
                return { success: false, error: 'Credentials missing' };
            }

            if (!playerId) {
                console.error('❌ No player ID provided');
                return { success: false, error: 'No player ID' };
            }

            // Verify playerId format (should be UUID)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId);
            console.log('🔍 Player ID validation:', {
                length: playerId.length,
                isUUID,
                valid: isUUID && playerId.length === 36
            });

            const payload = {
                app_id: appId,
                include_player_ids: [playerId],
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

            console.log('📤 OneSignal payload:', JSON.stringify(payload, null, 2));

            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            console.log('📥 OneSignal API Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                result: result
            });

            if (result.errors) {
                console.error('❌ OneSignal errors:', result.errors);
                console.error('❌ Invalid player IDs:', result.invalid_player_ids);
            }

            if (result.id) {
                console.log('✅ OneSignal notification sent successfully!');
                console.log('📊 Notification ID:', result.id);
                console.log('👥 Recipients count:', result.recipients);

                // This notification should now appear in your OneSignal dashboard!
            }

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