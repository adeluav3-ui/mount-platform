// supabase/functions/telegram-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to send Telegram message
async function sendTelegramMessage(chatId: number, text: string, replyMarkup: any = null) {
    try {
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
        console.log('📤 Attempting to send Telegram message:', {
            chatId,
            textLength: text.length,
            hasToken: !!botToken
        })

        // Build request body
        const requestBody: any = {
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        }

        // Only add reply_markup if provided and valid
        if (replyMarkup && typeof replyMarkup === 'object' && Object.keys(replyMarkup).length > 0) {
            requestBody.reply_markup = replyMarkup
        }

        console.log('Sending to Telegram:', JSON.stringify(requestBody, null, 2))

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        })

        const result = await response.json()
        console.log('📩 Telegram API response:', result)

        return result
    } catch (error) {
        console.error('❌ sendTelegramMessage failed:', error)
        throw error
    }
}

// Helper to answer callback query
async function answerCallbackQuery(callbackQueryId: string) {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            callback_query_id: callbackQueryId
        })
    })
}

// Helper to notify customer
async function notifyCustomer(supabaseClient: any, jobId: string, action: string) {
    // Get job details
    const { data: job } = await supabaseClient
        .from('jobs')
        .select('customer_id, companies!inner(company_name)')
        .eq('id', jobId)
        .single()

    if (job) {
        await supabaseClient
            .from('notifications')
            .insert({
                user_id: job.customer_id,
                job_id: jobId,
                title: action === 'accepted' ? '🎉 Job Accepted!' : '❌ Job Declined',
                message: `${job.companies.company_name} has ${action} your job via Telegram`,
                type: `job_${action}`,
                read: false
            })
    }
}

