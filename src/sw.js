// Listen for push notifications
self.addEventListener('push', event => {
    const data = event.data?.json() || { title: 'New Job Alert!', body: 'You have a new job request' };

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icons/logo192.png',
            badge: '/icons/logo192.png',
            tag: 'job-alert',
            data: data.url || '/company/dashboard'
        })
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Focus existing window or open new one
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data || '/');
                }
            })
    );

    // In your sw.js file, add:
    self.addEventListener('push', function (event) {
        console.log('🔔 Push event received:', event);

        const data = event.data ? event.data.json() : {};
        const title = data.title || 'Mount Platform';
        const options = {
            body: data.body || 'You have a new notification',
            icon: data.icon || '/logo.png',
            badge: data.badge || '/logo.png',
            tag: data.tag || 'mount-notification',
            data: data.data || {},
            vibrate: [200, 100, 200],
            requireInteraction: true // So it stays visible
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    });

    self.addEventListener('notificationclick', function (event) {
        console.log('Notification clicked:', event.notification.tag);
        event.notification.close();

        const urlToOpen = event.notification.data.url || '/company/dashboard';

        event.waitUntil(
            clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then(function (clientList) {
                // Check if there's already a window open
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Otherwise open a new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
        );
    });
});