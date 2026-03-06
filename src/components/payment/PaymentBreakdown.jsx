// src/components/payment/PaymentBreakdown.jsx
import React, { useState, useEffect } from 'react';
import PaymentService from '../../utils/PaymentService'; // kept — used for getPaymentBreakdown (job data)
import { useSettings } from '../../context/SettingsContext';

// Customer-facing service fee has been removed entirely.
// This component now shows: Job Amount → Deposit → Platform Commission → Payment Schedule → Company Payout.
// The 5% provider commission shown here is deducted from provider payouts — NOT charged to the customer.

const Skeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
        <div className="h-16 bg-gray-100" />
        <div className="p-6 space-y-4">
            {[80, 60, 90, 70].map((w, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${w}%` }} />
            ))}
        </div>
    </div>
);

const PaymentBreakdown = ({ jobId, customerId, onPaymentCalculated }) => {
    const { getSetting } = useSettings();
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchPaymentBreakdown(); }, [jobId, customerId]);

    const fetchPaymentBreakdown = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await PaymentService.getPaymentBreakdown(jobId, customerId);
            if (result.success) {
                setBreakdown(result.breakdown);
                if (onPaymentCalculated) onPaymentCalculated(result.breakdown);
            } else {
                setError(result.message || 'Failed to calculate payment breakdown');
            }
        } catch (err) {
            console.error('Error fetching payment breakdown:', err);
            setError('An error occurred while calculating payment breakdown');
        } finally {
            setLoading(false);
        }
    };

    const currencySymbol = getSetting('currencySymbol') || '\u20a6';
    const fmt = (amount) => `${currencySymbol}${parseFloat(amount || 0).toLocaleString()}`;

    if (loading) return <Skeleton />;

    if (error) return (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <div>
                    <p className="font-semibold text-red-800 text-sm">Calculation Error</p>
                    <p className="text-red-600 text-xs mt-0.5">{error}</p>
                    <button onClick={fetchPaymentBreakdown} className="mt-2 text-xs font-semibold text-red-700 hover:text-red-900 underline">Try again</button>
                </div>
            </div>
        </div>
    );

    if (!breakdown) return (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="text-amber-700 text-sm">No payment breakdown available.</p>
        </div>
    );

    // Guard all sub-properties with optional chaining to prevent runtime throws
    const depositAmt = breakdown?.deposit?.amount ?? 0;
    const depositPct = breakdown?.deposit?.percentage ?? 50;
    const commissionPct = breakdown?.platformCommission?.percentage ?? 5;
    const commissionAmt = breakdown?.platformCommission?.amount ?? 0;
    const totalDueNow = breakdown?.totals?.totalDueNow ?? 0;
    const finalDue = breakdown?.totals?.finalPaymentDue ?? 0;
    const companyPayout = breakdown?.companyPayout?.amount ?? 0;
    const schedule = Array.isArray(breakdown?.paymentSchedule) ? breakdown.paymentSchedule : [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Payment Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Complete cost analysis</p>
            </div>

            <div className="p-5 space-y-5">

                {/* Job Amount */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-0.5">Total Job Amount</p>
                        <p className="text-xs text-gray-400">Quoted by the service provider</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{fmt(breakdown?.jobAmount)}</p>
                </div>

                {/* Deposit */}
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Deposit ({depositPct}%)</p>
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div>
                            <p className="font-semibold text-blue-800 text-sm">Deposit Amount</p>
                            <p className="text-xs text-blue-600 mt-0.5">Payable upfront to secure the job</p>
                        </div>
                        <p className="text-lg font-bold text-blue-800">{fmt(depositAmt)}</p>
                    </div>
                </div>

                {/* Platform Commission — deducted from provider payout, not charged to customer */}
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Platform Commission</p>
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <div>
                            <p className="font-semibold text-amber-800 text-sm">{commissionPct}% Commission</p>
                            <p className="text-xs text-amber-600 mt-0.5">Deducted from the provider's payout — not charged to you</p>
                        </div>
                        <p className="text-lg font-bold text-amber-800">{fmt(commissionAmt)}</p>
                    </div>
                </div>

                {/* Payment Schedule */}
                {schedule.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Payment Schedule</p>
                        <div className="space-y-2">
                            {schedule.map((stage, i) => (
                                <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="font-semibold text-gray-800 text-sm">{stage?.stage || `Stage ${i + 1}`}</p>
                                        <p className="font-bold text-gray-900 text-sm">{fmt(stage?.total)}</p>
                                    </div>
                                    {Array.isArray(stage?.items) && (
                                        <div className="space-y-1.5">
                                            {stage.items.map((item, j) => (
                                                <div key={j} className="flex justify-between text-xs">
                                                    <span className="text-gray-600">{item?.label}</span>
                                                    <span className="font-medium text-gray-700">{fmt(item?.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary */}
                <div className="bg-gray-900 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                        <p className="text-white font-bold text-sm">Summary</p>
                    </div>
                    <div className="p-5 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/70">Deposit ({depositPct}%)</span>
                            <span className="text-white font-medium">{fmt(depositAmt)}</span>
                        </div>
                        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                            <span className="text-white font-bold">Due Now</span>
                            <span className="text-2xl font-bold text-emerald-400">{fmt(totalDueNow)}</span>
                        </div>
                        <div className="pt-3 border-t border-white/10">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Final payment (on completion)</span>
                                <span className="text-white/70 font-medium">{fmt(finalDue)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Provider Payout */}
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div>
                        <p className="font-semibold text-gray-800 text-sm">Provider Receives</p>
                        <p className="text-xs text-gray-500 mt-0.5">Job amount minus {commissionPct}% platform commission</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{fmt(companyPayout)}</p>
                </div>

                {/* Legend */}
                <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Legend</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { color: 'bg-blue-500', label: 'Customer Payment' },
                            { color: 'bg-amber-500', label: 'Platform Commission' },
                            { color: 'bg-gray-600', label: 'Provider Receives' },
                        ].map(({ color, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                                <span className="text-xs text-gray-500">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PaymentBreakdown;