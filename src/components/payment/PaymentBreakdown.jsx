// src/components/payment/PaymentBreakdown.jsx - ENHANCED VERSION
import React, { useState, useEffect } from 'react';
import PaymentService from '../../utils/PaymentService';
import { useSettings } from '../../context/SettingsContext';

const PaymentBreakdown = ({ jobId, customerId, onPaymentCalculated }) => {
    const { getSetting } = useSettings();
    const [breakdown, setBreakdown] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [promotionStatus, setPromotionStatus] = useState(null);

    useEffect(() => {
        fetchPaymentBreakdown();
    }, [jobId, customerId]);

    const fetchPaymentBreakdown = async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await PaymentService.getPaymentBreakdown(jobId, customerId);

            if (result.success) {
                setBreakdown(result.breakdown);

                // Check promotion status
                if (customerId) {
                    const promotionResult = await PaymentService.checkCustomerPromotionStatus(customerId);
                    setPromotionStatus(promotionResult);
                }

                // Notify parent component
                if (onPaymentCalculated) {
                    onPaymentCalculated(result.breakdown);
                }
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

    const currencySymbol = getSetting('currencySymbol') || '₦';
    const promotionMonths = getSetting('promotionPeriodMonths') || 3;

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-100 rounded-xl p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 font-medium">Error: {error}</p>
                <button
                    onClick={fetchPaymentBreakdown}
                    className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    if (!breakdown) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-700">No payment breakdown available.</p>
            </div>
        );
    }

    const formatCurrency = (amount) => {
        return `${currencySymbol}${parseFloat(amount || 0).toLocaleString()}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Payment Breakdown</h3>
                        <p className="text-sm text-gray-600">Complete cost analysis</p>
                    </div>
                    {promotionStatus?.isInPromotion && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            🎉 {promotionMonths}-Month Promotion
                        </span>
                    )}
                </div>
            </div>

            {/* Promotion Banner */}
            {promotionStatus && (
                <div className={`px-6 py-3 border-b ${promotionStatus.isInPromotion
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'}`}
                >
                    <div className="flex items-center gap-3">
                        {promotionStatus.isInPromotion ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600 font-bold">✓</span>
                                </div>
                                <div>
                                    <p className="font-medium text-green-800">Service Fee Waived!</p>
                                    <p className="text-sm text-green-600">
                                        Enjoying your {promotionMonths}-month promotion period
                                        {promotionStatus.promotionEndDate && (
                                            <> until {new Date(promotionStatus.promotionEndDate).toLocaleDateString()}</>
                                        )}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-600 font-bold">$</span>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Standard Service Fee Applies</p>
                                    <p className="text-sm text-gray-600">
                                        {promotionStatus.message || 'Promotion period has ended'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-6">
                {/* Job Amount */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700 font-medium">Job Amount</span>
                        <span className="text-2xl font-bold text-gray-900">
                            {formatCurrency(breakdown.jobAmount)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">Total cost for the service (quoted by company)</p>
                </div>

                {/* Deposit */}
                <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-800">
                        Deposit ({breakdown.deposit.percentage}%)
                    </h4>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-green-800">Deposit Amount</span>
                            <span className="font-semibold text-green-800">
                                {formatCurrency(breakdown.deposit.amount)}
                            </span>
                        </div>
                        <p className="text-sm text-green-600">
                            Payable upfront to secure the job
                        </p>
                    </div>
                </div>

                {/* Service Fee */}
                <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-800">
                        Platform Service Fee {breakdown.serviceFee.isWaived ? '(Waived)' : ''}
                    </h4>
                    <div className={`rounded-xl p-4 border ${breakdown.serviceFee.isWaived
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'}`}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className={breakdown.serviceFee.isWaived
                                ? 'text-green-800'
                                : 'text-blue-800'}>
                                {breakdown.serviceFee.isWaived ? 'Fee Waived' : 'Service Fee'}
                            </span>
                            <span className={`font-semibold ${breakdown.serviceFee.isWaived
                                ? 'text-green-600 line-through'
                                : 'text-blue-800'}`}>
                                {formatCurrency(breakdown.serviceFee.amount)}
                            </span>
                        </div>
                        <p className={`text-sm ${breakdown.serviceFee.isWaived
                            ? 'text-green-600'
                            : 'text-blue-600'}`}>
                            {breakdown.serviceFee.description}
                        </p>
                    </div>
                </div>

                {/* Platform Commission */}
                <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-800">Platform Commission</h4>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-purple-800">
                                {breakdown.platformCommission.percentage}% Platform Commission
                            </span>
                            <span className="font-semibold text-purple-800">
                                {formatCurrency(breakdown.platformCommission.amount)}
                            </span>
                        </div>
                        <p className="text-sm text-purple-600">
                            Deducted from company's payout
                        </p>
                    </div>
                </div>

                {/* Payment Schedule */}
                <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-800">Payment Schedule</h4>
                    {breakdown.paymentSchedule.map((stage, index) => (
                        <div key={index} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-medium text-gray-800">{stage.stage}</span>
                                <span className="font-bold text-gray-900">
                                    {formatCurrency(stage.total)}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {stage.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex justify-between text-sm">
                                        <span className={`${item.waived ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                            {item.label}
                                            {item.waived && ' (Waived)'}
                                        </span>
                                        <span className={item.waived ? 'line-through text-gray-500' : 'font-medium text-gray-800'}>
                                            {formatCurrency(item.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals Section */}
                <div className="bg-gray-900 rounded-xl p-6">
                    <h4 className="text-white font-medium mb-4">Payment Summary</h4>

                    <div className="space-y-3 mb-4">
                        {/* Amounts Due Now */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-white">
                                <span>Deposit ({breakdown.deposit.percentage}%)</span>
                                <span>{formatCurrency(breakdown.deposit.amount)}</span>
                            </div>
                            {!breakdown.serviceFee.isWaived && (
                                <div className="flex justify-between text-white">
                                    <span>Service Fee</span>
                                    <span>{formatCurrency(breakdown.serviceFee.amount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-700 pt-3">
                            <div className="flex justify-between items-center">
                                <span className="text-white font-medium">Total Due Now</span>
                                <span className="text-xl font-bold text-green-400">
                                    {formatCurrency(breakdown.totals.totalDueNow)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Future Payments */}
                    <div className="mt-6 pt-4 border-t border-gray-700">
                        <p className="text-gray-300 text-sm mb-2">Future Payment (upon completion):</p>
                        <div className="flex justify-between text-white">
                            <span>Final Payment</span>
                            <span>{formatCurrency(breakdown.totals.finalPaymentDue)}</span>
                        </div>
                    </div>
                </div>

                {/* Company Payout Info */}
                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 mb-1">Company receives after completion:</p>
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">Company Payout</span>
                        <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(breakdown.companyPayout.amount)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        (Job amount minus {breakdown.platformCommission.percentage}% platform commission)
                    </p>
                </div>

                {/* Legend */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Legend:</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-xs text-gray-600">Customer Payment</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span className="text-xs text-gray-600">Service Fee</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                            <span className="text-xs text-gray-600">Platform Commission</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                            <span className="text-xs text-gray-600">Company Receives</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentBreakdown;