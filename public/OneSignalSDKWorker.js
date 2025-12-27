// OneSignalSDKWorker.js
importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Additional FCM handling
self.addEventListener('push', function (event) {
    console.log('[OneSignal Worker] Push event received');

    // Let OneSignal handle it
    event.waitUntil(
        self.registration.showNotification('Mount', {
            body: 'Loading...',
            icon: '/logo.png',
            badge: '/logo.png'
        }).then(() => {
            // OneSignal will replace this with actual notification
            return new Promise(resolve => setTimeout(resolve, 100));
        })
    );
});