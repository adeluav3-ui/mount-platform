// src/pages/api/whatsapp-webhook.js
export default async function handler(req, res) {
    // Facebook verification
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === 'mount_verify_123') {
            console.log('✅ Webhook verified');
            return res.status(200).send(challenge);
        }

        return res.status(403).send('Invalid verification token');
    }

    // Handle incoming messages
    if (req.method === 'POST') {
        console.log('📱 WhatsApp Webhook received:', req.body);

        // Process messages here later
        return res.status(200).send('OK');
    }

    res.status(405).send('Method not allowed');
}