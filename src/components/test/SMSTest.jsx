// src/components/test/SMSTest.jsx
import React, { useState } from 'react';
import smsService from '../../services/SMSService';

const SMSTest = () => {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('Test SMS from Mount Platform');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [balance, setBalance] = useState(null);

    const handleSendTest = async () => {
        setLoading(true);
        setResult(null);
        
        const response = await smsService.sendSMS(
            phone,
            message
        );
        
        setResult(response);
        setLoading(false);
    };

    const handleCheckBalance = async () => {
        const response = await smsService.getBalance();
        setBalance(response);
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">SMS Service Test</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Phone Number:
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08031234567"
                        className="w-full p-2 border rounded"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Message:
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows="3"
                    />
                </div>
                
                <button
                    onClick={handleSendTest}
                    disabled={loading || !phone}
                    className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-50"
                >
                    {loading ? 'Sending...' : 'Send Test SMS'}
                </button>
                
                <button
                    onClick={handleCheckBalance}
                    className="w-full bg-blue-600 text-white py-2 rounded"
                >
                    Check Account Balance
                </button>
                
                {result && (
                    <div className={`p-3 rounded ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        <p className="font-semibold">
                            {result.success ? '✓ SMS Sent Successfully!' : '✗ SMS Failed'}
                        </p>
                        <p className="text-sm mt-1">
                            {result.success 
                                ? `Message ID: ${result.messageId}` 
                                : `Error: ${JSON.stringify(result.error)}`
                            }
                        </p>
                    </div>
                )}
                
                {balance && (
                    <div className="p-3 bg-blue-50 text-blue-700 rounded">
                        <p className="font-semibold">Account Balance:</p>
                        <p>{balance.balance} {balance.currency}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SMSTest;