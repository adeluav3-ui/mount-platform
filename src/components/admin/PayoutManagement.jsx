// src/components/admin/PayoutManagement.jsx — REFINED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (amount) => `₦${parseFloat(amount || 0).toLocaleString()}`;

// BUG FIX: Original used .replace('_', ' ') which only replaces the FIRST
// underscore. Using a regex with /g flag replaces all occurrences.
const fmtStatus = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const PAYOUT_TYPE_STYLES = {
    deposit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Deposit' },
    intermediate: { bg: 'bg-violet-100', text: 'text-violet-800', label: 'Intermediate' },
    final: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Final' },
}

const PAYOUT_STATUS_STYLES = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    failed: { bg: 'bg-red-100', text: 'text-red-800' },
}

const JOB_STATUS_STYLES = {
    deposit_paid: { bg: 'bg-blue-100', text: 'text-blue-800' },
    intermediate_paid: { bg: 'bg-violet-100', text: 'text-violet-800' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
}

const Badge = ({ label, styles }) => (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles.bg} ${styles.text}`}>
        {label}
    </span>
)

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const PayoutManagement = () => {
    const { supabase } = useSupabase();
    const [jobs, setJobs] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('jobs');
    const [processingId, setProcessingId] = useState(null); // tracks which payout is being actioned

    // BUG FIX: Original called fetchData() on every activeTab change via useEffect,
    // meaning switching tabs always re-fetches even if data is fresh. Use useCallback
    // so functions are stable, and only refetch when switching tabs (not on mount twice).
    const fetchJobsNeedingPayouts = useCallback(async () => {
        const { data: jobsData, error } = await supabase
            .from('jobs')
            .select('*')
            .in('status', ['deposit_paid', 'intermediate_paid', 'completed'])
            .order('created_at', { ascending: false });

        if (error) throw error;

        const jobIds = jobsData?.map(j => j.id) || [];
        let paymentDataMap = {};

        if (jobIds.length > 0) {
            const { data: payments } = await supabase
                .from('financial_transactions')
                .select('job_id, type, amount, platform_fee, status, verified_by_admin')
                .in('job_id', jobIds)
                .eq('status', 'completed')
                .eq('verified_by_admin', true);

            payments?.forEach(p => {
                if (!paymentDataMap[p.job_id]) {
                    paymentDataMap[p.job_id] = {
                        hasDeposit: false, hasIntermediate: false, hasFinal: false,
                        depositAmount: 0, intermediateAmount: 0, finalAmount: 0
                    };
                }
                if (p.type === 'deposit') { paymentDataMap[p.job_id].hasDeposit = true; paymentDataMap[p.job_id].depositAmount = p.amount || 0; }
                else if (p.type === 'intermediate') { paymentDataMap[p.job_id].hasIntermediate = true; paymentDataMap[p.job_id].intermediateAmount = p.amount || 0; }
                else if (p.type === 'final_payment') { paymentDataMap[p.job_id].hasFinal = true; paymentDataMap[p.job_id].finalAmount = p.amount || 0; }
            });
        }

        // Fetch all unique company and customer IDs in bulk to avoid N+1
        const companyIds = [...new Set((jobsData || []).map(j => j.company_id).filter(Boolean))];
        const customerIds = [...new Set((jobsData || []).map(j => j.customer_id).filter(Boolean))];

        const [{ data: companies }, { data: customers }] = await Promise.all([
            supabase.from('companies').select('id, company_name, bank_name, bank_account, account_name').in('id', companyIds),
            supabase.from('customers').select('id, customer_name').in('id', customerIds),
        ]);

        const companyMap = Object.fromEntries((companies || []).map(c => [c.id, c]));
        const customerMap = Object.fromEntries((customers || []).map(c => [c.id, c]));

        const { data: existingPayouts } = await supabase
            .from('payouts')
            .select('job_id, payout_type');

        const payoutMap = {};
        existingPayouts?.forEach(p => {
            if (!payoutMap[p.job_id]) payoutMap[p.job_id] = new Set();
            payoutMap[p.job_id].add(p.payout_type);
        });

        const enriched = (jobsData || []).map(job => ({
            ...job,
            companies: companyMap[job.company_id] || {},
            customers: customerMap[job.customer_id] || {},
            paymentData: paymentDataMap[job.id] || {
                hasDeposit: false, hasIntermediate: false, hasFinal: false,
                depositAmount: 0, intermediateAmount: 0, finalAmount: 0
            }
        }));

        const jobsNeedingPayouts = enriched.filter(job => {
            if (job.status === 'deposit_paid') return !payoutMap[job.id]?.has('deposit');
            if (job.status === 'intermediate_paid') return !payoutMap[job.id]?.has('intermediate');
            if (job.status === 'completed') return !payoutMap[job.id]?.has('final');
            return false;
        });

        setJobs(jobsNeedingPayouts);
    }, [supabase]);

    const fetchPayouts = useCallback(async () => {
        const { data: payoutsData, error } = await supabase
            .from('payouts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Bulk-fetch jobs and companies instead of N+1 per payout
        const jobIds = [...new Set((payoutsData || []).map(p => p.job_id).filter(Boolean))];
        const companyIds = [...new Set((payoutsData || []).map(p => p.company_id).filter(Boolean))];

        const [{ data: pJobs }, { data: pCompanies }] = await Promise.all([
            supabase.from('jobs').select('id, quoted_price, status').in('id', jobIds),
            supabase.from('companies').select('id, company_name, bank_name, bank_account, account_name').in('id', companyIds),
        ]);

        const jobMap = Object.fromEntries((pJobs || []).map(j => [j.id, j]));
        const companyMap = Object.fromEntries((pCompanies || []).map(c => [c.id, c]));

        setPayouts((payoutsData || []).map(p => ({
            ...p,
            jobs: jobMap[p.job_id] || {},
            companies: companyMap[p.company_id] || {},
        })));
    }, [supabase]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (activeTab === 'jobs') await fetchJobsNeedingPayouts();
            else await fetchPayouts();
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [activeTab, fetchJobsNeedingPayouts, fetchPayouts]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Create Payout ─────────────────────────────────────────────────────────
    const createPayout = async (jobId, payoutType) => {
        // BUG FIX: Original had no confirmation before creating a payout — a
        // destructive financial action. Always confirm first.
        const typeLabel = payoutType.charAt(0).toUpperCase() + payoutType.slice(1);
        if (!window.confirm(`Create ${typeLabel} payout for this job? This cannot be undone.`)) return;

        setProcessingId(jobId);
        try {
            const job = jobs.find(j => j.id === jobId);
            if (!job) throw new Error('Job not found');

            const { data: verifiedPayments } = await supabase
                .from('financial_transactions')
                .select('type, amount, platform_fee')
                .eq('job_id', jobId)
                .eq('status', 'completed')
                .eq('verified_by_admin', true);

            let companyReceivedSoFar = 0;
            let totalServiceFeeCollected = 0;

            verifiedPayments?.forEach(p => {
                totalServiceFeeCollected += p.platform_fee || 0;
                if (p.type === 'deposit') companyReceivedSoFar += job.quoted_price * 0.5;
                if (p.type === 'intermediate') companyReceivedSoFar += job.quoted_price * 0.3;
            });

            let amount, platformFee, description;
            const total = job.quoted_price;

            if (payoutType === 'deposit') {
                amount = total * 0.5;
                platformFee = 0;
                description = '50% deposit payment to company';
            } else if (payoutType === 'intermediate') {
                amount = total * 0.3;
                platformFee = 0;
                description = '30% intermediate payment for materials';
            } else {
                const totalForCompany = total * 0.95;
                amount = totalForCompany - companyReceivedSoFar;
                platformFee = total * 0.05;
                description = `Final payment (${((amount / total) * 100).toFixed(1)}% of job — 5% platform commission)`;
            }

            const { error: payoutError } = await supabase
                .from('payouts')
                .insert({
                    job_id: jobId,
                    company_id: job.company_id,
                    amount,
                    platform_fee: platformFee,
                    payout_type: payoutType,
                    status: 'pending',
                    bank_name: job.companies.bank_name,
                    bank_account: job.companies.bank_account,
                    description,
                });

            if (payoutError) throw payoutError;

            if (totalServiceFeeCollected > 0) {
                await supabase
                    .from('jobs')
                    .update({ customer_service_fee: totalServiceFeeCollected })
                    .eq('id', jobId);
            }

            alert(
                `✅ ${typeLabel} payout created!\n\n` +
                `Company receives: ${fmt(amount)}\n` +
                `Service fee collected from customer: ${fmt(totalServiceFeeCollected)}\n` +
                `Platform commission: ${fmt(platformFee)}\n` +
                `Total job amount: ${fmt(total)}`
            );

            fetchData();
        } catch (err) {
            console.error('Error creating payout:', err);
            alert('Failed to create payout: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    // ── Update Payout Status ──────────────────────────────────────────────────
    const updatePayoutStatus = async (payoutId, newStatus) => {
        // BUG FIX: "Mark as Failed" captured prompt() reason but NEVER included
        // it in the supabase update call. Now it's properly saved as admin_notes.
        let failReason = null;
        if (newStatus === 'failed') {
            failReason = window.prompt('Reason for failure (required):');
            if (!failReason?.trim()) return; // Cancelled or empty — abort
        }

        const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
        if (newStatus !== 'failed' && !window.confirm(`Mark payout as ${label}?`)) return;

        setProcessingId(payoutId);
        try {
            const updates = {
                status: newStatus,
                completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
                ...(failReason && { admin_notes: failReason }),
            };

            const { error } = await supabase
                .from('payouts')
                .update(updates)
                .eq('id', payoutId);

            if (error) throw error;

            alert(`✅ Payout marked as ${label}`);
            fetchData();
        } catch (err) {
            console.error('Error updating payout:', err);
            alert('Failed to update payout: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Payout Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Create and track company payouts</p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-naijaGreen transition px-3 py-2 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Tabs */}
            {/* BUG FIX: Removed the leftover empty <div className="flex gap-4 mb-4"></div>
                that was sitting between the tabs and content in the original */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {[
                        { key: 'jobs', label: 'Jobs Needing Payouts', count: jobs.length },
                        { key: 'payouts', label: 'All Payouts', count: payouts.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition border-b-2 ${activeTab === tab.key
                                    ? 'border-naijaGreen text-naijaGreen'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            <span className={`min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${activeTab === tab.key
                                    ? 'bg-naijaGreen text-white'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-8 h-8 border-3 border-naijaGreen border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">Loading…</p>
                    </div>
                ) : activeTab === 'jobs' ? (

                    /* ── Jobs Needing Payouts ── */
                    jobs.length === 0 ? (
                        <div className="flex flex-col items-center py-20 text-center px-6">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-4">✅</div>
                            <h3 className="font-bold text-gray-700 text-lg">All Caught Up!</h3>
                            <p className="text-gray-400 text-sm mt-1">No jobs need payouts at the moment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {jobs.map(job => {
                                const isProcessing = processingId === job.id;
                                const payoutType = job.status === 'deposit_paid' ? 'deposit'
                                    : job.status === 'intermediate_paid' ? 'intermediate' : 'final';

                                let payoutAmount;
                                if (job.status === 'deposit_paid') {
                                    payoutAmount = job.quoted_price * 0.5;
                                } else if (job.status === 'intermediate_paid') {
                                    payoutAmount = job.quoted_price * 0.3;
                                } else {
                                    let received = 0;
                                    if (job.paymentData?.hasDeposit) received += job.quoted_price * 0.5;
                                    if (job.paymentData?.hasIntermediate) received += job.quoted_price * 0.3;
                                    payoutAmount = (job.quoted_price * 0.95) - received;
                                }

                                return (
                                    <div key={job.id} className="p-5 sm:p-6 hover:bg-gray-50/60 transition-colors">
                                        {/* Top row */}
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <h3 className="font-bold text-gray-900 text-base">
                                                        {job.companies?.company_name || 'Unknown Company'}
                                                    </h3>
                                                    <Badge
                                                        label={fmtStatus(job.status)}
                                                        styles={JOB_STATUS_STYLES[job.status] || { bg: 'bg-gray-100', text: 'text-gray-700' }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Job #{job.id.substring(0, 8)} · Customer: {job.customers?.customer_name || 'Unknown'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Job</p>
                                                <p className="text-xl font-bold text-gray-900">{fmt(job.quoted_price)}</p>
                                            </div>
                                        </div>

                                        {/* Detail cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">🏦 Bank Details</p>
                                                <p className="text-sm text-gray-800 font-medium">{job.companies?.bank_name || <span className="text-gray-400">Not provided</span>}</p>
                                                <p className="text-sm font-mono text-gray-600">{job.companies?.bank_account || '—'}</p>
                                                {/* BUG FIX: account_name was fetched but never displayed */}
                                                {job.companies?.account_name && (
                                                    <p className="text-xs text-gray-500 mt-1">{job.companies.account_name}</p>
                                                )}
                                            </div>
                                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">💰 Company Receives</p>
                                                <p className="text-2xl font-bold text-emerald-700">{fmt(payoutAmount)}</p>
                                                <p className="text-xs text-emerald-600 mt-1">
                                                    {job.status === 'deposit_paid' ? '50% deposit'
                                                        : job.status === 'intermediate_paid' ? '30% intermediate for materials'
                                                            : 'Final payment (95% total − already paid)'}
                                                </p>
                                                {job.customer_service_fee > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">Service fee collected: {fmt(job.customer_service_fee)}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <button
                                            onClick={() => createPayout(job.id, payoutType)}
                                            disabled={isProcessing}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${payoutType === 'deposit' ? 'bg-blue-600 hover:bg-blue-700'
                                                    : payoutType === 'intermediate' ? 'bg-violet-600 hover:bg-violet-700'
                                                        : 'bg-emerald-600 hover:bg-emerald-700'
                                                }`}
                                        >
                                            {isProcessing ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                                            ) : (
                                                <>Create {fmtStatus(payoutType)} Payout ({fmt(payoutAmount)})</>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )

                ) : (

                    /* ── All Payouts ── */
                    payouts.length === 0 ? (
                        <div className="flex flex-col items-center py-20 text-center px-6">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl mb-4">💸</div>
                            <h3 className="font-bold text-gray-700 text-lg">No Payouts Yet</h3>
                            <p className="text-gray-400 text-sm mt-1">Switch to "Jobs Needing Payouts" to create your first payout.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {payouts.map(payout => {
                                const isProcessing = processingId === payout.id;
                                const typeStyle = PAYOUT_TYPE_STYLES[payout.payout_type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: payout.payout_type || 'Unknown' };
                                const statusStyle = PAYOUT_STATUS_STYLES[payout.status] || { bg: 'bg-gray-100', text: 'text-gray-700' };

                                return (
                                    <div key={payout.id} className="p-5 sm:p-6 hover:bg-gray-50/60 transition-colors">
                                        {/* Header */}
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <h3 className="font-bold text-gray-900 text-base">
                                                        {payout.companies?.company_name || 'Unknown Company'}
                                                    </h3>
                                                    {/* BUG FIX: Mobile originally showed only first character e.g. 'D', 'I', 'F'
                                                        via .slice(0,1) with no tooltip. Now shows full label on all screen sizes. */}
                                                    <Badge label={typeStyle.label} styles={typeStyle} />
                                                    <Badge label={fmtStatus(payout.status)} styles={statusStyle} />
                                                </div>
                                                <p className="text-xs text-gray-400">
                                                    Job #{payout.job_id?.substring(0, 8)}
                                                    {payout.jobs?.quoted_price && ` · Total job: ${fmt(payout.jobs.quoted_price)}`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900">{fmt(payout.amount)}</p>
                                                {payout.platform_fee > 0 && (
                                                    <p className="text-xs text-gray-400">Platform fee: {fmt(payout.platform_fee)}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Bank + Description */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                            {payout.companies?.bank_name && (
                                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-sm">
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bank</p>
                                                    <p className="font-medium text-gray-800">{payout.companies.bank_name}</p>
                                                    <p className="font-mono text-gray-600 text-xs">{payout.companies.bank_account || '—'}</p>
                                                    {payout.companies.account_name && (
                                                        <p className="text-gray-500 text-xs">{payout.companies.account_name}</p>
                                                    )}
                                                </div>
                                            )}
                                            {payout.description && (
                                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-sm">
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
                                                    <p className="text-gray-700">{payout.description}</p>
                                                    {payout.admin_notes && (
                                                        <p className="text-red-600 text-xs mt-1">Note: {payout.admin_notes}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {(payout.status === 'pending' || payout.status === 'processing') && (
                                            <div className="flex flex-wrap gap-2">
                                                {payout.status === 'pending' && (
                                                    <button
                                                        onClick={() => updatePayoutStatus(payout.id, 'processing')}
                                                        disabled={isProcessing}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                                                    >
                                                        Mark Processing
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => updatePayoutStatus(payout.id, 'completed')}
                                                    disabled={isProcessing}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                                                >
                                                    {isProcessing ? (
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Working…
                                                        </span>
                                                    ) : 'Mark Completed'}
                                                </button>
                                                <button
                                                    onClick={() => updatePayoutStatus(payout.id, 'failed')}
                                                    disabled={isProcessing}
                                                    className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
                                                >
                                                    Mark Failed
                                                </button>
                                            </div>
                                        )}
                                        {payout.status === 'completed' && (
                                            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Completed {payout.completed_at ? `· ${new Date(payout.completed_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                                            </div>
                                        )}
                                        {payout.status === 'failed' && (
                                            <p className="text-xs text-red-600 font-semibold">Failed{payout.admin_notes ? ` — ${payout.admin_notes}` : ''}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default PayoutManagement;