// THE SERVE FUNCTION STARTS HERE - all webhook logic goes inside this
serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // NEW: Skip auth check for Telegram webhook (from Telegram servers)
    const userAgent = req.headers.get('user-agent') || '';
    const isTelegramWebhook = userAgent.includes('TelegramBot') ||
        req.headers.get('x-telegram-bot-api-secret-token');

    // Create URL object once
    const url = new URL(req.url); // <-- KEEP THIS ONE

    // For job-notification endpoint (from your app), check auth
    if (url.pathname.includes('/job-notification') && !isTelegramWebhook) {
        // Simple auth check - verify the Authorization header matches anon key
        const authHeader = req.headers.get('authorization');
        const expectedToken = Deno.env.get('SUPABASE_ANON_KEY');

        if (!authHeader || !authHeader.startsWith('Bearer ') ||
            authHeader.split(' ')[1] !== expectedToken) {
            console.log('❌ Unauthorized access to job-notification');
            return new Response(
                JSON.stringify({ code: 401, message: 'Unauthorized' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            );
        }
    }

    // Environment check
    console.log('Environment check:', {
        hasURL: !!Deno.env.get('URL'),
        hasAnonKey: !!Deno.env.get('ANON_KEY'),
        hasTelegramToken: !!Deno.env.get('TELEGRAM_BOT_TOKEN'),
        telegramToken: Deno.env.get('TELEGRAM_BOT_TOKEN')?.substring(0, 10) + '...'
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
        Deno.env.get('URL') ?? '',
        Deno.env.get('ANON_KEY') ?? ''
    )

    console.log('Request received:', req.method, req.url)

    // NEW: Handle job notifications from your app (via POST to /job-notification)
    if (url.pathname.includes('/job-notification')) { // <-- USE SAME URL OBJECT HERE
        console.log('📤 Received job notification request from app');

        try {
            const body = await req.json();
            console.log('Job notification details:', {
                action: body.action,
                chatId: body.chat_id,
                jobId: body.job_id,
                company: body.company_name
            });

            if (body.action === 'send_job_notification') {
                const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

                // Format message with proper Markdown
                const message = body.message ||
                    `🚨 *NEW JOB REQUEST*\n\n` +
                    `🏷️ *Category:* ${body.category || 'Unknown'}\n` +
                    `🔧 *Service:* ${body.sub_service || 'Unknown'}\n` +
                    `📍 *Location:* ${body.location || 'Unknown'}\n` +
                    `💰 *Budget:* ₦${Number(body.budget || 0).toLocaleString()}\n\n` +
                    `📝 *Description:*\n${body.description || 'No additional details'}\n\n` +
                    `⏰ *Reply within 1 hour*`;

                const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: body.chat_id,
                        text: message,
                        parse_mode: 'Markdown',
                        reply_markup: body.reply_markup || null
                    })
                });

                const result = await response.json();
                console.log('Telegram send result:', result);

                return new Response(
                    JSON.stringify({
                        success: result.ok,
                        messageId: result.result?.message_id,
                        error: result.description
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            return new Response(
                JSON.stringify({ success: false, error: 'Unknown action' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

        } catch (error) {
            console.error('Job notification error:', error);
            return new Response(
                JSON.stringify({ success: false, error: error.message }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
    }

    // Handle GET requests (for testing/browser)
    if (req.method === 'GET') {
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Telegram webhook is running',
                timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    try {
        // Check if request has body
        const contentType = req.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Content-Type must be application/json'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        const body = await req.json()
        console.log('📱 Telegram Webhook Received:', JSON.stringify(body, null, 2))

        // Handle callback queries (button clicks)
        if (body.callback_query) {
            const callback_query = body.callback_query
            const chatId = callback_query.message.chat.id
            const callbackData = callback_query.data
            const messageId = callback_query.message.message_id

            // Parse callback data (format: "accept_JOB_ID" or "decline_JOB_ID")
            const [action, jobId] = callbackData.split('_')

            // Update job status in database
            if (action === 'accept') {
                await supabaseClient
                    .from('jobs')
                    .update({
                        status: 'active',
                        accepted_at: new Date().toISOString()
                    })
                    .eq('id', jobId)

                // Send confirmation to user
                await sendTelegramMessage(chatId, `✅ Job ${jobId} accepted! Please proceed to dashboard.`)

                // Notify customer
                await notifyCustomer(supabaseClient, jobId, 'accepted')

            } else if (action === 'decline') {
                await supabaseClient
                    .from('jobs')
                    .update({ status: 'declined' })
                    .eq('id', jobId)

                await sendTelegramMessage(chatId, `❌ Job ${jobId} declined.`)

                // Notify customer
                await notifyCustomer(supabaseClient, jobId, 'declined')
            }

            // Answer callback query (removes loading state on button)
            await answerCallbackQuery(callback_query.id)

            return new Response(
                JSON.stringify({ success: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Handle text messages
        if (body.message && body.message.text) {
            const { chat, text } = body.message
            const chatId = chat.id

            // Handle /start command
            if (text.startsWith('/start')) {
                const welcomeMessage = `👋 Welcome to Mount Jobs Bot!\n\n` +
                    `I'll notify you about new jobs and you can accept/decline them right here.\n\n` +
                    `To register, send:\n` +
                    `<code>/register your@email.com</code>\n\n` +
                    `Or link to existing account:\n` +
                    `<code>/link YOUR_REGISTRATION_CODE</code>`

                console.log('Sending welcome message to chat:', chatId)
                try {
                    const result = await sendTelegramMessage(chatId, welcomeMessage)
                    console.log('Welcome message sent result:', result)
                } catch (error) {
                    console.error('Failed to send welcome message:', error)
                }
            }

            // Handle /register command
            else if (text.startsWith('/register')) {
                const email = text.split(' ')[1]
                if (email) {
                    // Generate verification code
                    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

                    await supabaseClient
                        .from('telegram_verifications')
                        .insert({
                            chat_id: chatId,
                            email: email,
                            code: code,
                            created_at: new Date().toISOString()
                        })

                    await sendTelegramMessage(chatId,
                        `📧 Verification initiated for ${email}\n\n` +
                        `Go to your Mount dashboard and enter code:\n\n` +
                        `<b>${code}</b>\n\n` +
                        `This code expires in 10 minutes.`
                    )
                }
            }

            else if (text.startsWith('/link')) {
                const email = text.split(' ')[1]
                if (email && email.includes('@')) {
                    console.log('🔗 Linking attempt for email:', email)

                    // Check if company exists
                    const { data: company, error: companyError } = await supabaseClient
                        .from('companies')
                        .select('id, company_name, telegram_chat_id')
                        .eq('email', email.trim())
                        .single()

                    if (companyError || !company) {
                        await sendTelegramMessage(chatId,
                            `❌ No company found with email: ${email}\n\n` +
                            `Please use the exact email you used to sign up.\n\n` +
                            `Need help? Contact support.`
                        )
                        return new Response(JSON.stringify({ success: false }), { headers: corsHeaders })
                    }

                    // Check if already linked
                    if (company.telegram_chat_id) {
                        await sendTelegramMessage(chatId,
                            `ℹ️ Already linked!\n\n` +
                            `Company: ${company.company_name}\n` +
                            `You'll receive job notifications here.`
                        )
                        return new Response(JSON.stringify({ success: false }), { headers: corsHeaders })
                    }

                    // LINK IMMEDIATELY - no code needed
                    const { error: updateError } = await supabaseClient
                        .from('companies')
                        .update({
                            telegram_chat_id: chatId,
                            telegram_linked_at: new Date().toISOString()
                        })
                        .eq('id', company.id)

                    if (updateError) {
                        await sendTelegramMessage(chatId,
                            `❌ Linking failed. Please try again or contact support.`
                        )
                        console.error('Update error:', updateError)
                    } else {
                        await sendTelegramMessage(chatId,
                            `✅ Successfully linked!\n\n` +
                            `Company: <b>${company.company_name}</b>\n` +
                            `You'll now receive instant job notifications here.\n\n` +
                            `When you get a new job, you can:\n` +
                            `• Click "Accept" to take the job\n` +
                            `• Click "View Details" to see more\n` +
                            `• Click "Decline" to pass\n\n` +
                            `Happy working! 🛠️`
                        )

                        console.log(`✅ Company ${company.company_name} linked to Telegram chat ${chatId}`)
                    }
                } else {
                    await sendTelegramMessage(chatId,
                        `📝 Usage: <code>/link your@email.com</code>\n\n` +
                        `Use the exact email you used to sign up.\n\n` +
                        `Example: <code>/link company@example.com</code>`
                    )
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('❌ Webhook error:', error)

        // Handle JSON parsing errors specifically
        if (error.message.includes('JSON') || error.message.includes('end of input')) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Invalid JSON payload',
                    hint: 'Send valid JSON with Content-Type: application/json'
                }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})