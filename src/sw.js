// Mount Platform Service Worker
// Version: 1.0.0

console.log('✅ Mount Platform Service Worker installed');

// Listen for push notifications from OneSignal
self.addEventListener('push', event => {
    console.log('🔔 Push event received:', event);

    try {
        let data;

        if (event.data) {
            try {
                data = event.data.json();
                console.log('📦 Push data:', data);
            } catch (jsonError) {
                console.log('📦 Push data (text):', event.data.text());
                data = { title: 'Mount Platform', body: event.data.text() };
            }
        } else {
            data = {
                title: 'New Job Alert!',
                body: 'You have a new job request'
            };
        }

        const title = data.title || 'Mount Platform';
        const options = {
            body: data.body || 'You have a new notification',
            icon: data.icon || '/icons/logo192.png',
            badge: data.badge || '/icons/logo192.png',
            tag: data.tag || 'mount-notification',
            data: data.data || { url: '/company/dashboard' },
            vibrate: [200, 100, 200],
            requireInteraction: true
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (error) {
        console.error('❌ Error handling push event:', error);
    }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    console.log('🎯 Notification clicked:', event.notification.tag);
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/company/dashboard';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(clientList => {
            // Try to focus existing window
            for (const client of clientList) {
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }

            // Otherwise open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Listen for activate event
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker activated');

    // Claim clients immediately
    event.waitUntil(clients.claim());
});

// Listen for install event
self.addEventListener('install', event => {
    console.log('⚙️ Service Worker installing');

    // Skip waiting to activate immediately
    self.skipWaiting();
});