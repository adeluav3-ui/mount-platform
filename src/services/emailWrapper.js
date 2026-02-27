// src/services/emailWrapper.js
// This file dynamically imports the email service only when needed

export async function sendNewJobEmail(companyEmail, companyName, jobData) {
    try {
        const { sendNewJobNotification } = await import('./emailService.js');
        return await sendNewJobNotification(companyEmail, companyName, jobData);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendQuoteEmail(customerEmail, customerName, jobData) {
    try {
        const { sendQuoteNotification } = await import('./emailService.js');
        return await sendQuoteNotification(customerEmail, customerName, jobData);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendStatusEmail(userEmail, userName, jobData, status) {
    try {
        const { sendStatusUpdateNotification } = await import('./emailService.js');
        return await sendStatusUpdateNotification(userEmail, userName, jobData, status);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendPaymentEmail(userEmail, userName, jobData, amount, paymentType) {
    try {
        const { sendPaymentConfirmation } = await import('./emailService.js');
        return await sendPaymentConfirmation(userEmail, userName, jobData, amount, paymentType);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}