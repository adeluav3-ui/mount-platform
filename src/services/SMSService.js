// src/services/SMSService.js
import axios from 'axios';

class SMSService {
    constructor() {
        // Initialize with your SendChamp credentials
        this.apiKey = import.meta.env.VITE_SENDCHAMP_API_KEY || '';
        this.baseURL = 'https://api.sendchamp.com/api/v1';
        this.senderId = import.meta.env.VITE_SENDCHAMP_SENDER_ID || 'Mount';
    }

    /**
     * Send SMS to a single phone number
     * @param {string} to - Recipient phone number (e.g., "2348012345678")
     * @param {string} message - SMS content
     * @param {string} route - 'dnd', 'non_dnd', or 'international'
     * @returns {Promise<object>} - SendChamp API response
     */
    async sendSMS(to, message, route = 'dnd') {
        try {
            // Format phone number for Nigeria (add 234 country code)
            const formattedTo = this.formatPhoneNumber(to);

            const response = await axios.post(
                `${this.baseURL}/sms/send`,
                {
                    to: formattedTo,
                    message: message,
                    sender_name: this.senderId,
                    route: route
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            console.log('SMS sent successfully:', response.data);
            return {
                success: true,
                data: response.data,
                messageId: response.data?.data?.message_id
            };
        } catch (error) {
            console.error('SMS sending failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    /**
     * Send bulk SMS to multiple recipients
     * @param {Array<string>} recipients - List of phone numbers
     * @param {string} message - SMS content
     * @returns {Promise<object>} - SendChamp API response
     */
    async sendBulkSMS(recipients, message) {
        try {
            const formattedRecipients = recipients.map(num => this.formatPhoneNumber(num));

            const response = await axios.post(
                `${this.baseURL}/sms/send/bulk`,
                {
                    to: formattedRecipients,
                    message: message,
                    sender_name: this.senderId,
                    route: 'dnd'
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Bulk SMS sending failed:', error);
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    /**
     * Check SMS delivery status
     * @param {string} messageId - Message ID from sendSMS response
     * @returns {Promise<object>} - Delivery status
     */
    async checkDeliveryStatus(messageId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/sms/status/${messageId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return {
                success: true,
                status: response.data
            };
        } catch (error) {
            console.error('Status check failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Format Nigerian phone number to international format
     * @param {string} phone - Nigerian phone number
     * @returns {string} - Formatted number (234xxxxxxxxxx)
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
     * Get account balance
     * @returns {Promise<object>} - Account balance info
     */
    async getBalance() {
        try {
            const response = await axios.get(
                `${this.baseURL}/wallet/wallet_balance`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                }
            );

            return {
                success: true,
                balance: response.data?.data?.balance,
                currency: response.data?.data?.currency
            };
        } catch (error) {
            console.error('Balance check failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create singleton instance
const smsService = new SMSService();
export default smsService;