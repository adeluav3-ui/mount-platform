// src/services/MobileOneSignalFix.js
export class MobileOneSignalFix {

    static async initializeOneSignal() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log(`${isMobile ? '📱' : '💻'} Initializing OneSignal...`);

        // Clear any previous OneSignal instances
        if (window.OneSignal) {
            delete window.OneSignal;
        }
        if (window._OneSignal) {
            delete window._OneSignal;
        }

        // Load OneSignal SDK fresh
        await this.loadOneSignalSDK();

        // Initialize OneSignal
        return await this.initOneSignalSDK();
    }

    static async loadOneSignalSDK() {
        return new Promise((resolve) => {
            // Check if already loading
            if (window.OneSignalLoading) {
                console.log('OneSignal SDK already loading...');
                return resolve(false);
            }

            console.log('Loading OneSignal SDK...');
            window.OneSignalLoading = true;

            // Remove any existing OneSignal scripts
            const existingScripts = document.querySelectorAll('script[src*="onesignal.com"]');
            existingScripts.forEach(script => script.remove());

            const script = document.createElement('script');
            script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
            script.async = true;
            script.onload = () => {
                console.log('✅ OneSignal SDK loaded');
                window.OneSignalLoading = false;
                resolve(true);
            };
            script.onerror = () => {
                console.error('❌ Failed to load OneSignal SDK');
                window.OneSignalLoading = false;
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }

    static async initOneSignalSDK() {
        return new Promise((resolve) => {
            console.log('Initializing OneSignal SDK...');

            // Set a timeout
            const timeout = setTimeout(() => {
                console.warn('⚠️ OneSignal initialization timeout');
                resolve(false);
            }, 10000);

            // Initialize OneSignal
            window.OneSignal = window.OneSignal || [];

            // Push initialization to queue
            OneSignal.push(function () {
                console.log('OneSignal push function called');

                OneSignal.init({
                    appId: "0186919f-3891-40a5-81b6-c9e70634bdef",
                    safari_web_id: "",
                    notifyButton: {
                        enable: false,
                    },
                    allowLocalhostAsSecureOrigin: true,
                    autoResubscribe: true,
                    persistNotification: true,

                    // MOBILE-SPECIFIC SETTINGS
                    promptOptions: {
                        slidedown: {
                            prompts: [
                                {
                                    type: "push", // Prompt for push notifications
                                    autoPrompt: true,
                                    text: {
                                        /* Your custom messages */
                                        actionMessage: "We'd like to show you notifications for new jobs.",
                                        acceptButton: "Allow",
                                        cancelButton: "Not now"
                                    }
                                }
                            ]
                        }
                    }
                }, {
                    // Important for Android Chrome
                    httpPermissionRequest: {
                        enable: true
                    }
                });

                console.log('OneSignal.init() called');

                // Check if initialized successfully
                setTimeout(() => {
                    clearTimeout(timeout);

                    // Check if User object is available
                    if (window.OneSignal && window.OneSignal.User) {
                        console.log('✅ OneSignal User object available');
                        resolve(true);
                    } else {
                        console.log('⚠️ OneSignal User object not available');
                        resolve(false);
                    }
                }, 3000);
            });
        });
    }

    static async forceUserObject() {
        console.log('🔧 Forcing OneSignal User object...');

        // Try multiple approaches to get User object

        // Approach 1: Try to get subscription directly
        try {
            const oneSignal = window.OneSignal || window._OneSignal;
            if (oneSignal && oneSignal.getUserId) {
                const userId = await oneSignal.getUserId();
                console.log('Got User ID via getUserId():', userId);
                return userId;
            }
        } catch (error) {
            console.log('getUserId() failed:', error);
        }

        // Approach 2: Try to trigger a subscription
        try {
            const oneSignal = window.OneSignal || window._OneSignal;
            if (oneSignal && oneSignal.registerForPushNotifications) {
                console.log('Trying registerForPushNotifications...');
                await oneSignal.registerForPushNotifications();

                // Wait and check
                await new Promise(resolve => setTimeout(resolve, 3000));

                if (oneSignal.User && oneSignal.User.PushSubscription) {
                    const playerId = await oneSignal.User.PushSubscription.id;
                    console.log('Got Player ID after register:', playerId);
                    return playerId;
                }
            }
        } catch (error) {
            console.log('registerForPushNotifications failed:', error);
        }

        // Approach 3: Show slidedown
        try {
            const oneSignal = window.OneSignal || window._OneSignal;
            if (oneSignal && oneSignal.showSlidedown) {
                console.log('Showing slidedown...');
                oneSignal.showSlidedown();
                return null;
            }
        } catch (error) {
            console.log('showSlidedown failed:', error);
        }

        console.log('❌ All approaches failed');
        return null;
    }

    static async getPlayerIdWithRetry(maxAttempts = 5) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔄 Attempt ${attempt}/${maxAttempts} to get Player ID`);

            try {
                const oneSignal = window.OneSignal || window._OneSignal;

                if (!oneSignal) {
                    console.log('OneSignal not available, reloading SDK...');
                    await this.loadOneSignalSDK();
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }

                // Try to get User object
                if (oneSignal.User && oneSignal.User.PushSubscription) {
                    const playerId = await oneSignal.User.PushSubscription.id;
                    if (playerId) {
                        console.log('✅ Got Player ID:', playerId);
                        return playerId;
                    }
                }

                // If no User object, try to force it
                console.log('User object not available, forcing...');
                const playerId = await this.forceUserObject();
                if (playerId) {
                    return playerId;
                }

                // Wait before next attempt
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));

            } catch (error) {
                console.error(`Attempt ${attempt} error:`, error);
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
            }
        }

        console.error(`❌ Failed to get Player ID after ${maxAttempts} attempts`);
        return null;
    }
}