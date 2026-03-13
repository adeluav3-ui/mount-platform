// src/components/payment/PaymentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

// ─── PAYMENT SUMMARY ─────────────────────────────────────────────────────────
const getPaymentSummary = (verifiedPayments) => {
    const empty = {
        depositPaid: 0, intermediatePaid: 0, finalPaid: 0,
        totalPaid: 0, hasDeposit: false, hasIntermediate: false, hasFinal: false,
    };
    if (!verifiedPayments || !Array.isArray(verifiedPayments)) return empty;

    let depositPaid = 0, intermediatePaid = 0, finalPaid = 0;
    let hasDeposit = false, hasIntermediate = false, hasFinal = false;

    verifiedPayments.forEach(p => {
        if (p.type === 'deposit' && p.status === 'completed') {
            depositPaid += p.amount || 0; hasDeposit = true;
        } else if (p.type === 'intermediate' && p.status === 'completed') {
            intermediatePaid += p.amount || 0; hasIntermediate = true;
        } else if (p.type === 'final_payment' && p.status === 'completed') {
            finalPaid += p.amount || 0; hasFinal = true;
        }
    });

    return {
        depositPaid, intermediatePaid, finalPaid,
        totalPaid: depositPaid + intermediatePaid + finalPaid,
        hasDeposit, hasIntermediate, hasFinal,
    };
};

// ─── PAYMENT TYPE DETERMINATION ───────────────────────────────────────────────
const determinePaymentType = (jobData, paymentSummary) => {
    const total = jobData.quoted_price || 0;
    const { hasDeposit, hasIntermediate, hasFinal, totalPaid } = paymentSummary;
    const balance = total - totalPaid;

    switch (jobData.status) {
        case 'price_set':
            return { type: 'deposit', amount: total * 0.5, description: '50% deposit to start the job' };
        case 'work_ongoing':
            if (!hasIntermediate)
                return { type: 'intermediate', amount: total * 0.3, description: '30% materials payment' };
        // falls through
        case 'work_completed':
        case 'work_rectified':
            return { type: 'final_payment', amount: balance, description: 'Final balance payment' };
        case 'deposit_paid':
            if (!hasIntermediate && !hasFinal)
                return { type: 'intermediate', amount: total * 0.3, description: '30% materials payment' };
            if (hasIntermediate && !hasFinal)
                return { type: 'final_payment', amount: total * 0.2, description: '20% final payment' };
            break;
        default:
            if (!hasDeposit) return { type: 'deposit', amount: total * 0.5, description: '50% deposit to start the job' };
            if (hasDeposit && !hasIntermediate) return { type: 'intermediate', amount: total * 0.3, description: '30% materials payment' };
            if (hasDeposit && hasIntermediate && !hasFinal) return { type: 'final_payment', amount: total * 0.2, description: '20% final payment' };
    }
    return { type: 'final_payment', amount: balance, description: 'Balance payment' };
};

