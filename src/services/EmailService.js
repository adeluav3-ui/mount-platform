// src/services/EmailService.js
class EmailService {
    static async sendJobNotificationEmail(toEmail, jobData, companyName) {
        try {
            console.log('📧 Attempting to send email to:', toEmail);

            // We'll use Resend API - sign up at resend.com
            // Get API key from environment variables
            const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

            if (!RESEND_API_KEY) {
                console.warn('⚠️ Resend API key not configured. Email notifications disabled.');
                return { success: false, error: 'Email service not configured' };
            }

            const emailData = {
                from: 'Mount Platform <notifications@mountltd.com>',
                to: [toEmail],
                subject: `🎯 New ${jobData.category} Job Available: ${jobData.sub_service}`,
                html: this.createJobEmailHTML(companyName, jobData),
                text: this.createJobEmailText(companyName, jobData),
                headers: {
                    'X-Entity-Ref-ID': `job-${jobData.id}-${Date.now()}`
                }
            };

            console.log('📨 Email payload:', {
                to: toEmail,
                subject: emailData.subject,
                jobId: jobData.id
            });

            // Send via Resend API
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Email sent successfully:', result.id);
                return { success: true, id: result.id };
            } else {
                console.error('❌ Email API error:', result);
                return { success: false, error: result.message || 'Email sending failed' };
            }

        } catch (error) {
            console.error('❌ Email service error:', error);
            return { success: false, error: error.message };
        }
    }

    static createJobEmailHTML(companyName, jobData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Job Available - Mount Platform</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f9fafb;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                    border-radius: 12px 12px 0 0;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }
                .header p {
                    margin: 10px 0 0;
                    opacity: 0.9;
                    font-size: 16px;
                }
                .content {
                    background: white;
                    padding: 40px;
                    border-radius: 0 0 12px 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .job-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 24px;
                    margin: 24px 0;
                }
                .job-card h2 {
                    color: #1e293b;
                    margin-top: 0;
                    font-size: 22px;
                }
                .job-detail {
                    display: flex;
                    margin-bottom: 12px;
                    align-items: flex-start;
                }
                .job-detail-icon {
                    width: 24px;
                    height: 24px;
                    margin-right: 12px;
                    color: #10B981;
                    flex-shrink: 0;
                }
                .job-detail-text {
                    flex: 1;
                }
                .job-detail-label {
                    font-weight: 600;
                    color: #475569;
                    font-size: 14px;
                }
                .job-detail-value {
                    color: #1e293b;
                    margin-top: 4px;
                }
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                    color: white;
                    text-decoration: none;
                    padding: 16px 32px;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 16px;
                    text-align: center;
                    margin: 24px 0;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .cta-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
                }
                .footer {
                    text-align: center;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #e2e8f0;
                    color: #64748b;
                    font-size: 14px;
                }
                .footer a {
                    color: #10B981;
                    text-decoration: none;
                }
                .badge {
                    display: inline-block;
                    background: #d1fae5;
                    color: #065f46;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-left: 8px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 New Job Available!</h1>
                    <p>A customer needs your services on Mount Platform</p>
                </div>
                
                <div class="content">
                    <p>Hello <strong>${companyName}</strong>,</p>
                    <p>A new job matching your services has been posted and you're a perfect fit!</p>
                    
                    <div class="job-card">
                        <h2>${jobData.sub_service}</h2>
                        
                        <div class="job-detail">
                            <svg class="job-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div class="job-detail-text">
                                <div class="job-detail-label">Category</div>
                                <div class="job-detail-value">${jobData.category}</div>
                            </div>
                        </div>
                        
                        <div class="job-detail">
                            <svg class="job-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div class="job-detail-text">
                                <div class="job-detail-label">Location</div>
                                <div class="job-detail-value">${jobData.location}</div>
                            </div>
                        </div>
                        
                        <div class="job-detail">
                            <svg class="job-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div class="job-detail-text">
                                <div class="job-detail-label">Budget</div>
                                <div class="job-detail-value">₦${Number(jobData.budget).toLocaleString()}</div>
                            </div>
                        </div>
                        
                        <div class="job-detail">
                            <svg class="job-detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div class="job-detail-text">
                                <div class="job-detail-label">Description</div>
                                <div class="job-detail-value">${jobData.description}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="https://mountltd.com/dashboard/jobs/${jobData.id}" class="cta-button">
                            👉 View & Accept Job Now
                        </a>
                    </div>
                    
                    <p><strong>⏰ Quick Response Tip:</strong> The first company to respond often gets the job. Review the details and respond as soon as possible!</p>
                    
                    <div class="footer">
                        <p>This email was sent because you're registered as a service provider on Mount Platform.</p>
                        <p>
                            <a href="https://mountltd.com/dashboard/settings#notifications">Manage notification preferences</a> | 
                            <a href="https://mountltd.com/help">Help Center</a>
                        </p>
                        <p>© ${new Date().getFullYear()} Mount Platform. Nigeria's Trusted Home Services Marketplace.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    static createJobEmailText(companyName, jobData) {
        return `
        NEW JOB AVAILABLE - Mount Platform
        ===================================
        
        Hello ${companyName},
        
        A new job matching your services has been posted on Mount Platform!
        
        JOB DETAILS:
        ------------
        Service: ${jobData.sub_service}
        Category: ${jobData.category}
        Location: ${jobData.location}
        Budget: ₦${Number(jobData.budget).toLocaleString()}
        Description: ${jobData.description}
        
        VIEW & ACCEPT JOB:
        https://mountltd.com/dashboard/jobs/${jobData.id}
        
        ⏰ Quick Response Tip: The first company to respond often gets the job!
        
        ---
        This email was sent because you're registered as a service provider on Mount Platform.
        Manage notifications: https://mountltd.com/dashboard/settings#notifications
        Help Center: https://mountltd.com/help
        
        © ${new Date().getFullYear()} Mount Platform. Nigeria's Trusted Home Services Marketplace.
        `;
    }
}

export { EmailService };