// firebase-messaging-sw.js
importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// FCM Push Event Handler
self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received:', event);

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
            console.log('[Service Worker] Push data:', data);
        } catch (e) {
            console.log('[Service Worker] Push data (text):', event.data.text());
            data = {
                title: 'Mount Notification',
                body: event.data.text(),
                icon: '/logo.png'
            };
        }
    }

    const title = data.title || data.headings?.en || 'Mount';
    const body = data.body || data.contents?.en || 'New notification';
    const icon = data.icon || '/logo.png';
    const badge = '/logo.png';
    const tag = data.tag || 'general';
    const url = data.url || data.data?.url || '/';

    const options = {
        body: body,
        icon: icon,
        badge: badge,
        tag: tag,
        data: {
            url: url,
            ...(data.data || {})
        },
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: data.actions || [
            {
                action: 'view',
                title: 'View'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Mount',
            {
                body: data.body || data.contents?.en || 'New notification',
                icon: data.icon || '/logo.png',
                badge: '/logo.png',
                data: data.data || {},
                requireInteraction: true,
                vibrate: [200, 100, 200]
            }
        )
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click:', event.notification.tag);

    event.notification.close();

    const url = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (windowClients) {
            // Check if there's already a tab open with this URL
            for (let client of windowClients) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }

            // If not, open a new tab
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

// Service Worker Activation
self.addEventListener('activate', function (event) {
    console.log('[Service Worker] Activated');
    event.waitUntil(clients.claim());
});