// src/services/initializeServices.js
import * as emailWrapper from './emailWrapper.js';
import NotificationService from './NotificationService.js';

console.log('🚀 Initializing services...');

// Initialize NotificationService with email functions
NotificationService.initialize({
    sendNewJobEmail: emailWrapper.sendNewJobEmail,
});

console.log('✅ Services initialized successfully');

export default NotificationService;