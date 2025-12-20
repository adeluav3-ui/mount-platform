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
});