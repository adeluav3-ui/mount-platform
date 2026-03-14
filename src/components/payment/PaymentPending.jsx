// src/components/payment/PaymentPending.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
const fmtType = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const PaymentPending = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { supabase } = useSupabase();

    const {
        reference,
        amount,
        paymentType,
        jobId,
        companyName: stateCompanyName,
        jobDescription: stateJobDescription,
        proofUploaded: stateProofUploaded,
        paidByCredit,
        creditUsed,
    } = location.state || {};

    const [displayAmount, setDisplayAmount] = useState(amount || 0);
    const [displayType, setDisplayType] = useState(paymentType || '');
    const [jobDescription, setJobDescription] = useState(stateJobDescription || '');
    const [companyName, setCompanyName] = useState(stateCompanyName || '');
    const [proofUploaded, setProofUploaded] = useState(!!stateProofUploaded);
    const [loading, setLoading] = useState(!stateJobDescription);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!reference || !jobId) {
            navigate('/dashboard', { replace: true });
            return;
        }
        fetchPaymentDetails();
    }, [reference, jobId]);

    const fetchPaymentDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select(`*, jobs ( description, status, company_id, companies ( company_name ) )`)
                .eq('bank_reference', reference)
                .single();

            if (error) throw error;
            if (data?.amount) setDisplayAmount(data.amount);
            if (data?.type) setDisplayType(data.type);
            if (data?.jobs?.description) setJobDescription(data.jobs.description);
            if (data?.jobs?.companies?.company_name) setCompanyName(data.jobs.companies.company_name);
            if (data?.proof_of_payment_url) setProofUploaded(true);
        } catch (err) {
            // Non-fatal
        } finally {
            setLoading(false);
        }
    };

    const copyReference = async () => {
        try { await navigator.clipboard.writeText(reference); }
        catch {
            const el = document.createElement('textarea');
            el.value = reference;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-[3px] border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm font-medium">Loading payment details…</p>
            </div>
        </div>
    );

    const displayCompanyName = companyName || 'Service Provider';
    const displayJobDescription = jobDescription || 'Service Job';

    // ── CREDIT PAYMENT SCREEN ─────────────────────────────────────────────────
    if (paidByCredit) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                    <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                        <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition text-sm font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Dashboard
                        </Link>
                        <span className="text-sm font-bold text-gray-900">Payment Confirmed</span>
                        <div className="w-20" />
                    </div>
                </div>

                <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">💳</span>
                        </div>
                        <h2 className="text-xl font-bold text-purple-900 mb-2">Payment Confirmed</h2>
                        <p className="text-sm text-purple-700">
                            Your credit wallet covered this payment. Your job status has been updated automatically.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Payment Details</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {[
                                { label: 'Amount', value: <span className="font-bold text-purple-600 text-lg">{fmt(displayAmount)}</span> },
                                { label: 'Paid With', value: <span className="font-semibold text-purple-700">💳 Credit Wallet</span> },
                                ...(creditUsed > 0 ? [{ label: 'Credit Used', value: <span className="font-semibold text-purple-600">− {fmt(creditUsed)}</span> }] : []),
                                { label: 'Payment Type', value: fmtType(displayType || paymentType) },
                                { label: 'Job', value: displayJobDescription.length > 50 ? `${displayJobDescription.substring(0, 50)}…` : displayJobDescription },
                                { label: 'Service Provider', value: displayCompanyName },
                                { label: 'Status', value: <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Confirmed</span> },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                                    <span className="text-gray-500">{label}</span>
                                    <span className="font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">What happens next</h3>
                        </div>
                        <div className="p-5">
                            <ol className="space-y-3">
                                {[
                                    'Your job status has been updated automatically',
                                    'The service provider has been notified',
                                    'Credit has been deducted from your wallet',
                                    'You can track your job progress from the dashboard',
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Link to="/dashboard#myJobs" className="block w-full py-3.5 rounded-2xl font-bold text-sm text-center bg-naijaGreen text-white hover:bg-darkGreen transition">
                            View My Jobs
                        </Link>
                        <Link to="/dashboard" className="block w-full py-3.5 rounded-2xl font-bold text-sm text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                            Go to Dashboard
                        </Link>
                    </div>

                    <div className="text-center text-xs text-gray-400 pb-4">
                        <p>Need help? <a href="mailto:info@mountltd.com" className="text-naijaGreen hover:underline">info@mountltd.com</a> · 08139672432</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── BANK TRANSFER / PROOF UPLOAD SCREEN ──────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Dashboard
                    </Link>
                    <span className="text-sm font-bold text-gray-900">Payment Status</span>
                    <div className="w-20" />
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
                <div className={`rounded-2xl p-6 text-center ${proofUploaded ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${proofUploaded ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        <span className="text-3xl">{proofUploaded ? '✅' : '⏳'}</span>
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${proofUploaded ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {proofUploaded ? 'Proof Received — Pending Verification' : 'Awaiting Proof of Payment'}
                    </h2>
                    <p className={`text-sm ${proofUploaded ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {proofUploaded
                            ? 'Your proof of payment has been uploaded. Admin will verify within 5–15 minutes.'
                            : 'Please upload your proof of payment so we can verify your transfer.'}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Payment Details</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[
                            { label: 'Reference', value: <code className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-sm">{reference}</code> },
                            { label: 'Amount', value: <span className="font-bold text-naijaGreen text-lg">{fmt(displayAmount)}</span> },
                            { label: 'Payment Type', value: fmtType(displayType) },
                            { label: 'Job', value: displayJobDescription.length > 50 ? `${displayJobDescription.substring(0, 50)}…` : displayJobDescription },
                            { label: 'Service Provider', value: displayCompanyName },
                            {
                                label: 'Proof Status', value: proofUploaded
                                    ? <span className="text-emerald-600 font-semibold text-sm flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Uploaded</span>
                                    : <span className="text-amber-600 font-semibold text-sm">Not yet uploaded</span>
                            },
                        ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between px-5 py-3 text-sm">
                                <span className="text-gray-500">{label}</span>
                                <span className="font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">What happens next</h3>
                    </div>
                    <div className="p-5">
                        <ol className="space-y-3">
                            {[
                                'Admin checks our bank account for your transfer',
                                'Verifies the amount and reference code match',
                                'Updates your job status accordingly',
                                'Notifies you and the service provider',
                            ].map((step, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                    <span className="w-5 h-5 rounded-full bg-naijaGreen/10 text-naijaGreen text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <div className="space-y-3">
                    {!proofUploaded && (
                        <button onClick={() => navigate(-1)} className="w-full bg-naijaGreen text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-darkGreen transition flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload Proof of Payment
                        </button>
                    )}
                    <button onClick={copyReference} className={`w-full py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 border-2 ${copied ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                        {copied
                            ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Copied!</>
                            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Reference Code</>
                        }
                    </button>
                    <Link to="/dashboard#myJobs" className="block w-full py-3.5 rounded-2xl font-bold text-sm text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                        View My Jobs
                    </Link>
                </div>

                <div className="text-center text-xs text-gray-400 pb-4 space-y-1">
                    <p>⏰ Verification usually takes 5–15 minutes after proof upload</p>
                    <p>Need help? <a href="mailto:info@mountltd.com" className="text-naijaGreen hover:underline">info@mountltd.com</a> · 08139672432</p>
                    <p className="mt-1">Reference: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono">{reference}</code></p>
                </div>
            </div>
        </div>
    );
};

export default PaymentPending;