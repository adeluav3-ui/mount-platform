// src/services/emailService.js

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
    }),
    // In emailTemplates, add this new template:
    adminNewJobNotification: (adminName, jobDetails, customerDetails) => ({
        subject: `📢 New Job Posted: ${jobDetails.category} - Mount Platform`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #00843E; padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Mount Platform</h1>
                <p style="color: white; margin: 10px 0 0; opacity: 0.9;">Admin Notification</p>
            </div>
            
            <div style="padding: 30px 20px; background: #f9f9f9;">
                <h2 style="color: #333; margin-bottom: 20px;">Hello ${adminName}!</h2>
                
                <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                    A new job has been posted on Mount and sent to providers:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #00843E;">
                    <h3 style="color: #00843E; margin: 0 0 15px 0;">Job Details</h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Category:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${jobDetails.category}${jobDetails.sub_service ? ` - ${jobDetails.sub_service}` : ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${jobDetails.location}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Budget:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${jobDetails.budget === 'N/A' ? 'Not specified' : `₦${Number(jobDetails.budget).toLocaleString()}`}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Job ID:</strong></td>
                            <td style="padding: 8px 0; color: #333; font-family: monospace;">${jobDetails.id}</td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 15px; padding: 15px; background: #f0f9f0; border-radius: 6px;">
                        <p style="margin: 0 0 5px 0; color: #333;"><strong>Description:</strong></p>
                        <p style="margin: 0; color: #666;">${jobDetails.description}</p>
                    </div>
                </div>
                
                <div style="background: #e8f0fe; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0066cc;">
                    <h3 style="color: #0066cc; margin: 0 0 15px 0;">Customer Information</h3>
                    
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #666; width: 120px;"><strong>Name:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${customerDetails.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${customerDetails.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${customerDetails.phone || 'Not provided'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #666;"><strong>Address:</strong></td>
                            <td style="padding: 8px 0; color: #333;">${jobDetails.exact_address}</td>
                        </tr>
                    </table>
                </div>
                
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
                    <p style="margin: 0; color: #666;">
                        <strong>📊 Status:</strong> Job is pending and waiting for provider quotes
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.mountltd.com/admin/jobs" 
                       style="background: #00843E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        View in Admin Dashboard
                    </a>
                </div>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                <p>© 2025 Mount Platform. All rights reserved.</p>
                <p>
                    <a href="https://www.mountltd.com/admin" style="color: #00843E; text-decoration: none;">Admin Dashboard</a>
                </p>
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

        // Get Supabase URL and anon key from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        // Call Supabase Edge Function
        const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({
                to,
                subject,
                html,
                from: 'Mount Platform <notifications@mountltd.com>'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send email');
        }

        const result = await response.json();
        console.log(`✅ Email sent: ${subject} to ${to}`);
        return { success: true, data: result.data };

    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

export const sendAdminNewJobNotification = async (adminEmail, adminName, jobDetails, customerDetails) => {
    return sendEmail({
        to: adminEmail,
        template: 'adminNewJobNotification',
        data: [adminName, jobDetails, customerDetails]
    });
};

// Helper functions (keep these exactly as they are)
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