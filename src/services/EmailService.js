// src/services/EmailService.js
import { Resend } from 'resend';

const resend = new Resend(process.env.REACT_APP_RESEND_API_KEY);

export async function sendJobNotificationEmail(to, jobData, companyName) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Mount <notifications@mount.com>',
            to: [to],
            subject: `🚨 New ${jobData.category} Job Available!`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #10B981;">New Job Alert!</h2>
          <p>Hello ${companyName},</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${jobData.category} - ${jobData.sub_service || 'Service'}</h3>
            <p><strong>📍 Location:</strong> ${jobData.location}</p>
            <p><strong>💰 Budget:</strong> ₦${Number(jobData.budget).toLocaleString()}</p>
            <p><strong>📝 Description:</strong> ${jobData.description}</p>
          </div>
          
          <a href="https://yourapp.com/dashboard" 
             style="background: #10B981; color: white; padding: 12px 24px; 
                    border-radius: 8px; text-decoration: none; display: inline-block;">
            View Job & Send Quote
          </a>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 12px;">
            This is an automated notification from Mount Platform.
          </p>
        </div>
      `,
        });

        return { success: !error, data, error };
    } catch (error) {
        console.error('Email sending failed:', error);
        return { success: false, error };
    }
}
