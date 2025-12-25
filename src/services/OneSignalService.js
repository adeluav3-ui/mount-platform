// src/services/OneSignalService.js - SIMPLIFIED VERSION
class OneSignalService {
    static async initialize(userId) {
        try {
            console.log('🔔 Starting OneSignal initialization');

            // Wait for global OneSignal
            if (!window.OneSignal) {
                console.log('⏳ Waiting for OneSignal to load...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            if (!window.OneSignal) {
                console.error('❌ OneSignal not available');
                return false;
            }

            console.log('✅ OneSignal is available');

            // Set external user ID if provided
            if (userId && window.OneSignal.setExternalUserId) {
                await window.OneSignal.setExternalUserId(userId);
                console.log('✅ Set user ID:', userId);
            }

            // Check subscription status
            const playerId = await this.getPlayerId();
            console.log('📱 Player ID:', playerId);

            return true;

        } catch (error) {
            console.error('❌ OneSignal error:', error);
            return false;
        }
    }

    static async getPlayerId() {
        try {
            if (!window.OneSignal) return null;

            // Try to get player ID
            return await new Promise((resolve) => {
                if (window.OneSignal.getUserId) {
                    window.OneSignal.getUserId(resolve);
                } else {
                    resolve(null);
                }
            });
        } catch (error) {
            console.error('Error getting player ID:', error);
            return null;
        }
    }
}

export default OneSignalService;