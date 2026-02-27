// src/services/emailWrapper.js
// Static imports
import { sendNewJobNotification, sendQuoteNotification, sendStatusUpdateNotification, sendPaymentConfirmation } from './emailService.js';

export async function sendNewJobEmail(companyEmail, companyName, jobData) {
    try {
        return await sendNewJobNotification(companyEmail, companyName, jobData);
    } catch (error) {
        console.error('Failed to send new job email:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendQuoteEmail(customerEmail, customerName, jobData) {
    try {
        return await sendQuoteNotification(customerEmail, customerName, jobData);
    } catch (error) {
        console.error('Failed to send quote email:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendStatusEmail(userEmail, userName, jobData, status) {
    try {
        return await sendStatusUpdateNotification(userEmail, userName, jobData, status);
    } catch (error) {
        console.error('Failed to send status email:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendPaymentEmail(userEmail, userName, jobData, amount, paymentType) {
    try {
        return await sendPaymentConfirmation(userEmail, userName, jobData, amount, paymentType);
    } catch (error) {
        console.error('Failed to send payment email:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}