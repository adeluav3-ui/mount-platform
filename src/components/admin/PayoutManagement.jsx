// src/components/admin/PayoutManagement.jsx - SIMPLIFIED MVP VERSION
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const PayoutManagement = () => {
    const { supabase } = useSupabase();
    const [jobs, setJobs] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'payouts'

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);

            if (activeTab === 'jobs') {
                // Fetch jobs that need payouts
                await fetchJobsNeedingPayouts();
            } else {
                // Fetch existing payouts
                await fetchPayouts();
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobsNeedingPayouts = async () => {
        // UPDATED: Get jobs that need payouts including intermediate payments
        const { data: jobsData, error } = await supabase
            .from('jobs')
            .select('*')
            .in('status', ['deposit_paid', 'intermediate_paid', 'completed'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch payment data for these jobs
        const jobIds = jobsData?.map(job => job.id) || [];
        let paymentDataMap = {};

        if (jobIds.length > 0) {
            const { data: payments, error: paymentsError } = await supabase
                .from('financial_transactions')
                .select('job_id, type, amount, status, verified_by_admin')
                .in('job_id', jobIds)
                .eq('status', 'completed')
                .eq('verified_by_admin', true);

            if (!paymentsError && payments) {
                payments.forEach(payment => {
                    if (!paymentDataMap[payment.job_id]) {
                        paymentDataMap[payment.job_id] = {
                            hasDeposit: false,
                            hasIntermediate: false,
                            hasFinal: false,
                            depositAmount: 0,
                            intermediateAmount: 0,
                            finalAmount: 0
                        };
                    }

                    if (payment.type === 'deposit') {
                        paymentDataMap[payment.job_id].hasDeposit = true;
                        paymentDataMap[payment.job_id].depositAmount = payment.amount || 0;
                    } else if (payment.type === 'intermediate') {
                        paymentDataMap[payment.job_id].hasIntermediate = true;
                        paymentDataMap[payment.job_id].intermediateAmount = payment.amount || 0;
                    } else if (payment.type === 'final_payment') {
                        paymentDataMap[payment.job_id].hasFinal = true;
                        paymentDataMap[payment.job_id].finalAmount = payment.amount || 0;
                    }
                });
            }
        }

        // Then get company and customer details separately
        const jobsWithDetails = await Promise.all(
            (jobsData || []).map(async (job) => {
                const { data: company } = await supabase
                    .from('companies')
                    .select('company_name, bank_name, bank_account')
                    .eq('id', job.company_id)
                    .single();

                const { data: customer } = await supabase
                    .from('customers')
                    .select('customer_name')
                    .eq('id', job.customer_id)
                    .single();

                return {
                    ...job,
                    companies: company || {},
                    customers: customer || {},
                    paymentData: paymentDataMap[job.id] || {
                        hasDeposit: false,
                        hasIntermediate: false,
                        hasFinal: false,
                        depositAmount: 0,
                        intermediateAmount: 0,
                        finalAmount: 0
                    }
                };
            })
        );

        // Check which jobs already have payouts
        const { data: existingPayouts } = await supabase
            .from('payouts')
            .select('job_id, payout_type');

        const payoutMap = {};
        existingPayouts?.forEach(p => {
            if (!payoutMap[p.job_id]) payoutMap[p.job_id] = new Set();
            payoutMap[p.job_id].add(p.payout_type);
        });

        // Filter jobs that need payouts
        const jobsNeedingPayouts = jobsWithDetails.filter(job => {
            if (job.status === 'deposit_paid') {
                return !payoutMap[job.id]?.has('deposit');
            } else if (job.status === 'intermediate_paid') {
                return !payoutMap[job.id]?.has('intermediate');
            } else if (job.status === 'completed') {
                return !payoutMap[job.id]?.has('final');
            }
            return false;
        });

        setJobs(jobsNeedingPayouts);
    };

    const fetchPayouts = async () => {
        try {
            // First, fetch payouts
            const { data: payoutsData, error } = await supabase
                .from('payouts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Then, enrich with job and company details manually
            const enrichedPayouts = await Promise.all(
                (payoutsData || []).map(async (payout) => {
                    // Get job details
                    const { data: job } = await supabase
                        .from('jobs')
                        .select('quoted_price, status')
                        .eq('id', payout.job_id)
                        .single();

                    // Get company details - INCLUDING BANK INFO
                    const { data: company } = await supabase
                        .from('companies')
                        .select('company_name, bank_name, bank_account')
                        .eq('id', payout.company_id)
                        .single();

                    return {
                        ...payout,
                        jobs: job || {},
                        companies: company || {}
                    };
                })
            );

            setPayouts(enrichedPayouts || []);

        } catch (error) {
            console.error('Error fetching payouts:', error);
            setPayouts([]);
        }
    };

    const createPayout = async (jobId, payoutType) => {
        try {
            // Get job details with payment data
            const job = jobs.find(j => j.id === jobId);
            if (!job) throw new Error('Job not found');

            let amount, platformFee, description;

            // FIRST: Get all verified payments for this job to understand what was paid
            const { data: verifiedPayments } = await supabase
                .from('financial_transactions')
                .select('type, amount, platform_fee')
                .eq('job_id', jobId)
                .eq('status', 'completed')
                .eq('verified_by_admin', true);

            // Calculate total service fee collected from customer
            let totalServiceFeeCollected = 0;
            if (verifiedPayments) {
                verifiedPayments.forEach(payment => {
                    totalServiceFeeCollected += payment.platform_fee || 0;
                });
            }

            const totalJobAmount = job.quoted_price;

            if (payoutType === 'deposit') {
                // Company gets 50% of job amount (NOT including customer's service fee)
                amount = totalJobAmount * 0.5;
                platformFee = 0; // No platform commission on deposit
                description = '50% deposit payment to company';

            } else if (payoutType === 'intermediate') {
                // Company gets 30% of job amount
                amount = totalJobAmount * 0.3;
                platformFee = 0; // No platform commission on intermediate
                description = '30% intermediate payment for materials';

            } else {
                // FINAL PAYMENT - Calculate based on what's already been paid to company

                // Calculate what company has already received
                let companyReceivedSoFar = 0;
                if (verifiedPayments) {
                    verifiedPayments.forEach(payment => {
                        if (payment.type === 'deposit') {
                            // Deposit: company gets 50% of job
                            companyReceivedSoFar += totalJobAmount * 0.5;
                        } else if (payment.type === 'intermediate') {
                            // Intermediate: company gets 30% of job
                            companyReceivedSoFar += totalJobAmount * 0.3;
                        }
                        // Note: We don't count service fee (platform_fee) as company payment
                    });
                }

                // Total company should receive: 95% of job (5% platform commission)
                const totalCompanyShouldReceive = totalJobAmount * 0.95;

                // Final payment = remaining amount company should get
                amount = totalCompanyShouldReceive - companyReceivedSoFar;

                // Platform commission is 5% of total job
                platformFee = totalJobAmount * 0.05;

                description = `Final payment (${((amount / totalJobAmount) * 100).toFixed(1)}% job amount - 5% platform commission)`;
            }

            // Create payout
            const { error: payoutError } = await supabase
                .from('payouts')
                .insert({
                    job_id: jobId,
                    company_id: job.company_id,
                    amount: amount,
                    platform_fee: platformFee,
                    payout_type: payoutType,
                    status: 'pending',
                    bank_name: job.companies.bank_name,
                    bank_account: job.companies.bank_account,
                    description: description,
                    metadata: {
                        total_job_amount: totalJobAmount,
                        service_fee_collected: totalServiceFeeCollected,
                        platform_commission: payoutType === 'final' ? totalJobAmount * 0.05 : 0,
                        calculation: {
                            deposit_paid: verifiedPayments?.some(p => p.type === 'deposit'),
                            intermediate_paid: verifiedPayments?.some(p => p.type === 'intermediate'),
                            company_received_before: companyReceivedSoFar || 0
                        }
                    }
                });

            if (payoutError) throw payoutError;

            // Also update the job's customer_service_fee if not already set
            if (totalServiceFeeCollected > 0) {
                await supabase
                    .from('jobs')
                    .update({
                        customer_service_fee: totalServiceFeeCollected
                    })
                    .eq('id', jobId);
            }

            alert(`${payoutType.charAt(0).toUpperCase() + payoutType.slice(1)} payout created!\n\n` +
                `Company receives: ₦${amount.toLocaleString()}\n` +
                `Platform fee collected from customer: ₦${totalServiceFeeCollected.toLocaleString()}\n` +
                `Platform commission: ₦${platformFee.toLocaleString()}\n` +
                `Total job amount: ₦${totalJobAmount.toLocaleString()}`);

            fetchData(); // Refresh data

        } catch (error) {
            console.error('Error creating payout:', error);
            alert('Failed to create payout: ' + error.message);
        }
    };

    // Add this function near the top after other functions
    const debugJobs = async () => {
        console.log('=== DEBUG PAYOUTS ===');

        // Get all jobs in deposit_paid status
        const { data: allJobs } = await supabase
            .from('jobs')
            .select('*')
            .in('status', ['deposit_paid', 'intermediate_paid', 'completed'])
            .order('created_at', { ascending: false });

        console.log('All jobs needing payouts:', allJobs);

        // Get existing payouts
        const { data: existingPayouts } = await supabase
            .from('payouts')
            .select('job_id, payout_type');

        console.log('Existing payouts:', existingPayouts);

        // Show which jobs need payouts
        const payoutMap = {};
        existingPayouts?.forEach(p => {
            if (!payoutMap[p.job_id]) payoutMap[p.job_id] = new Set();
            payoutMap[p.job_id].add(p.payout_type);
        });

        console.log('Jobs needing payouts:');
        allJobs?.forEach(job => {
            const needsDeposit = job.status === 'deposit_paid' && !payoutMap[job.id]?.has('deposit');
            const needsIntermediate = job.status === 'intermediate_paid' && !payoutMap[job.id]?.has('intermediate');
            const needsFinal = job.status === 'completed' && !payoutMap[job.id]?.has('final');

            if (needsDeposit || needsIntermediate || needsFinal) {
                console.log(`Job ${job.id.substring(0, 8)} needs ${job.status} payout`);
            }
        });
    };

    const updatePayoutStatus = async (payoutId, newStatus) => {
        try {
            const { error } = await supabase
                .from('payouts')
                .update({
                    status: newStatus,
                    completed_at: newStatus === 'completed' ? new Date().toISOString() : null
                })
                .eq('id', payoutId);

            if (error) throw error;

            alert(`Payout marked as ${newStatus}`);
            fetchData(); // Refresh data

        } catch (error) {
            console.error('Error updating payout:', error);
            alert('Failed to update payout');
        }
    };

    const formatCurrency = (amount) => {
        return `₦${parseFloat(amount || 0).toLocaleString()}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-800">Payout Management</h1>
                <p className="text-gray-600 mt-1">Simple manual payout system for MVP</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`px-4 py-2 font-medium ${activeTab === 'jobs'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Jobs Needing Payouts ({jobs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('payouts')}
                        className={`px-4 py-2 font-medium ${activeTab === 'payouts'
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        All Payouts ({payouts.length})
                    </button>
                </div>
            </div>
            <div className="flex gap-4 mb-4">
            </div>
            {/* Content */}
            {activeTab === 'jobs' ? (
                /* Jobs Needing Payouts */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {jobs.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {jobs.map((job) => (
                                <div key={job.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {job.companies?.company_name || 'Unknown Company'}
                                            </h3>
                                            <p className="text-gray-600">Job #{job.id.substring(0, 8)}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Customer: {job.customers?.customer_name || 'Unknown'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-gray-800">
                                                {formatCurrency(job.quoted_price)}
                                            </p>
                                            <span className={`px-2 py-1 text-xs rounded-full ${job.status === 'deposit_paid'
                                                ? 'bg-blue-100 text-blue-800'
                                                : job.status === 'intermediate_paid'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {job.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-medium text-gray-700">Bank Details</h4>
                                            <div className="text-sm text-gray-600">
                                                <div>Bank: {job.companies?.bank_name || 'Not provided'}</div>
                                                <div>Account: {job.companies?.bank_account || 'Not provided'}</div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <h4 className="font-medium text-gray-700">Payment Details</h4>
                                            <p className="text-2xl font-bold text-green-600">
                                                {job.status === 'deposit_paid'
                                                    ? formatCurrency(job.quoted_price * 0.5)  // Company gets 50%
                                                    : job.status === 'intermediate_paid'
                                                        ? formatCurrency(job.quoted_price * 0.3)  // Company gets 30%
                                                        : // For final payment, calculate remaining amount for company
                                                        (() => {
                                                            // Calculate what company has already received
                                                            let companyReceived = 0;
                                                            if (job.paymentData?.hasDeposit) companyReceived += job.quoted_price * 0.5;
                                                            if (job.paymentData?.hasIntermediate) companyReceived += job.quoted_price * 0.3;

                                                            // Company gets 95% total (5% platform commission)
                                                            const totalForCompany = job.quoted_price * 0.95;
                                                            const finalAmount = totalForCompany - companyReceived;
                                                            return formatCurrency(finalAmount);
                                                        })()
                                                }
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {job.status === 'deposit_paid'
                                                    ? '50% deposit to company'
                                                    : job.status === 'intermediate_paid'
                                                        ? '30% intermediate to company'
                                                        : 'Final payment to company (95% total - already paid)'
                                                }
                                            </p>
                                            {/* Show service fee information */}
                                            <div className="mt-2 text-xs text-gray-500">
                                                {job.customer_service_fee > 0 && (
                                                    <div>Customer service fee: ₦{job.customer_service_fee.toLocaleString()}</div>
                                                )}
                                                <div>Platform commission: 5% of ₦{formatCurrency(job.quoted_price)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        {job.status === 'deposit_paid' && (
                                            <button
                                                onClick={() => createPayout(job.id, 'deposit')}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Create Deposit Payout
                                            </button>
                                        )}
                                        {job.status === 'intermediate_paid' && (
                                            <button
                                                onClick={() => createPayout(job.id, 'intermediate')}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                            >
                                                Create Intermediate Payout
                                            </button>
                                        )}
                                        {job.status === 'completed' && (
                                            <button
                                                onClick={() => createPayout(job.id, 'final')}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                Create Final Payout
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-xl font-medium text-gray-700">All Caught Up!</h3>
                            <p className="text-gray-500 mt-2">No jobs need payouts at the moment.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* All Payouts */
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {payouts.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {payouts.map((payout) => (
                                <div key={payout.id} className="p-4 hover:bg-gray-50 border-b">
                                    {/* Mobile: Stack everything vertically */}
                                    <div className="md:hidden">
                                        {/* Header - Company and badges */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <h3 className="font-semibold text-base">
                                                {payout.companies?.company_name || 'Unknown'}
                                            </h3>
                                            <div className="flex gap-1">
                                                <span className={`px-2 py-1 text-xs rounded-full ${payout.payout_type === 'deposit'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : payout.payout_type === 'intermediate'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {payout.payout_type?.toUpperCase()?.slice(0, 1)}
                                                </span>
                                                <span className={`px-2 py-1 text-xs rounded-full ${payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {payout.status.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Job Info */}
                                        <div className="text-sm text-gray-600 mb-2">
                                            Job: {payout.job_id?.substring(0, 6)}...
                                        </div>

                                        {/* Amount - Big and clear */}
                                        <div className="text-xl font-bold text-gray-800 mb-3">
                                            {formatCurrency(payout.amount)}
                                        </div>

                                        {/* Bank Details (if exists) */}
                                        {payout.companies?.bank_name && (
                                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mb-3">
                                                <div className="truncate">{payout.companies.bank_name}</div>
                                                <div className="font-mono">{payout.companies.bank_account || 'No account'}</div>
                                            </div>
                                        )}

                                        {/* Description */}
                                        <div className="text-xs text-gray-500 mb-3">
                                            {payout.description?.substring(0, 60)}
                                            {payout.description?.length > 60 ? '...' : ''}
                                        </div>

                                        {/* Platform Fee */}
                                        <div className="text-xs text-gray-600 mb-4">
                                            {payout.platform_fee > 0
                                                ? `Fee: ${formatCurrency(payout.platform_fee)}`
                                                : 'No platform fee'
                                            }
                                        </div>

                                        {/* Action Buttons - Full width on mobile */}
                                        <div className="flex flex-col gap-2">
                                            {payout.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updatePayoutStatus(payout.id, 'processing')}
                                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                                    >
                                                        Mark as Processing
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Mark payout as completed?`)) {
                                                                updatePayoutStatus(payout.id, 'completed');
                                                            }
                                                        }}
                                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                                    >
                                                        Mark as Completed
                                                    </button>
                                                </>
                                            )}
                                            {payout.status === 'processing' && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Mark payout as completed?`)) {
                                                            updatePayoutStatus(payout.id, 'completed');
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                                >
                                                    Mark as Completed
                                                </button>
                                            )}
                                            {(payout.status === 'pending' || payout.status === 'processing') && (
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Reason for failure:');
                                                        if (reason) {
                                                            updatePayoutStatus(payout.id, 'failed');
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                                >
                                                    Mark as Failed
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Desktop: Keep original layout */}
                                    <div className="hidden md:block">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg">
                                                        {payout.companies?.company_name || 'Unknown'}
                                                    </h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${payout.payout_type === 'deposit'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : payout.payout_type === 'intermediate'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'
                                                        }`}>
                                                        {payout.payout_type?.toUpperCase() || 'UNKNOWN'}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            payout.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-red-100 text-red-800'
                                                        }`}>
                                                        {payout.status.toUpperCase()}
                                                    </span>
                                                </div>

                                                <div className="text-sm text-gray-600 mb-1">
                                                    Job #{payout.job_id?.substring(0, 8)} • {formatCurrency(payout.jobs?.quoted_price)}
                                                    {payout.metadata?.split_payment && (
                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                                            Split Payment
                                                        </span>
                                                    )}
                                                </div>

                                                {payout.companies?.bank_name && (
                                                    <div className="text-sm text-gray-500 mb-1">
                                                        Bank: {payout.companies.bank_name} • {payout.companies.bank_account || 'Not provided'}
                                                    </div>
                                                )}

                                                <div className="text-sm text-gray-500 mt-1">
                                                    {payout.description}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-gray-800">
                                                    {formatCurrency(payout.amount)}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {payout.platform_fee > 0
                                                        ? `Platform fee: ${formatCurrency(payout.platform_fee)}`
                                                        : 'No platform fee'
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex gap-2 justify-end">
                                            {/* Desktop action buttons (same as before) */}
                                            {payout.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updatePayoutStatus(payout.id, 'processing')}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                    >
                                                        Mark as Processing
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Mark payout as completed and record transfer?`)) {
                                                                updatePayoutStatus(payout.id, 'completed');
                                                            }
                                                        }}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                    >
                                                        Mark as Completed
                                                    </button>
                                                </>
                                            )}
                                            {payout.status === 'processing' && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Mark payout as completed?`)) {
                                                            updatePayoutStatus(payout.id, 'completed');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    Mark as Completed
                                                </button>
                                            )}
                                            {(payout.status === 'pending' || payout.status === 'processing') && (
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Reason for failure:');
                                                        if (reason) {
                                                            updatePayoutStatus(payout.id, 'failed');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    Mark as Failed
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">💸</span>
                            </div>
                            <h3 className="text-xl font-medium text-gray-700">No Payouts Yet</h3>
                            <p className="text-gray-500 mt-2">
                                Switch to "Jobs Needing Payouts" tab to create payouts.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PayoutManagement;