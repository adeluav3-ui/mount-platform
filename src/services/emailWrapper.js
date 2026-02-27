// src/services/emailWrapper.js
// Use a dynamic import that Vite can't statically analyze

export async function sendNewJobEmail(companyEmail, companyName, jobData) {
    try {
        // Use a template literal to hide the import from Vite's static analysis
        const modulePath = './emailService.js';
        const { sendNewJobNotification } = await import(/* @vite-ignore */ modulePath);
        return await sendNewJobNotification(companyEmail, companyName, jobData);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendQuoteEmail(customerEmail, customerName, jobData) {
    try {
        const modulePath = './emailService.js';
        const { sendQuoteNotification } = await import(/* @vite-ignore */ modulePath);
        return await sendQuoteNotification(customerEmail, customerName, jobData);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendStatusEmail(userEmail, userName, jobData, status) {
    try {
        const modulePath = './emailService.js';
        const { sendStatusUpdateNotification } = await import(/* @vite-ignore */ modulePath);
        return await sendStatusUpdateNotification(userEmail, userName, jobData, status);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}

export async function sendPaymentEmail(userEmail, userName, jobData, amount, paymentType) {
    try {
        const modulePath = './emailService.js';
        const { sendPaymentConfirmation } = await import(/* @vite-ignore */ modulePath);
        return await sendPaymentConfirmation(userEmail, userName, jobData, amount, paymentType);
    } catch (error) {
        console.error('Failed to load email service:', error);
        return { success: false, error: 'Email service unavailable' };
    }
}