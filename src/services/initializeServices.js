// src/services/initializeServices.js
import * as emailWrapper from './emailWrapper.js';
import NotificationService from './NotificationService.js';

console.log('🚀 Initializing services...');

// Initialize NotificationService with email functions
NotificationService.initialize({
    sendNewJobEmail: emailWrapper.sendNewJobEmail,
    sendAdminNewJobEmail: emailWrapper.sendAdminNewJobEmail
});

console.log('✅ Services initialized successfully');

export default NotificationService;