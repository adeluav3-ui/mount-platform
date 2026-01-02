// src/services/SMSService.js 
import axios from 'axios';

class SMSService {
    constructor() {
        // Toggle between providers
        this.provider = 'africastalking'; // 'africastalking', 'sendchamp', or 'sendbox'

        // SendChamp credentials (keep for fallback)
        this.sendchampApiKey = import.meta.env.VITE_SENDCHAMP_API_KEY || '';
        this.sendchampSenderId = import.meta.env.VITE_SENDCHAMP_SENDER_ID || 'Mount';
        this.sendchampBaseURL = 'https://api.sendchamp.com/api/v1';

        console.log('📱 SMS Service initialized with:', {
            provider: this.provider,
            hasAtKey: !!this.atApiKey,
            atUsername: this.atUsername
        });
    }

    async sendSMS(to, message, route = 'dnd') {
        if (this.provider === 'africastalking') {
            return this.sendViaAfricaTalking(to, message);
        } else {
            return this.sendViaSendchamp(to, message, route);
        }
    }

    // Keep existing SendChamp implementation
    async sendViaSendchamp(to, message, route = 'dnd') {
        try {
            const formattedTo = this.formatPhoneNumber(to);

            const response = await axios.post(
                `${this.sendchampBaseURL}/sms/send`,
                {
                    to: formattedTo,
                    message: message,
                    sender_name: this.sendchampSenderId,
                    route: route
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.sendchampApiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ SendChamp SMS sent:', response.data);
            return {
                success: true,
                data: response.data,
                messageId: response.data?.data?.message_id,
                provider: 'sendchamp'
            };
        } catch (error) {
            console.error('❌ SendChamp SMS failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message,
                provider: 'sendchamp'
            };
        }
    }

    /**
     * Format Nigerian phone number to international format
     */
    formatPhoneNumber(phone) {
        if (!phone) return '';

        // Remove all non-digit characters
        let clean = phone.replace(/\D/g, '');

        // If number starts with 0, replace with 234
        if (clean.startsWith('0')) {
            clean = '234' + clean.substring(1);
        }
        // If number starts with +234, remove the +
        else if (clean.startsWith('234')) {
            // Already in correct format
        }
        // If number doesn't have country code, add it
        else if (clean.length === 10) {
            clean = '234' + clean;
        }

        return clean;
    }

}

// Create singleton instance
const smsService = new SMSService();
export default smsService;