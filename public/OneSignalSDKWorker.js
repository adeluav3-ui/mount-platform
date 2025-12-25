importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// Notification click handler
self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click received:', event);

    event.notification.close();

    // Get the URL from notification data or use default
    const urlToOpen = event.notification.data.url || 'https://mountltd.com/dashboard';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (clientList) {
            // Check if there's already a window/tab open with our app
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no existing window, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});