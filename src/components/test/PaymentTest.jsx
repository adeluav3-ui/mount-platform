// src/components/test/PaymentTest.jsx - COMPLETE VERSION
import React, { useState } from 'react';
import { supabase } from '../../context/SupabaseContext';
import PaymentService from '../../utils/PaymentService';

const PaymentTest = () => {
    const [testResult, setTestResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refTestResult, setRefTestResult] = useState(null);
    const [jobId, setJobId] = useState('');
    const [paymentRef, setPaymentRef] = useState('');

    // Test 1: Original database connection test
    const runConnectionTest = async () => {
        setLoading(true);
        const result = await PaymentService.testConnection();
        setTestResult(result);
        setLoading(false);
    };

    // Test 2: Reference generation
    const runReferenceTest = () => {
        const ref = PaymentService.generateReference('TEST');
        setRefTestResult({
            success: true,
            message: `Generated reference: ${ref}`,
            reference: ref
        });
        setPaymentRef(ref); // Auto-fill for next test
    };

    // Test 3: Update job with payment reference
    const runUpdateJobTest = async () => {
        if (!jobId.trim()) {
            setTestResult({
                success: false,
                message: 'Please enter a Job ID first'
            });
            return;
        }

        setLoading(true);
        const reference = PaymentService.generateReference('JOB');
        const metadata = {
            test: true,
            timestamp: new Date().toISOString(),
            amount: 50000
        };

        const result = await PaymentService.updateJobWithPaymentReference(
            jobId,
            reference,
            metadata
        );

        setTestResult(result);
        setPaymentRef(reference); // Save for next test
        setLoading(false);
    };

    // Test 4: Verify payment (simulate deposit)
    const runVerifyPaymentTest = async () => {
        if (!paymentRef.trim()) {
            setTestResult({
                success: false,
                message: 'Please generate a payment reference first'
            });
            return;
        }

        setLoading(true);
        const result = await PaymentService.verifyPaymentAndUpdateJob(
            paymentRef,
            'deposit'
        );

        setTestResult(result);
        setLoading(false);
    };

    // Test 5: Distribute earnings (simulate final payment)
    const runDistributeEarningsTest = async () => {
        if (!jobId.trim()) {
            setTestResult({
                success: false,
                message: 'Please enter a Job ID first'
            });
            return;
        }

        setLoading(true);
        const result = await PaymentService.distributeEarnings(jobId);
        setTestResult(result);
        setLoading(false);
    };

    // DEBUG 1: Check job details
    const runCheckJobDetails = async () => {
        if (!jobId.trim()) {
            setTestResult({
                success: false,
                message: 'Please enter a Job ID first'
            });
            return;
        }

        setLoading(true);
        const result = await PaymentService.getJobDetails(jobId);
        setTestResult(result);
        setLoading(false);
    };

    // DEBUG 2: Find job by payment reference
    const runDebugJobTest = async () => {
        if (!paymentRef.trim()) {
            setTestResult({
                success: false,
                message: 'Please generate a payment reference first'
            });
            return;
        }

        setLoading(true);

        try {
            // Debug: Check what jobs have this reference
            const result = await PaymentService.findJobsByPaymentReference(paymentRef);

            if (result.success) {
                setTestResult({
                    success: true,
                    message: result.message,
                    debugData: result.jobs,
                    count: result.count
                });
            } else {
                setTestResult(result);
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Debug query failed',
                error: error.message
            });
        }

        setLoading(false);
    };

    // DEBUG 3: Check payment breakdown calculation
    const runPaymentBreakdownTest = () => {
        const amount = 50000; // Test amount
        const breakdown = PaymentService.calculatePaymentBreakdown(amount);

        setTestResult({
            success: true,
            message: `Payment breakdown for ₦${amount.toLocaleString()}`,
            breakdown: breakdown,
            details: {
                total: `₦${breakdown.total.toLocaleString()}`,
                deposit: `₦${breakdown.deposit.toLocaleString()}`,
                finalPayment: `₦${breakdown.finalPayment.toLocaleString()}`,
                platformFee: `₦${breakdown.platformFee.toLocaleString()}`,
                companyPayout: `₦${breakdown.companyPayout.toLocaleString()}`
            }
        });
    };

    // DEBUG 4: Manually check job in database
    const runManualJobCheck = async () => {
        if (!jobId.trim()) {
            setTestResult({
                success: false,
                message: 'Please enter a Job ID first'
            });
            return;
        }

        setLoading(true);
        try {
            const { data: job, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;

            setTestResult({
                success: true,
                message: `Job ${jobId} details:`,
                job: job,
                status: job.status,
                quotedPrice: job.quoted_price,
                paymentReference: job.payment_reference,
                hasQuotedPrice: !!job.quoted_price,
                isReadyForPayment: job.quoted_price && job.status === 'price_set'
            });
        } catch (error) {
            setTestResult({
                success: false,
                message: 'Failed to fetch job',
                error: error.message
            });
        }
        setLoading(false);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Payment Service Test Suite</h2>

            {/* Input for Job ID */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Job ID (required for most tests)
                </label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={jobId}
                        onChange={(e) => setJobId(e.target.value)}
                        placeholder="Enter a real job ID from your database"
                        className="flex-1 p-3 border border-gray-300 rounded-lg"
                    />
                    <button
                        onClick={runManualJobCheck}
                        disabled={loading || !jobId}
                        className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                        Check Job
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Get a job ID from your Supabase jobs table
                </p>
            </div>

            {/* Payment Reference Display */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Payment Reference
                </label>
                <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Will be auto-filled after generating reference"
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                />
            </div>

            {/* Test Buttons - MAIN TESTS */}
            <div className="mb-8">
                <h3 className="font-semibold mb-3 text-gray-700">Core Payment Tests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={runConnectionTest}
                        disabled={loading}
                        className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                        Test 1: Database Connection
                    </button>

                    <button
                        onClick={runReferenceTest}
                        className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        Test 2: Generate Reference
                    </button>

                    <button
                        onClick={runUpdateJobTest}
                        disabled={loading || !jobId}
                        className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                    >
                        Test 3: Update Job with Payment
                    </button>

                    <button
                        onClick={runVerifyPaymentTest}
                        disabled={loading || !paymentRef}
                        className="p-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                    >
                        Test 4: Verify Payment (Deposit)
                    </button>

                    <button
                        onClick={runDistributeEarningsTest}
                        disabled={loading || !jobId}
                        className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                        Test 5: Distribute Earnings
                    </button>
                </div>
            </div>

            {/* Debug Buttons */}
            <div className="mb-8">
                <h3 className="font-semibold mb-3 text-gray-700">Debug & Helper Tests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                        onClick={runCheckJobDetails}
                        disabled={loading || !jobId}
                        className="p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                    >
                        Debug: Check Job Details
                    </button>

                    <button
                        onClick={runDebugJobTest}
                        disabled={loading || !paymentRef}
                        className="p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                        Debug: Find Job by Reference
                    </button>

                    <button
                        onClick={runPaymentBreakdownTest}
                        className="p-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                    >
                        Debug: Payment Breakdown
                    </button>

                    <button
                        onClick={runManualJobCheck}
                        disabled={loading || !jobId}
                        className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                        Debug: Manual Job Check
                    </button>
                </div>
            </div>

            {/* Results Display */}
            {testResult && (
                <div className={`p-4 rounded-lg mb-4 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                    <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {testResult.success ? '✅ Success' : '❌ Error'}
                    </p>
                    <p className="mt-1">{testResult.message}</p>

                    {testResult.reference && (
                        <div className="mt-2">
                            <p className="text-sm font-medium">Reference:</p>
                            <code className="inline-block bg-gray-100 px-2 py-1 rounded text-sm">
                                {testResult.reference}
                            </code>
                        </div>
                    )}

                    {testResult.error && (
                        <p className="mt-2 text-sm text-red-600">{testResult.error}</p>
                    )}

                    {testResult.job && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium">Job Details:</p>
                            <pre className="text-xs mt-1 overflow-auto">
                                {JSON.stringify(testResult.job, null, 2)}
                            </pre>
                        </div>
                    )}

                    {testResult.debugData && (
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="text-sm font-medium">Debug Data ({testResult.count} items):</p>
                            <pre className="text-xs mt-1 overflow-auto">
                                {JSON.stringify(testResult.debugData, null, 2)}
                            </pre>
                        </div>
                    )}

                    {testResult.breakdown && (
                        <div className="mt-3 p-3 bg-purple-50 rounded">
                            <p className="text-sm font-medium">Payment Breakdown:</p>
                            <div className="mt-2 space-y-2">
                                <div className="flex justify-between">
                                    <span>Total Amount:</span>
                                    <span className="font-bold">{testResult.details?.total}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>50% Deposit:</span>
                                    <span className="font-bold text-green-600">{testResult.details?.deposit}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>5% Platform Fee:</span>
                                    <span className="font-bold text-blue-600">{testResult.details?.platformFee}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Company Payout:</span>
                                    <span className="font-bold text-purple-600">{testResult.details?.companyPayout}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Special debug info */}
                    {testResult.hasQuotedPrice !== undefined && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded">
                            <p className="text-sm font-medium">Job Status Check:</p>
                            <div className="mt-2 space-y-1">
                                <p className={`text-sm ${testResult.hasQuotedPrice ? 'text-green-600' : 'text-red-600'}`}>
                                    {testResult.hasQuotedPrice ? '✓ Has quoted price' : '✗ No quoted price'}
                                </p>
                                <p className={`text-sm ${testResult.isReadyForPayment ? 'text-green-600' : 'text-red-600'}`}>
                                    {testResult.isReadyForPayment ? '✓ Ready for payment (status: price_set)' : '✗ Not ready for payment'}
                                </p>
                                {testResult.status && (
                                    <p className="text-sm">Current Status: <span className="font-medium">{testResult.status}</span></p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Reference Test Result */}
            {refTestResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-medium text-green-800">✅ Reference Generated</p>
                    <p className="mt-1">{refTestResult.message}</p>
                    <code className="mt-2 inline-block bg-gray-100 px-2 py-1 rounded text-sm">
                        {refTestResult.reference}
                    </code>
                    <p className="text-xs text-gray-500 mt-2">
                        This reference is now available for Test 4
                    </p>
                </div>
            )}

            {/* Instructions & Troubleshooting */}
            <div className="mt-6 space-y-4">
                <div>
                    <h3 className="font-medium mb-2 text-gray-700">Recommended Test Sequence:</h3>
                    <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                        <li><strong>Check Job:</strong> Use "Debug: Manual Job Check" to verify job has quoted_price and status is 'price_set'</li>
                        <li><strong>Test 1:</strong> Database Connection (should work)</li>
                        <li><strong>Test 2:</strong> Generate Reference</li>
                        <li><strong>Test 3:</strong> Update Job with Payment Reference</li>
                        <li><strong>Debug:</strong> Use "Debug: Find Job by Reference" to confirm reference was saved</li>
                        <li><strong>Test 4:</strong> Verify Payment (Deposit) - updates status to 'deposit_paid'</li>
                        <li><strong>Test 5:</strong> Distribute Earnings (requires RLS disabled on payouts table)</li>
                    </ol>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-800">📝 How to get a valid Job ID:</p>
                    <p className="text-blue-700 text-xs mt-1">
                        1. Go to Supabase Dashboard → SQL Editor<br />
                        2. Run: <code className="bg-blue-100 px-1">SELECT id, status, quoted_price FROM jobs WHERE quoted_price IS NOT NULL AND status = 'price_set' LIMIT 5;</code><br />
                        3. Copy one of the job IDs<br />
                        4. Paste it in the Job ID field above
                    </p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="font-medium text-yellow-800">⚠️ Important: Fix RLS First</p>
                    <p className="text-yellow-700 text-xs mt-1">
                        Before running Test 5, disable RLS on payouts table:<br />
                        <code className="bg-yellow-100 px-1">ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;</code><br />
                        Run this in Supabase SQL Editor
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PaymentTest;