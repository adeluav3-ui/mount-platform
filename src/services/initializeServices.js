// src/services/initializeServices.js
import * as emailWrapper from './emailWrapper.js';
import NotificationService from './NotificationService.js';

// Initialize NotificationService with email functions
NotificationService.initialize({
    sendNewJobEmail: emailWrapper.sendNewJobEmail,
    sendQuoteEmail: emailWrapper.sendQuoteEmail,
    sendStatusEmail: emailWrapper.sendStatusEmail,
    sendPaymentEmail: emailWrapper.sendPaymentEmail
});

export default NotificationService;