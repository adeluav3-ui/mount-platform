// payment-proxy/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Flutterwave verification endpoint
app.post('/verify-payment', async (req, res) => {
    console.log('🔔 /verify-payment route was hit!');
    console.log('📦 Request body:', req.body);
    console.log('📦 Headers:', req.headers);

    const { transaction_id } = req.body;

    if (!transaction_id) {
        console.log('❌ No transaction_id provided');
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    console.log(`🔍 Looking up transaction: ${transaction_id}`);

    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

    // Check if secret key is configured
    if (!FLUTTERWAVE_SECRET_KEY) {
        console.error('❌ FLUTTERWAVE_SECRET_KEY is not set in .env file');
        return res.status(500).json({
            error: 'Server configuration error',
            message: 'Flutterwave secret key is missing'
        });
    }

    console.log('✅ Flutterwave key found (starts with):', FLUTTERWAVE_SECRET_KEY.substring(0, 15) + '...');

    try {
        // Using the correct Flutterwave API endpoint
        // Option 1: Using transaction ID (txid) - Most reliable
        const response = await fetch(
            `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Flutterwave API error (${response.status}):`, errorText);
            throw new Error(`Flutterwave API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Flutterwave response status:', data.status || 'no status');
        console.log('✅ Transaction status:', data.data?.status || 'no data');

        res.json(data);
    } catch (error) {
        console.error('❌ Verification error:', error.message);
        res.status(400).json({
            error: error.message,
            status: 'error',
            message: 'Failed to verify payment with Flutterwave'
        });
    }
});

// Test endpoint
app.post('/test', (req, res) => {
    console.log('✅ Test route hit! Body:', req.body);
    res.json({
        message: 'Test successful',
        receivedBody: req.body,
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Payment Proxy' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Payment proxy running on http://localhost:${PORT}`);
    console.log(`📌 Endpoints:`);
    console.log(`   POST http://localhost:${PORT}/verify-payment`);
    console.log(`   POST http://localhost:${PORT}/test`);
    console.log(`   GET  http://localhost:${PORT}/health`);
});