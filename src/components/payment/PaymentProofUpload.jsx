// src/components/payment/PaymentPending.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
// BUG FIX: .replace('_', ' ') only replaces first underscore — use global regex
const fmtType = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const PaymentPending = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { supabase } = useSupabase();

    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Data passed from BankTransferPayment via navigate state
    const { reference, amount, paymentType, jobId } = location.state || {};

    // BUG FIX: guard runs in useEffect (can't call navigate before hooks)
    useEffect(() => {
        if (!reference || !jobId) {
            navigate('/dashboard', { replace: true });
            return;
        }
        fetchPaymentDetails();
    }, [reference, jobId]);

    const fetchPaymentDetails = async () => {
        try {
            // BUG FIX: companies is a single FK relation → Supabase returns an object, not an array.
            // Original used companies?.[0]?.company_name which always returned undefined.
            const { data, error } = await supabase
                .from('financial_transactions')
                .select(`
                    *,
                    jobs (
                        description,
                        status,
                        company_id,
                        companies (
                            company_name
                        )
                    )
                `)
                .eq('bank_reference', reference)
                .single();

            if (error) throw error;
            setPaymentDetails(data);
        } catch (err) {
            console.error('Error fetching payment details:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(reference);
        } catch {
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

    // BUG FIX: companies is an object (single FK), not array
    const displayAmount = amount || paymentDetails?.amount || 0;
    const displayType = paymentType || paymentDetails?.type || 'bank_transfer';
    const jobDescription = paymentDetails?.jobs?.description || 'Service Job';
    const companyName = paymentDetails?.jobs?.companies?.company_name || 'Service Provider';
    const proofUploaded = !!paymentDetails?.proof_of_payment_url;

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Sticky header */}
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

                {/* Status hero */}
                <div className={`rounded-2xl p-6 text-center ${proofUploaded ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${proofUploaded ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        <span className="text-3xl">{proofUploaded ? '✅' : '⏳'}</span>
                    </div>
                    <h2 className={`text-xl font-bold mb-2 ${proofUploaded ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {proofUploaded ? 'Proof Received — Pending Verification' : 'Awaiting Admin Verification'}
                    </h2>
                    <p className={`text-sm ${proofUploaded ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {proofUploaded
                            ? 'Your proof of payment has been uploaded. Admin will verify within 5–15 minutes.'
                            : 'If you have not yet uploaded your proof of payment, please go back and upload it now.'}
                    </p>
                </div>

                {/* Payment details card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Payment Details</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[
                            { label: 'Reference', value: <code className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-sm">{reference}</code> },
                            { label: 'Amount', value: <span className="font-bold text-naijaGreen text-lg">{fmt(displayAmount)}</span> },
                            { label: 'Payment Type', value: fmtType(displayType) },
                            { label: 'Job', value: jobDescription.length > 50 ? `${jobDescription.substring(0, 50)}…` : jobDescription },
                            { label: 'Service Provider', value: companyName },
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

                {/* What happens next */}
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

                {/* Actions */}
                <div className="space-y-3">
                    {/* If proof not yet uploaded, prompt them to go back */}
                    {!proofUploaded && (
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full bg-naijaGreen text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-darkGreen transition flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Upload Proof of Payment
                        </button>
                    )}

                    {/* Copy reference — inline feedback, no alert() */}
                    <button
                        onClick={copyReference}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 border-2 ${copied
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {copied ? (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
                        ) : (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Reference Code</>
                        )}
                    </button>

                    <Link
                        to="/dashboard#myJobs"
                        className="block w-full py-3.5 rounded-2xl font-bold text-sm text-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    >
                        View My Jobs
                    </Link>
                </div>

                {/* Support footer */}
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