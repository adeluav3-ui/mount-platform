// src/services/TelegramService.js - PRODUCTION READY
import axios from 'axios';

class TelegramService {
    constructor() {
        this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        this.botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'MountJobsBot';
        this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
        this.webhookUrl = import.meta.env.VITE_TELEGRAM_WEBHOOK_URL;

        console.log('🤖 Telegram Service initialized for production');
    }

    /**
     * Send job notification with rich formatting
     */
    async sendJobNotification(chatId, jobData) {
        try {
            const message = this.formatJobMessage(jobData);
            const inlineKeyboard = this.createJobKeyboard(jobData.id);

            const response = await axios.post(`${this.baseURL}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                },
                disable_web_page_preview: false
            }, {
                timeout: 10000
            });

            console.log('✅ Telegram job notification sent:', {
                chatId,
                jobId: jobData.id,
                messageId: response.data.result.message_id
            });

            // Also send a follow-up message after 5 minutes if no response
            setTimeout(() => {
                this.sendReminder(chatId, jobData.id);
            }, 300000); // 5 minutes

            return {
                success: true,
                messageId: response.data.result.message_id,
                chatId: response.data.result.chat.id,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Telegram notification failed:', {
                error: error.response?.data || error.message,
                chatId,
                jobId: jobData.id
            });
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    /**
     * Create interactive keyboard for job actions
     */
    createJobKeyboard(jobId) {
        return [
            [
                {
                    text: '✅ Accept Job',
                    callback_data: `accept_${jobId}`
                }
            ],
            [
                {
                    text: '📋 View Dashboard',
                    url: `https://mountltd.com/company/jobs/${jobId}`
                },
                {
                    text: '❌ Decline',
                    callback_data: `decline_${jobId}`
                }
            ],
            [
                {
                    text: '📞 Call Customer',
                    callback_data: `request_contact_${jobId}`
                }
            ]
        ];
    }

    /**
     * Format beautiful HTML message
     */
    formatJobMessage(jobData) {
        const budget = Number(jobData.budget).toLocaleString();
        const timestamp = new Date().toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return `<b>🚨 NEW JOB REQUEST</b>

🏷️ <b>Category:</b> ${jobData.category}
🔧 <b>Service:</b> ${jobData.sub_service}
📍 <b>Location:</b> ${jobData.location}
💰 <b>Budget:</b> ₦${budget}

${jobData.description ? `📝 <b>Description:</b>\n${jobData.description}\n\n` : ''}

⏰ <i>Received: ${timestamp}</i>
⏳ <i>Reply within 1 hour</i>

<code>Job ID: ${jobData.id.substring(0, 8)}</code>`;
    }

    /**
     * Send reminder if no response
     */
    async sendReminder(chatId, jobId) {
        try {
            await axios.post(`${this.baseURL}/sendMessage`, {
                chat_id: chatId,
                text: `⏰ <b>REMINDER:</b> Job ${jobId.substring(0, 8)} is still pending.\nPlease accept or decline soon.`,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Accept', callback_data: `accept_${jobId}` },
                            { text: '❌ Decline', callback_data: `decline_${jobId}` }
                        ]
                    ]
                }
            });
        } catch (error) {
            console.error('Reminder failed:', error.message);
        }
    }

    /**
     * Setup webhook (call this once in production)
     */
    async setupProductionWebhook() {
        if (!this.webhookUrl) {
            console.error('❌ Webhook URL not configured');
            return { success: false, error: 'No webhook URL' };
        }

        try {
            const response = await axios.post(`${this.baseURL}/setWebhook`, {
                url: this.webhookUrl,
                max_connections: 100,
                allowed_updates: ['callback_query', 'message', 'chat_member'],
                drop_pending_updates: true, // Clear pending updates
                secret_token: import.meta.env.VITE_TELEGRAM_SECRET_TOKEN // Optional security
            });

            console.log('✅ Webhook configured:', response.data);

            // Verify webhook is set
            const info = await axios.get(`${this.baseURL}/getWebhookInfo`);
            console.log('🔍 Webhook info:', info.data);

            return {
                success: true,
                data: response.data,
                info: info.data
            };
        } catch (error) {
            console.error('❌ Webhook setup failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get bot commands for better UX
     */
    async setBotCommands() {
        const commands = [
            { command: 'start', description: 'Start the bot' },
            { command: 'register', description: 'Register your email' },
            { command: 'link', description: 'Link to existing account' },
            { command: 'jobs', description: 'View pending jobs' },
            { command: 'help', description: 'Show help' }
        ];

        try {
            await axios.post(`${this.baseURL}/setMyCommands`, { commands });
            console.log('✅ Bot commands set');
        } catch (error) {
            console.error('Failed to set commands:', error);
        }
    }

    /**
     * Initialize bot for production
     */
    async initializeBot() {
        console.log('🚀 Initializing Telegram bot for production...');

        // 1. Set webhook
        await this.setupProductionWebhook();

        // 2. Set bot commands
        await this.setBotCommands();

        // 3. Get bot info
        const info = await axios.get(`${this.baseURL}/getMe`);
        console.log('🤖 Bot ready:', info.data.result);

        return { success: true, bot: info.data.result };
    }
}

// Export singleton
const telegramService = new TelegramService();
export default telegramService;