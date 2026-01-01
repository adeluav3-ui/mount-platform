// api/whatsapp-webhook.js (in your project root, not src/)
export default async function handler(req, res) {
    console.log('🔔 WhatsApp Webhook Called:', {
        method: req.method,
        query: req.query,
        body: req.body ? 'Has body' : 'No body'
    });

    // Facebook verification challenge
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('🔍 Verification attempt:', { mode, token, challenge });

        // Your verify token from WhatsApp setup
        const VERIFY_TOKEN = 'mount_verify_token_123';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully!');
            return res.status(200).send(challenge);
        }

        console.log('❌ Verification failed:', {
            expected: VERIFY_TOKEN,
            received: token
        });
        return res.status(403).send('Invalid verification token');
    }

    // Handle incoming messages (POST requests)
    if (req.method === 'POST') {
        console.log('📱 WhatsApp message received:', JSON.stringify(req.body, null, 2));
        return res.status(200).send('OK');
    }

    return res.status(405).send('Method not allowed');
}