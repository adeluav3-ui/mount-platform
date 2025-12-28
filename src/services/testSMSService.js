// Simple test - add this temporarily to a page or run in console
import smsService from './SMSService';

// Test function
const testSMSService = async () => {
    console.log('Testing SendChamp SMS Service...');

    // 1. Test phone number formatting
    const testNumber = '08012345678';
    const formatted = smsService.formatPhoneNumber(testNumber);
    console.log('Phone formatting:', testNumber, '→', formatted);

    // 2. Test getting balance (requires valid API key)
    const balance = await smsService.getBalance();
    console.log('Account balance:', balance);

    // 3. Test sending SMS (optional - will cost money)
    // Uncomment only when ready to test with real SMS
    /*
    const smsResult = await smsService.sendSMS(
        '07019609312', // Your test phone number
        'Mount Platform: SMS test successful! Your notification system is ready.'
    );
    console.log('SMS send result:', smsResult);
    */

    return balance;
};

// Run test if in browser
if (typeof window !== 'undefined') {
    window.testSMSService = testSMSService;
}

export { testSMSService };