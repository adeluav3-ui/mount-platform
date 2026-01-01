// src/services/WhatsAppService.js - PRODUCTION READY
import axios from 'axios';

class WhatsAppService {
    constructor() {
        this.phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID;
        this.accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN;
        this.baseURL = 'https://graph.facebook.com/v18.0';

        console.log('✅ WhatsApp Service Initialized:', {
            hasCredentials: !!this.phoneNumberId && !!this.accessToken,
            phoneNumberId: this.phoneNumberId?.substring(0, 6) + '...',
            tokenPreview: this.accessToken?.substring(0, 10) + '...'
        });
    }

    /**
     * Send job notification to company via WhatsApp
     */
    async sendJobNotification(companyPhone, jobData) {
        try {
            const formattedTo = this.formatPhoneNumber(companyPhone);

            console.log('📤 Sending WhatsApp Notification:', {
                to: formattedTo,
                jobId: jobData.id,
                service: jobData.sub_service,
                budget: jobData.budget
            });

            // For now, use text message (no template approval needed)
            const response = await axios.post(
                `${this.baseURL}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: formattedTo,
                    type: 'text',
                    text: {
                        body: this.createJobMessage(jobData)
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                }
            );

            console.log('✅ WhatsApp Response:', {
                success: true,
                messageId: response.data?.messages?.[0]?.id,
                whatsappId: response.data?.contacts?.[0]?.wa_id
            });

            return {
                success: true,
                data: response.data,
                messageId: response.data?.messages?.[0]?.id,
                provider: 'whatsapp'
            };

        } catch (error) {
            console.error('❌ WhatsApp Send Failed:', {
                status: error.response?.status,
                error: error.response?.data || error.message,
                to: companyPhone
            });

            return {
                success: false,
                error: error.response?.data || error.message,
                provider: 'whatsapp'
            };
        }
    }

    /**
     * Create formatted job message
     */
    createJobMessage(jobData) {
        return `🔧 *MOUNT: NEW JOB ALERT!*\n\n` +
            `*Service:* ${jobData.category} - ${jobData.sub_service}\n` +
            `*Location:* ${jobData.location}\n` +
            `*Budget:* ₦${Number(jobData.budget).toLocaleString()}\n` +
            `*Description:* ${jobData.description?.substring(0, 100)}${jobData.description?.length > 100 ? '...' : ''}\n\n` +
            `📱 *Quick Actions:*\n` +
            `• View: https://mountltd.com/dashboard/jobs/${jobData.id}\n` +
            `• Accept: https://mountltd.com/jobs/${jobData.id}/accept\n\n` +
            `_This is an automated notification from Mount Platform_`;
    }

    /**
     * Format phone number to international format
     */
    formatPhoneNumber(phone) {
        if (!phone) return '';

        // Remove all non-digit characters
        let clean = phone.replace(/\D/g, '');

        // Convert to international format
        if (clean.startsWith('0')) {
            clean = '234' + clean.substring(1);
        }
        else if (clean.startsWith('234')) {
            // Already correct
        }
        else if (clean.length === 10) {
            clean = '234' + clean;
        }

        return clean;
    }

    /**
     * Test connection with your own number
     */
    async testConnection(testPhone = '2347019609312') {
        try {
            console.log('🧪 Testing WhatsApp Connection...');

            const result = await this.sendJobNotification(testPhone, {
                id: 'test-' + Date.now(),
                category: 'Electrical',
                sub_service: 'Socket repairs',
                location: 'Abeokuta',
                budget: '25000',
                description: 'Test job notification'
            });

            return result;
        } catch (error) {
            console.error('Test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create singleton instance
const whatsappService = new WhatsAppService();
export default whatsappService;