// ─── CREDIT USABLE CAP ───────────────────────────────────────────────────────
const getUsableCreditCap = (wallet) => {
    if (!wallet) return 0;
    const day = new Date().getDate();
    const pct = day <= 14 ? 0.5 : 0.7;
    const maxUsable = parseFloat(wallet.monthly_credited || 0) * pct;
    const balance = parseFloat(wallet.balance || 0);
    return Math.min(maxUsable, balance);
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
const fmtStatus = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const TYPE_CONFIG = {
    deposit: { label: 'Deposit', pct: '50%', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
    intermediate: { label: 'Intermediate', pct: '30%', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
    final_payment: { label: 'Final', pct: null, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const PaymentPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { supabase } = useSupabase();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [reference, setReference] = useState('');
    const [creditWallet, setCreditWallet] = useState(null);
    const [useCredit, setUseCredit] = useState(false);

    const generateReference = (id) => {
        const ts = Date.now().toString().slice(-6);
        const rnd = Math.floor(1000 + Math.random() * 9000);
        const ref = `MT${id.slice(0, 4).toUpperCase()}${ts}${rnd}`;
        setReference(ref);
        return ref;
    };

    useEffect(() => { fetchJobDetails(); }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Please login to proceed with payment');

            const { data: jobData, error: jobError } = await supabase
                .from('jobs').select('*').eq('id', jobId).single();
            if (jobError) throw jobError;
            if (!jobData) throw new Error('Job not found');

            let companyName = 'Service Provider';
            if (jobData.company_id) {
                const { data: company } = await supabase
                    .from('companies').select('company_name').eq('id', jobData.company_id).single();
                if (company) companyName = company.company_name;
            }

            const totalAmount = jobData.quoted_price || 0;

            const { data: verifiedPayments } = await supabase
                .from('financial_transactions')
                .select('type, amount, status, verified_by_admin')
                .eq('job_id', jobId).eq('status', 'completed').eq('verified_by_admin', true);

            const summary = getPaymentSummary(verifiedPayments);
            const details = determinePaymentType(jobData, summary);
            const ref = generateReference(jobId);

            // Fetch credit wallet
            const { data: wallet } = await supabase
                .from('credit_wallets')
                .select('*')
                .eq('customer_id', user.id)
                .maybeSingle();

            setCreditWallet(wallet || null);

            setJob({
                ...jobData,
                companyName,
                totalAmount,
                paymentAmount: details.amount,
                paymentDescription: details.description,
                paymentType: details.type,
                reference: ref,
                totalPaid: summary.totalPaid,
                balance: totalAmount - summary.totalPaid,
                hasDeposit: summary.hasDeposit,
                hasIntermediate: summary.hasIntermediate,
                hasFinal: summary.hasFinal,
                userId: user.id,
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ─── CREDIT CALCULATIONS ──────────────────────────────────────────────────
    const usableCreditCap = getUsableCreditCap(creditWallet);
    const creditApplied = useCredit ? Math.min(usableCreditCap, job?.paymentAmount || 0) : 0;
    const amountAfterCredit = Math.max(0, (job?.paymentAmount || 0) - creditApplied);
    const isFullyCoveredByCredit = useCredit && amountAfterCredit === 0;

    // ─── PROCEED HANDLER ─────────────────────────────────────────────────────
    const handleProceed = async () => {
        if (!job || submitting) return;
        setSubmitting(true);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) throw new Error('User not found. Please login again.');

            let dbPaymentType = job.paymentType;
            if (job.paymentType === 'final') dbPaymentType = 'final_payment';

            const allowedTypes = ['deposit', 'intermediate', 'final_payment', 'commission', 'payout', 'refund', 'disbursement'];
            if (!allowedTypes.includes(dbPaymentType)) throw new Error(`Invalid payment type: ${dbPaymentType}`);

            const { data: existingPayments, error: checkError } = await supabase
                .from('financial_transactions')
                .select('id, status, proof_of_payment_url, verified_by_admin, amount')
                .eq('job_id', jobId).eq('type', dbPaymentType)
                .eq('status', 'pending').eq('verified_by_admin', false)
                .order('created_at', { ascending: false });

            if (checkError) throw checkError;

            let transactionId, existingPayment = null;

            if (existingPayments && existingPayments.length > 0) {
                existingPayment = existingPayments.find(p => !p.proof_of_payment_url) || existingPayments[0];
                if (existingPayment.status === 'completed') throw new Error('Payment for this job has already been completed.');
                if (existingPayment.proof_of_payment_url) throw new Error('Payment proof already uploaded. Please wait for admin verification.');
                transactionId = existingPayment.id;
            }

            const paymentData = {
                job_id: jobId,
                user_id: user.id,
                type: dbPaymentType,
                amount: job.paymentAmount,
                platform_fee: 0,
                description: `${job.paymentType} payment for: ${job.description || `Job #${jobId.substring(0, 8)}`}`,
                reference,
                status: 'pending',
                payment_method: isFullyCoveredByCredit ? 'credit_wallet' : 'bank_transfer',
                bank_reference: reference,
                verified_by_admin: false,
                proof_of_payment_url: null,
                admin_notes: null,
                metadata: {
                    job_description: job.description,
                    company_name: job.companyName,
                    customer_id: user.id,
                    created_via: 'customer_payment_page',
                    job_status: job.status,
                    total_job_amount: job.totalAmount,
                    credit_used: creditApplied,
                    cash_amount: amountAfterCredit,
                },
                created_at: new Date().toISOString(),
            };

            if (transactionId) {
                const { error: updateError } = await supabase
                    .from('financial_transactions')
                    .update({ ...paymentData, id: transactionId })
                    .eq('id', transactionId);
                if (updateError) throw new Error(`Failed to update payment: ${updateError.message}`);
            } else {
                const { data, error: insertError } = await supabase
                    .from('financial_transactions').insert(paymentData).select().single();
                if (insertError) throw new Error(`Failed to create payment: ${insertError.message}`);
                transactionId = data.id;
            }

            if (existingPayments && existingPayments.length > 1) {
                const dupeIds = existingPayments.filter(p => p.id !== transactionId).map(p => p.id);
                if (dupeIds.length > 0) await supabase.from('financial_transactions').delete().in('id', dupeIds);
            }

            // ── FULLY COVERED BY CREDIT ───────────────────────────────────────
            if (isFullyCoveredByCredit) {
                // Deduct from credit wallet
                const newBalance = parseFloat(creditWallet.balance) - creditApplied;
                await supabase
                    .from('credit_wallets')
                    .update({ balance: newBalance, updated_at: new Date().toISOString() })
                    .eq('customer_id', user.id);

                // Credit provider wallet
                const isFinalPayment = dbPaymentType === 'final_payment';
                const commission = isFinalPayment ? job.paymentAmount * 0.05 : 0;
                const providerCredit = job.paymentAmount - commission;

                const { data: providerWallet } = await supabase
                    .from('provider_wallets')
                    .select('*')
                    .eq('company_id', job.company_id)
                    .single();

                if (providerWallet) {
                    await supabase
                        .from('provider_wallets')
                        .update({
                            available_balance: parseFloat(providerWallet.available_balance) + providerCredit,
                            total_earned: parseFloat(providerWallet.total_earned) + providerCredit,
                            total_commission: parseFloat(providerWallet.total_commission || 0) + commission,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('company_id', job.company_id);
                }

                // Mark transaction completed
                await supabase
                    .from('financial_transactions')
                    .update({
                        status: 'completed',
                        verified_by_admin: true,
                        admin_notes: 'Auto-verified: fully paid via credit wallet',
                    })
                    .eq('id', transactionId);

                // Advance job status
                const nextStatus = {
                    price_set: 'deposit_paid',
                    work_ongoing: 'intermediate_paid',
                    deposit_paid: 'intermediate_paid',
                    work_completed: 'completed',
                    work_rectified: 'completed',
                }[job.status] || job.status;

                await supabase.from('jobs').update({ status: nextStatus }).eq('id', jobId);

                // Notify provider
                await supabase.from('notifications').insert({
                    user_id: job.company_id,
                    job_id: jobId,
                    type: 'payment_received',
                    title: '💳 Payment Received',
                    message: `${fmt(providerCredit)} credited to your wallet for: ${job.description || `Job #${jobId.substring(0, 8)}`}`,
                    read: false,
                    company_id: job.company_id,
                });

                navigate('/payment/pending', {
                    state: {
                        reference,
                        amount: job.paymentAmount,
                        jobId,
                        paymentType: job.paymentType,
                        companyName: job.companyName,
                        jobDescription: job.description || '',
                        proofUploaded: true,
                        paidByCredit: true,
                        creditUsed: creditApplied,
                    }
                });
                return;
            }

            // ── PARTIAL OR NO CREDIT — initialize Monnify gateway ────────────
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            const initRes = await supabase.functions.invoke('initialize-monnify-payment', {
                body: {
                    jobId,
                    paymentType: dbPaymentType,
                    amount: amountAfterCredit,
                    fullAmount: job.paymentAmount,
                    creditUsed: creditApplied,
                    customerEmail: currentUser?.email,
                    customerName: job.companyName || 'Customer',
                    companyId: job.company_id,
                    companyName: job.companyName,
                    jobDescription: job.description,
                    redirectUrl: `${window.location.origin}/payment/success`,
                },
            });

            if (initRes.error || !initRes.data?.checkoutUrl) {
                throw new Error(initRes.error?.message || 'Failed to initialize payment. Please try again.');
            }

            // Store transaction info in sessionStorage for success page
            sessionStorage.setItem('mountPayment', JSON.stringify({
                reference: initRes.data.reference,
                transactionId: initRes.data.transactionId,
                amount: amountAfterCredit,
                fullAmount: job.paymentAmount,
                creditUsed: creditApplied,
                paymentType: job.paymentType,
                companyName: job.companyName,
                jobId,
            }));

            // Open Monnify checkout
            window.location.href = initRes.data.checkoutUrl;

        } catch (err) {
            let msg = 'Error processing payment. ';
            if (err.message.includes('already been completed')) msg = 'This payment has already been completed. Please check your job status.';
            else if (err.message.includes('proof already')) msg = 'Payment proof already uploaded. Please wait for admin verification (5–15 minutes).';
            else if (err.message.includes('row-level security')) msg = 'Database permission error. Please contact support.';
            else msg += err.message;
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── RENDER STATES ────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-[3px] border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm font-medium">Loading payment details…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-sm w-full text-center">
                <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Payment</h3>
                <p className="text-gray-500 text-sm mb-6">{error}</p>
                <button onClick={() => navigate(-1)} className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">Go Back</button>
            </div>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                <p className="text-gray-500">Job not found.</p>
            </div>
        </div>
    );

    const { totalAmount, paymentAmount, companyName, paymentType, paymentDescription } = job;
    const cfg = TYPE_CONFIG[paymentType] || TYPE_CONFIG.final_payment;
    const pct = cfg.pct || (job.hasIntermediate ? '20%' : '50%');
    const hasCreditAvailable = usableCreditCap > 0;

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Sticky header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <span className="text-sm font-bold text-gray-900">Complete Payment</span>
                    <span className="text-xs text-gray-400 font-mono">#{job.id.substring(0, 8)}</span>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

                {/* Payment type pill */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${cfg.bg} ${cfg.border}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                    <div>
                        <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label} Payment · {pct}</p>
                        <p className="text-xs text-gray-500">{paymentDescription}</p>
                    </div>
                </div>

                {/* Summary card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Payment Summary</h2>
                    </div>
                    <div className="p-5 space-y-4">

                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{job.description || 'Service Job'}</p>
                                <p className="text-xs text-gray-500 mt-0.5">with {companyName}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs text-gray-400">Total job</p>
                                <p className="font-bold text-gray-900">{fmt(totalAmount)}</p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Job Status</span>
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                                {fmtStatus(job.status)}
                            </span>
                        </div>

                        {/* Breakdown */}
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Breakdown</p>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">{cfg.label} ({pct})</span>
                                <span className="font-semibold text-gray-900">{fmt(paymentAmount)}</span>
                            </div>
                            {creditApplied > 0 && (
                                <div className="flex justify-between text-sm text-purple-700">
                                    <span>Credit Applied 💳</span>
                                    <span className="font-semibold">− {fmt(creditApplied)}</span>
                                </div>
                            )}
                            {creditApplied > 0 && (
                                <>
                                    <div className="h-px bg-gray-200" />
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-gray-700">You Pay</span>
                                        <span className={isFullyCoveredByCredit ? 'text-purple-700' : 'text-naijaGreen'}>
                                            {isFullyCoveredByCredit ? '₦0 (Fully covered)' : fmt(amountAfterCredit)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="h-px bg-gray-100" />

                        <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">Amount to Pay</span>
                            <p className={`text-3xl font-bold ${isFullyCoveredByCredit ? 'text-purple-600' : 'text-naijaGreen'}`}>
                                {isFullyCoveredByCredit ? '₦0' : fmt(amountAfterCredit)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Credit Wallet Toggle */}
                {hasCreditAvailable && (
                    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${useCredit ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-white'}`}>
                        <div className="px-5 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl shrink-0">💳</div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Use Credit Wallet</p>
                                        <p className="text-xs text-gray-500">
                                            {fmt(usableCreditCap)} available
                                            <span className="text-gray-400 ml-1">(of {fmt(parseFloat(creditWallet?.balance || 0))} balance)</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUseCredit(prev => !prev)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${useCredit ? 'bg-purple-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${useCredit ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                            {useCredit && (
                                <div className="mt-3 p-3 bg-purple-100 rounded-xl text-xs text-purple-800">
                                    {isFullyCoveredByCredit
                                        ? '✅ Your credit covers this payment fully. No transfer needed — just tap Pay below.'
                                        : `💡 ${fmt(creditApplied)} will be deducted from your credit. You'll transfer the remaining ${fmt(amountAfterCredit)}.`
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment method — hidden if fully covered */}
                {!isFullyCoveredByCredit && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">Payment Method</h2>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-4 p-4 bg-naijaGreen/5 border-2 border-naijaGreen rounded-xl">
                                <div className="w-10 h-10 bg-naijaGreen/10 rounded-xl flex items-center justify-center shrink-0 text-xl">💳</div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-sm">Monnify Secure Checkout</p>
                                    <p className="text-xs text-gray-500">Card, bank transfer, or USSD</p>
                                </div>
                                <div className="w-5 h-5 rounded-full border-2 border-naijaGreen flex items-center justify-center shrink-0">
                                    <div className="w-2.5 h-2.5 bg-naijaGreen rounded-full" />
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">How it works</p>
                                <ol className="space-y-1.5 text-xs text-blue-700">
                                    {[
                                        "Tap Pay — a secure Monnify checkout opens",
                                        "Choose card, bank transfer, or USSD",
                                        "Complete your payment",
                                        "Your job status updates automatically",
                                    ].map((step, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="w-4 h-4 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={handleProceed}
                    disabled={!reference || submitting}
                    className={`w-full text-white py-4 rounded-2xl font-bold text-base transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isFullyCoveredByCredit
                            ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                            : 'bg-naijaGreen hover:bg-darkGreen shadow-naijaGreen/20'
                        }`}
                >
                    {submitting ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                    ) : !reference ? 'Loading…' : isFullyCoveredByCredit ? (
                        '💳 Pay with Credit — ₦0'
                    ) : (
                        `Pay ${fmt(amountAfterCredit)} — Monnify Checkout`
                    )}
                </button>

                <p className="text-center text-xs text-gray-400 pb-4">
                    {isFullyCoveredByCredit
                        ? 'Payment covered by your subscription credit wallet'
                        : 'Secure checkout powered by Monnify · Card, transfer, or USSD'}
                </p>
            </div>
        </div>
    );
};

export default PaymentPage;