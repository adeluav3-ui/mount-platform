// src/components/payment/PaymentSuccess.jsx
// Customer lands here after completing Monnify checkout.
// Monnify redirects to: /payment/success?paymentReference=MT-xxx&status=PAID
// We show a success/pending screen and redirect to dashboard.

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;

const PAYMENT_LABELS = {
    deposit: 'Deposit (50%)',
    intermediate: 'Intermediate (30%)',
    final_payment: 'Final Payment',
};

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [paymentInfo, setPaymentInfo] = useState(null);

    const status = searchParams.get('status') || searchParams.get('paymentStatus');
    const paymentRef = searchParams.get('paymentReference');
    const transactionRef = searchParams.get('transactionReference');
    const isPaid = status === 'PAID' || status === 'paid';

    useEffect(() => {
        // Read stored payment info from sessionStorage
        try {
            const stored = sessionStorage.getItem('mountPayment');
            if (stored) {
                setPaymentInfo(JSON.parse(stored));
                sessionStorage.removeItem('mountPayment');
            }
        } catch { /* ignore */ }

        // Auto-redirect to dashboard after 6 seconds
        const timer = setTimeout(() => {
            navigate('/dashboard', { replace: true });
        }, 6000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm overflow-hidden">

                {/* Header */}
                <div className={`px-6 py-8 text-center ${isPaid ? 'bg-gradient-to-br from-naijaGreen to-darkGreen' : 'bg-gradient-to-br from-amber-500 to-amber-600'}`}>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                        {isPaid ? '✅' : '⏳'}
                    </div>
                    <h1 className="text-2xl font-bold text-white">
                        {isPaid ? 'Payment Successful!' : 'Payment Pending'}
                    </h1>
                    <p className="text-white/70 text-sm mt-1">
                        {isPaid
                            ? 'Your payment has been confirmed'
                            : 'Your payment is being processed'}
                    </p>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                    {paymentInfo && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                            {paymentInfo.paymentType && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment type</span>
                                    <span className="font-semibold text-gray-800">
                                        {PAYMENT_LABELS[paymentInfo.paymentType] || paymentInfo.paymentType}
                                    </span>
                                </div>
                            )}
                            {paymentInfo.companyName && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Provider</span>
                                    <span className="font-semibold text-gray-800">{paymentInfo.companyName}</span>
                                </div>
                            )}
                            {paymentInfo.amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount paid</span>
                                    <span className="font-bold text-naijaGreen">{fmt(paymentInfo.amount)}</span>
                                </div>
                            )}
                            {paymentInfo.creditUsed > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Credit applied</span>
                                    <span className="font-semibold text-purple-600">− {fmt(paymentInfo.creditUsed)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {(paymentRef || transactionRef) && (
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-400 mb-1">Reference</p>
                            <p className="font-mono text-xs text-gray-700 break-all">{paymentRef || transactionRef}</p>
                        </div>
                    )}

                    {isPaid ? (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700 text-center">
                            Your job status has been updated automatically.
                        </div>
                    ) : (
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-700 text-center">
                            Once your payment clears, your job status will update automatically.
                        </div>
                    )}

                    <p className="text-xs text-gray-400 text-center">
                        Redirecting to dashboard in a few seconds…
                    </p>

                    <button
                        onClick={() => navigate('/dashboard', { replace: true })}
                        className="w-full py-3 bg-naijaGreen text-white rounded-xl font-bold text-sm hover:bg-darkGreen transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
