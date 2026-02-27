// src/services/emailService.js
let Resend;

// Dynamic import to avoid build issues
const initResend = async () => {
    const module = await import('resend');
    Resend = module.Resend;
    return new Resend(import.meta.env.VITE_RESEND_API_KEY);
};

let resendPromise = initResend();

// Initialize Resend with your API key
const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

// Email templates
const emailTemplates = {
    // When customer posts a new job
    newJobToCompany: (companyName, jobDetails) => ({
        subject: `🔨 New Job: ${jobDetails.category} - Mount Platform`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #00843E; padding: 30px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Mount Platform</h1>
                </div>
                
                <div style="padding: 30px 20px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hello ${companyName}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        A new job has been posted that matches your services:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #00843E; margin: 0 0 10px 0;">${jobDetails.category}${jobDetails.sub_service ? ` - ${jobDetails.sub_service}` : ''}</h3>
                        
                        <p style="color: #333; margin: 5px 0;"><strong>Location:</strong> ${jobDetails.location}</p>
                        <p style="color: #333; margin: 5px 0;"><strong>Budget:</strong> ${jobDetails.budget === 'N/A' ? 'Not specified' : `₦${Number(jobDetails.budget).toLocaleString()}`}</p>
                        <p style="color: #333; margin: 5px 0;"><strong>Description:</strong> ${jobDetails.description.substring(0, 200)}${jobDetails.description.length > 200 ? '...' : ''}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.mountltd.com/dashboard" 
                           style="background: #00843E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            View Job Details
                        </a>
                    </div>
                </div>
                
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2025 Mount Platform. All rights reserved.</p>
                    <p>
                        <a href="https://www.mountltd.com/terms" style="color: #00843E; text-decoration: none;">Terms</a> • 
                        <a href="https://www.mountltd.com/privacy" style="color: #00843E; text-decoration: none;">Privacy</a>
                    </p>
                </div>
            </div>
        `
    }),

    // When company sends a quote
    quoteReceived: (customerName, jobDetails, quoteAmount) => ({
        subject: `💰 New Quote for Your Job - Mount Platform`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #00843E; padding: 30px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Mount Platform</h1>
                </div>
                
                <div style="padding: 30px 20px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        You've received a quote for your job:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #00843E; margin: 0 0 10px 0;">${jobDetails.category}</h3>
                        
                        <p style="color: #333; margin: 5px 0;"><strong>Quote Amount:</strong> ₦${Number(quoteAmount).toLocaleString()}</p>
                        <p style="color: #333; margin: 5px 0;"><strong>Company:</strong> ${jobDetails.companyName}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.mountltd.com/dashboard" 
                           style="background: #00843E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Review Quote
                        </a>
                    </div>
                </div>
                
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2025 Mount Platform. All rights reserved.</p>
                </div>
            </div>
        `
    }),

    // When job status changes
    jobStatusUpdate: (userName, jobDetails, status) => ({
        subject: `🔄 Job Update: ${status} - Mount Platform`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #00843E; padding: 30px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Mount Platform</h1>
                </div>
                
                <div style="padding: 30px 20px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Your job status has been updated:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #00843E; margin: 0 0 10px 0;">${jobDetails.category}</h3>
                        
                        <p style="color: #333; margin: 5px 0;"><strong>New Status:</strong> ${status}</p>
                        ${jobDetails.companyName ? `<p style="color: #333; margin: 5px 0;"><strong>Company:</strong> ${jobDetails.companyName}</p>` : ''}
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.mountltd.com/dashboard" 
                           style="background: #00843E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            View Job
                        </a>
                    </div>
                </div>
                
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2025 Mount Platform. All rights reserved.</p>
                </div>
            </div>
        `
    }),

    // When payment is confirmed
    paymentConfirmed: (userName, jobDetails, amount, paymentType) => ({
        subject: `✅ Payment Confirmed - Mount Platform`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #00843E; padding: 30px 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Mount Platform</h1>
                </div>
                
                <div style="padding: 30px 20px; background: #f9f9f9;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hello ${userName}!</h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        Your payment has been confirmed:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #00843E; margin: 0 0 10px 0;">${jobDetails.category}</h3>
                        
                        <p style="color: #333; margin: 5px 0;"><strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</p>
                        <p style="color: #333; margin: 5px 0;"><strong>Payment Type:</strong> ${paymentType}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.mountltd.com/dashboard" 
                           style="background: #00843E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            View Details
                        </a>
                    </div>
                </div>
                
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2025 Mount Platform. All rights reserved.</p>
                </div>
            </div>
        `
    })
};

// Main email sending function
export const sendEmail = async ({ to, template, data }) => {
    try {
        // Get the template
        const templateFn = emailTemplates[template];
        if (!templateFn) {
            throw new Error(`Template "${template}" not found`);
        }

        // Generate email content
        const { subject, html } = templateFn(...data);

        // Send via Resend
        const { data: emailData, error } = await resend.emails.send({
            from: 'Mount Platform <notifications@mountltd.com>',
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error };
        }

        console.log(`✅ Email sent: ${subject} to ${to}`);
        return { success: true, data: emailData };

    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
};

// Helper functions for specific notifications
export const sendNewJobNotification = async (companyEmail, companyName, jobDetails) => {
    return sendEmail({
        to: companyEmail,
        template: 'newJobToCompany',
        data: [companyName, jobDetails]
    });
};

export const sendQuoteNotification = async (customerEmail, customerName, jobDetails) => {
    return sendEmail({
        to: customerEmail,
        template: 'quoteReceived',
        data: [customerName, jobDetails, jobDetails.quotedPrice]
    });
};

export const sendStatusUpdateNotification = async (userEmail, userName, jobDetails, status) => {
    return sendEmail({
        to: userEmail,
        template: 'jobStatusUpdate',
        data: [userName, jobDetails, status]
    });
};

export const sendPaymentConfirmation = async (userEmail, userName, jobDetails, amount, paymentType) => {
    return sendEmail({
        to: userEmail,
        template: 'paymentConfirmed',
        data: [userName, jobDetails, amount, paymentType]
    });
};