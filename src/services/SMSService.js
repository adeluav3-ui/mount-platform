// src/services/SMSService.js - Africa's Talking Version
import axios from 'axios';

class SMSService {
    constructor() {
        // Toggle between providers
        this.provider = 'africastalking'; // 'africastalking', 'sendchamp', or 'sendbox'

        // Africa's Talking credentials
        this.atApiKey = import.meta.env.VITE_AFRICASTALKING_API_KEY || '';
        this.atUsername = import.meta.env.VITE_AFRICASTALKING_USERNAME || 'sandbox';
        this.atSenderId = import.meta.env.VITE_AFRICASTALKING_SENDER_ID || 'Mount';
        this.atBaseURL = 'https://api.africastalking.com/version1';

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

    // Africa's Talking implementation
    async sendViaAfricaTalking(to, message) {
        try {
            const formattedTo = this.formatPhoneNumber(to);

            console.log('📤 Sending via Africa\'s Talking:', {
                to: formattedTo,
                messageLength: message.length,
                username: this.atUsername
            });

            // Africa's Talking uses form-urlencoded
            const params = new URLSearchParams();
            params.append('username', this.atUsername);
            params.append('to', formattedTo);
            params.append('message', message);
            params.append('from', this.atSenderId);

            const response = await axios.post(
                `${this.atBaseURL}/messaging`,
                params,
                {
                    headers: {
                        'apikey': this.atApiKey,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('✅ Africa\'s Talking Response:', response.data);

            // Parse Africa's Talking response
            const atData = response.data?.SMSMessageData;
            return {
                success: atData?.Recipients?.length > 0,
                data: response.data,
                messageId: atData?.Recipients?.[0]?.messageId,
                provider: 'africastalking',
                recipients: atData?.Recipients || [],
                status: atData?.Recipients?.[0]?.status,
                cost: atData?.Recipients?.[0]?.cost
            };
        } catch (error) {
            console.error('❌ Africa\'s Talking SMS failed:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

            // Fallback to SendChamp
            console.log('🔄 Falling back to SendChamp...');
            return this.sendViaSendchamp(to, message);
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

    /**
     * Get account balance - Africa's Talking version
     */
    async getBalance() {
        try {
            if (this.provider === 'africastalking') {
                const response = await axios.get(
                    `${this.atBaseURL}/user`,
                    {
                        params: {
                            username: this.atUsername
                        },
                        headers: {
                            'apikey': this.atApiKey,
                            'Accept': 'application/json'
                        }
                    }
                );

                return {
                    success: true,
                    balance: response.data?.UserData?.balance,
                    currency: 'KES', // Africa's Talking uses Kenyan Shillings
                    provider: 'africastalking'
                };
            } else {
                // SendChamp balance check (your existing code)
                const response = await axios.get(
                    `${this.sendchampBaseURL}/wallet/wallet_balance`,
                    {
                        headers: {
                            'Authorization': `Bearer ${this.sendchampApiKey}`
                        }
                    }
                );

                return {
                    success: true,
                    balance: response.data?.data?.balance,
                    currency: response.data?.data?.currency,
                    provider: 'sendchamp'
                };
            }
        } catch (error) {
            console.error('Balance check failed:', error);
            return {
                success: false,
                error: error.message,
                provider: this.provider
            };
        }
    }
}

// Create singleton instance
const smsService = new SMSService();
export default smsService;