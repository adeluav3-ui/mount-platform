// src/components/MyJobs.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import { useMessaging } from '../context/MessagingContext';
import ChatModal from './chat/ChatModal';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

// ─── PAYMENT BREAKDOWN ROW ───────────────────────────────────────────────────
const PRow = ({ label, value, valueClass = 'text-gray-900', bold = false }) => (
    <div className="flex items-center justify-between py-2">
        <span className={`text-sm ${bold ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{label}</span>
        <span className={`text-sm font-bold ${valueClass}`}>{value}</span>
    </div>
);

const PDivider = () => <div className="h-px bg-gray-100 my-1" />;

// ─── CONFIRMATION MODAL ──────────────────────────────────────────────────────
const ConfirmModal = ({ isOpen, title, message, confirmLabel = 'Confirm', confirmClass = 'bg-naijaGreen hover:bg-darkGreen', onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={loading} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading} className={`flex-1 py-3 rounded-xl text-white font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 ${confirmClass}`}>
                        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Working…</> : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── DISPUTE MODAL ────────────────────────────────────────────────────────────
const DisputeModal = ({ isOpen, title, placeholder, onSubmit, onCancel, loading }) => {
    const [text, setText] = useState('');
    useEffect(() => { if (isOpen) setText(''); }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
                <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-naijaGreen/30 focus:border-naijaGreen mb-4"
                />
                <p className="text-xs text-gray-400 mb-4">{text.trim().length} / min 10 characters</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={loading} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={() => onSubmit(text)} disabled={loading || text.trim().length < 10} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</> : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: { label: 'Awaiting Quotes', color: 'bg-gray-100 text-gray-600' },
    price_set: { label: 'Quote Available', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    awaiting_payment: { label: 'Awaiting Payment', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
    deposit_paid: { label: 'Work Ongoing', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
    work_ongoing: { label: 'Materials Payment Due', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
    intermediate_paid: { label: 'Materials Funded', color: 'bg-indigo-100 text-indigo-700 border border-indigo-200' },
    work_completed: { label: 'Work Completed', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
    work_disputed: { label: 'Issue Reported', color: 'bg-red-100 text-red-700 border border-red-200' },
    work_rectified: { label: 'Fix Ready — Review', color: 'bg-amber-100 text-amber-700 border border-amber-200' },
    work_rejected: { label: 'Needs Review', color: 'bg-red-100 text-red-700 border border-red-200' },
    under_review: { label: 'Company Reviewing', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
    ready_for_final_payment: { label: 'Processing Final Payment', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
    awaiting_final_payment: { label: 'Final Payment Pending', color: 'bg-violet-100 text-violet-700 border border-violet-200' },
    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    declined: { label: 'Declined', color: 'bg-red-100 text-red-600' },
    declined_by_company: { label: 'Declined by Company', color: 'bg-red-100 text-red-600' },
    onsite_fee_requested: { label: 'Onsite Fee Required', color: 'bg-orange-100 text-orange-700 border border-orange-200' },
    onsite_fee_pending_confirmation: { label: 'Awaiting Confirmation', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
};

const getStatusCfg = (job) => {
    const key = (job.quoted_price && job.status === 'price_set') ? 'price_set' : (job.status || 'pending');
    return STATUS_CONFIG[key] || { label: 'Awaiting Quotes', color: 'bg-gray-100 text-gray-600' };
};

// ─── SPIN ─────────────────────────────────────────────────────────────────────
const Spin = ({ className = 'w-4 h-4' }) => (
    <div className={`border-2 border-white border-t-transparent rounded-full animate-spin ${className}`} />
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MyJobs({ onHasNewQuotes }) {
    const navigate = useNavigate();
    const { user, supabase } = useSupabase();
    const { createConversation,
        setActiveConversation } = useMessaging();

    const [jobs, setJobs] = useState([]);
    const [companyNames, setCompanyNames] = useState({});
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(null);
    const [hasNewQuotes, setHasNewQuotes] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [toast, setToast] = useState(null); // { msg, type: 'success'|'error' }

    // ── Modals ────────────────────────────────────────────────────────────────
    const [confirmModal, setConfirmModal] = useState(null); // { title, message, confirmLabel, confirmClass, onConfirm }
    const [disputeModal, setDisputeModal] = useState(null); // { title, placeholder, onSubmit }
    const [modalLoading, setModalLoading] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── loadJobs ──────────────────────────────────────────────────────────────
    const loadJobs = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);

        try {
            const { data: jobsData, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            const jobsList = jobsData || [];

            if (jobsList.length > 0) {
                const jobIds = jobsList.map(j => j.id);

                // BUG FIX: original did a bulk fetch then immediately re-fetched per job
                // inside Promise.all (N+1). Now: single bulk fetch, then group client-side.
                const { data: allPayments } = await supabase
                    .from('financial_transactions')
                    .select('job_id, type, amount, status, verified_by_admin')
                    .in('job_id', jobIds)
                    .eq('status', 'completed')
                    .eq('verified_by_admin', true);

                // Also grab pending intermediate so we can flag it
                const { data: pendingIntermediates } = await supabase
                    .from('financial_transactions')
                    .select('job_id')
                    .in('job_id', jobIds)
                    .eq('type', 'intermediate')
                    .eq('status', 'pending');

                // Group payments by job_id
                const paymentsByJob = {};
                (allPayments || []).forEach(p => {
                    if (!paymentsByJob[p.job_id]) paymentsByJob[p.job_id] = [];
                    paymentsByJob[p.job_id].push(p);
                });

                const pendingIntSet = new Set((pendingIntermediates || []).map(p => p.job_id));

                const jobsWithPaymentData = jobsList.map(job => {
                    const payments = paymentsByJob[job.id] || [];
                    const quotedPrice = job.quoted_price || 0;

                    let depositPaid = 0, intermediatePaid = 0, finalPaid = 0;
                    let hasDeposit = false, hasIntermediate = false, hasFinal = false;

                    // BUG FIX: service fee removed — platform_fee is always 0 now.
                    // depositPaid = full deposit amount (no subtraction needed).
                    payments.forEach(p => {
                        if (p.type === 'deposit') {
                            depositPaid += p.amount || 0;
                            hasDeposit = true;
                        } else if (p.type === 'intermediate') {
                            intermediatePaid += p.amount || 0;
                            hasIntermediate = true;
                        } else if (p.type === 'final_payment') {
                            finalPaid += p.amount || 0;
                            hasFinal = true;
                        }
                    });

                    const totalPaid = depositPaid + intermediatePaid + finalPaid;
                    const balanceDue = Math.max(0, quotedPrice - totalPaid);

                    return {
                        ...job,
                        paymentData: {
                            depositPaid,
                            intermediatePaid,
                            finalPaid,
                            totalPaid,
                            balanceDue,
                            hasDeposit,
                            hasIntermediate,
                            hasFinal,
                            pendingIntermediate: pendingIntSet.has(job.id),
                        },
                    };
                });

                setJobs(jobsWithPaymentData);

                // Fetch company names (bulk IN query)
                const companyIds = [...new Set(
                    jobsList.flatMap(j => [j.company_id, j.declined_by_company_id]).filter(Boolean)
                )];

                if (companyIds.length > 0) {
                    const { data: companies } = await supabase
                        .from('companies').select('id, company_name').in('id', companyIds);
                    if (companies) {
                        const map = {};
                        companies.forEach(c => { map[c.id] = c.company_name; });
                        setCompanyNames(map);
                    }
                }

                const newQuoted = jobsList.filter(j => j.quoted_price && j.status === 'price_set');
                setHasNewQuotes(newQuoted.length > 0);
                if (onHasNewQuotes) onHasNewQuotes(newQuoted.length > 0);

            } else {
                setJobs([]);
                setHasNewQuotes(false);
                if (onHasNewQuotes) onHasNewQuotes(false);
            }

        } catch (err) {
            showToast('Failed to load jobs. Please refresh.', 'error');
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, supabase, onHasNewQuotes]);

    useEffect(() => {
        if (!user?.id) return;
        loadJobs();

        const channel = supabase
            .channel(`customer-jobs-${user.id}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'jobs',
                filter: `customer_id=eq.${user.id}`,
            }, () => loadJobs())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.id]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getCompanyName = (job) => {
        const id = job.declined_by_company_id || job.company_id;
        return id ? (companyNames[id] || 'Service Provider') : 'Awaiting assignment';
    };

    const navigate2Pay = (jobId) => navigate(`/payment/${jobId}`);

    // ── Action handlers ───────────────────────────────────────────────────────
    const handleAcceptQuote = (job) => {
        const companyName = getCompanyName(job);
        setConfirmModal({
            title: 'Accept Quote & Pay',
            message: `Accept the quote from ${companyName}?\n\nTotal: ${fmt(job.quoted_price)}\nDeposit now (50%): ${fmt(job.quoted_price * 0.5)}\n\nYou'll be taken to the payment page.`,
            confirmLabel: 'Accept & Pay',
            onConfirm: async () => {
                setModalLoading(true);
                try {
                    const { error } = await supabase.from('jobs')
                        .update({ status: 'price_set', upfront_payment: job.quoted_price * 0.5, updated_at: new Date().toISOString() })
                        .eq('id', job.id);
                    if (error) throw error;
                    setConfirmModal(null);
                    navigate2Pay(job.id);
                } catch (err) {
                    showToast('Failed to initialise payment. Please try again.', 'error');
                } finally {
                    setModalLoading(false);
                }
            },
        });
    };

    const handleDeclineQuote = (job) => {
        const companyName = getCompanyName(job);
        setConfirmModal({
            title: 'Decline Quote',
            message: `Are you sure you want to decline the quote from ${companyName}?\n\nThis job will be cancelled.`,
            confirmLabel: 'Decline',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                setModalLoading(true);
                try {
                    const { data: jobRow } = await supabase.from('jobs').select('company_id').eq('id', job.id).single();
                    await supabase.from('jobs').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', job.id);
                    if (jobRow?.company_id) {
                        await supabase.from('notifications').insert({
                            user_id: jobRow.company_id, job_id: job.id, type: 'quote_declined',
                            title: 'Quote Declined', message: `Customer declined your quote for job #${job.id.substring(0, 8)}.`, read: false,
                        });
                    }
                    setConfirmModal(null);
                    showToast('Quote declined. Company has been notified.');
                    loadJobs();
                } catch (err) {
                    showToast('Failed to decline quote.', 'error');
                } finally {
                    setModalLoading(false);
                }
            },
        });
    };

    const handlePayOnsiteFee = (job) => {
        const companyName = getCompanyName(job);
        const fee = job.onsite_fee_amount;
        setConfirmModal({
            title: 'Confirm Onsite Fee Payment',
            message: `Confirm that you've paid ${fmt(fee)} to ${companyName}?\n\n• ${companyName} will be notified\n• They'll confirm receipt on their dashboard\n• Once confirmed, they'll visit your location\n\nOnly confirm if you've already made the transfer.`,
            confirmLabel: `I've Paid ${fmt(fee)}`,
            confirmClass: 'bg-orange-600 hover:bg-orange-700',
            onConfirm: async () => {
                setModalLoading(true);
                try {
                    await supabase.from('jobs').update({
                        status: 'onsite_fee_pending_confirmation',
                        onsite_fee_paid: false, onsite_fee_paid_at: null,
                        updated_at: new Date().toISOString(),
                    }).eq('id', job.id);
                    if (job.company_id) {
                        await supabase.from('notifications').insert({
                            user_id: job.company_id, job_id: job.id,
                            type: 'onsite_fee_pending_confirmation',
                            title: 'Onsite Fee Payment Claimed',
                            message: `Customer claims to have paid ${fmt(fee)} for onsite check. Please confirm receipt.`,
                            metadata: { fee_amount: fee, claimed_at: new Date().toISOString(), requires_action: true },
                            read: false, created_at: new Date().toISOString(),
                        });
                    }
                    setConfirmModal(null);
                    showToast(`Payment claimed. ${companyName} has been notified to confirm receipt.`);
                    loadJobs();
                } catch (err) {
                    showToast('Failed to claim payment. Please try again.', 'error');
                } finally {
                    setModalLoading(false);
                }
            },
        });
    };

    const handleDeclineOnsiteFee = (job) => {
        const companyName = getCompanyName(job);
        setConfirmModal({
            title: 'Decline Onsite Check',
            message: `Decline the onsite check fee from ${companyName}?\n\nThis job will be cancelled.`,
            confirmLabel: 'Decline & Cancel',
            confirmClass: 'bg-red-600 hover:bg-red-700',
            onConfirm: async () => {
                setModalLoading(true);
                try {
                    await supabase.from('jobs').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', job.id);
                    if (job.company_id) {
                        await supabase.from('notifications').insert({
                            user_id: job.company_id, job_id: job.id, type: 'onsite_fee_declined',
                            title: 'Onsite Fee Declined',
                            message: `Customer declined the onsite check fee. Job #${job.id.substring(0, 8)} has been cancelled.`,
                            read: false, created_at: new Date().toISOString(),
                        });
                    }
                    setConfirmModal(null);
                    showToast('Onsite check declined. Job has been cancelled.');
                    loadJobs();
                } catch (err) {
                    showToast('Failed to decline. Please try again.', 'error');
                } finally {
                    setModalLoading(false);
                }
            },
        });
    };

    const handleApproveWork = (job) => {
        const companyName = getCompanyName(job);
        const pd = job.paymentData;
        const balanceDue = pd?.balanceDue ?? (pd?.hasIntermediate ? job.quoted_price * 0.2 : job.quoted_price * 0.5);
        const balancePct = pd?.hasIntermediate ? '20%' : '50%';
        setConfirmModal({
            title: 'Confirm Work Completed',
            message: `Are you satisfied with the work done by ${companyName}?\n\nThis will proceed to the final payment of ${fmt(balanceDue)} (${balancePct}).\n\nTotal Job: ${fmt(job.quoted_price)}\nAlready Paid: ${fmt(pd?.totalPaid || 0)}\nFinal Payment: ${fmt(balanceDue)}`,
            confirmLabel: `Pay ${fmt(balanceDue)} Balance`,
            onConfirm: () => { setConfirmModal(null); navigate2Pay(job.id); },
        });
    };

    const handlePayIntermediate = (jobId) => navigate2Pay(jobId);

    const handleReportWorkIssue = (job) => {
        const companyName = getCompanyName(job);
        setDisputeModal({
            title: `Report Issue — ${companyName}`,
            placeholder: 'Describe what\'s wrong with the work. Be specific so they can fix it properly…',
            onSubmit: async (details) => {
                setModalLoading(true);
                try {
                    const { data: jobRow } = await supabase
                        .from('jobs').select('id, company_id, customer_id').eq('id', job.id).eq('customer_id', user.id).single();
                    await supabase.from('jobs').update({
                        status: 'work_disputed', dispute_reason: details.trim(),
                        updated_at: new Date().toISOString(),
                    }).eq('id', job.id).eq('customer_id', user.id);
                    if (jobRow?.company_id) {
                        await supabase.from('notifications').insert({
                            user_id: jobRow.company_id, job_id: job.id, type: 'work_disputed',
                            title: 'Work Issue Reported',
                            message: `Customer reported an issue with job #${job.id.substring(0, 8)}: "${details.substring(0, 100)}${details.length > 100 ? '…' : ''}"`,
                            metadata: { issue_details: details.trim(), customer_id: jobRow.customer_id, requires_action: true },
                            read: false,
                        });
                    }
                    setDisputeModal(null);
                    showToast(`Issue reported to ${companyName}. They'll be in touch to arrange fixes.`);
                    loadJobs();
                } catch (err) {
                    showToast(`Failed to report issue: ${err.message || 'Please try again.'}`, 'error');
                } finally {
                    setModalLoading(false);
                }
            },
        });
    };

    const handleReportWorkIssueAgain = (job) => {
        const companyName = getCompanyName(job);
        setDisputeModal({
            title: `Still Not Satisfied — ${companyName}`,
            placeholder: 'Explain what\'s still wrong. Be specific so they can fix it properly…',
            onSubmit: async (details) => {
                setModalLoading(true);
                try {
                    await supabase.from('jobs').update({
                        status: 'work_disputed', dispute_reason: details.trim(),
                        updated_at: new Date().toISOString(),
                    }).eq('id', job.id).eq('customer_id', user.id);
                    if (job.company_id) {
                        await supabase.from('notifications').insert({
                            user_id: job.company_id, job_id: job.id, type: 'work_disputed_again',
                            title: 'Work Still Not Satisfactory',
                            message: `Customer says work is still unsatisfactory for job #${job.id.substring(0, 8)}: "${details.substring(0, 100)}${details.length > 100 ? '…' : ''}"`,
                            metadata: { issue_details: details.trim(), customer_id: user.id, requires_action: true },
                            read: false,
                        });
                    }
                    setDisputeModal(null);
                    showToast(`Issue re-reported to ${companyName}.`);
                    loadJobs();
                } catch (err) {
                    showToast(`Failed to report issue: ${err.message || 'Please try again.'}`, 'error');
                } finally {
                    setModalLoading(false);
                }
            },
        });
    };

    const handleStartChat = async (job) => {
        try {
            const conversation = await createConversation(job.company_id, job.id);
            setActiveConversation(conversation);
            setShowChat(true);
        } catch {
            showToast('Failed to open chat. Please try again.', 'error');
        }
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const BtnPrimary = ({ onClick, disabled, loading: l, children, className = '' }) => (
        <button onClick={onClick} disabled={disabled || l}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-naijaGreen hover:bg-darkGreen transition disabled:opacity-50 flex items-center justify-center gap-2 ${className}`}>
            {l ? <><Spin />Processing…</> : children}
        </button>
    );

    const BtnDanger = ({ onClick, disabled, children }) => (
        <button onClick={onClick} disabled={disabled}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-red-600 bg-white border-2 border-red-200 hover:bg-red-50 transition disabled:opacity-50">
            {children}
        </button>
    );

    const BtnSecondary = ({ onClick, disabled, children }) => (
        <button onClick={onClick} disabled={disabled}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition disabled:opacity-50">
            {children}
        </button>
    );

    // ─── LOADING ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-[3px] border-naijaGreen border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm font-medium">Loading your jobs…</p>
        </div>
    );

    // ─── RENDER ───────────────────────────────────────────────────────────────
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}>
                    {toast.type === 'error'
                        ? <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        : <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    }
                    {toast.msg}
                </div>
            )}

            {/* Modals */}
            <ConfirmModal
                isOpen={!!confirmModal}
                {...confirmModal}
                loading={modalLoading}
                onCancel={() => { setConfirmModal(null); setModalLoading(false); }}
            />
            <DisputeModal
                isOpen={!!disputeModal}
                {...disputeModal}
                loading={modalLoading}
                onCancel={() => { setDisputeModal(null); setModalLoading(false); }}
            />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
                <p className="text-gray-500 text-sm mt-0.5">Review quotes and track your active jobs</p>
                {hasNewQuotes && (
                    <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                        <span className="text-base">📬</span>
                        <p className="text-emerald-800 text-sm font-semibold">New quote available — review below</p>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {jobs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-6xl mb-4">🔧</div>
                    <p className="text-xl font-bold text-gray-800 mb-2">No jobs yet</p>
                    <p className="text-gray-500 text-sm mb-6">Post your first job and get quotes from verified providers.</p>
                    <button onClick={() => window.location.hash = 'postJob'}
                        className="bg-naijaGreen text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-darkGreen transition">
                        Post Your First Job
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {jobs.map(job => {
                        const cName = getCompanyName(job);
                        const hasQuote = job.quoted_price > 0;
                        const status = job.status || 'pending';
                        const pd = job.paymentData;
                        const busy = isProcessing === job.id;
                        const { label, color } = getStatusCfg(job);

                        // Computed payment values
                        const depositAmt = pd?.depositPaid ?? (job.quoted_price * 0.5);
                        const intAmt = pd?.intermediatePaid ?? 0;
                        const balanceDue = pd?.balanceDue ?? job.quoted_price * 0.5;
                        const balancePct = pd?.hasIntermediate ? '20%' : '50%';
                        const totalPaid = pd?.totalPaid ?? 0;

                        return (
                            <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">

                                {/* ── Job Header ── */}
                                <div className="px-5 py-4 border-b border-gray-50 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 text-base leading-tight">
                                            {job.category}
                                            {job.sub_service && <span className="text-gray-500 font-normal"> · {job.sub_service}</span>}
                                        </h3>
                                        {job.custom_sub_description && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{job.custom_sub_description}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">Posted {fmtDate(job.created_at)}</p>
                                    </div>
                                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${color}`}>
                                        {label}
                                    </span>
                                </div>

                                <div className="p-5 space-y-4">

                                    {/* ── Provider row ── */}
                                    {job.company_id && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <div>
                                                <p className="text-xs text-gray-400 mb-0.5">Service Provider</p>
                                                <p className="font-bold text-naijaGreen text-sm">{cName}</p>
                                            </div>
                                            <button onClick={() => handleStartChat(job)}
                                                className="flex items-center gap-1.5 bg-naijaGreen text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-darkGreen transition">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Message
                                            </button>
                                        </div>
                                    )}

                                    {/* ═══════════════════════════════════════════
                                        STATUS PANELS
                                    ════════════════════════════════════════════ */}

                                    {/* QUOTE AVAILABLE */}
                                    {hasQuote && status === 'price_set' && (
                                        <div className="space-y-3">
                                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">Quote Received</p>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm text-gray-600">Total Quote</span>
                                                    <span className="text-xl font-bold text-gray-900">{fmt(job.quoted_price)}</span>
                                                </div>
                                                <PDivider />
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm text-gray-600">Pay Now (50% deposit)</span>
                                                    <span className="text-lg font-bold text-naijaGreen">{fmt(job.quoted_price * 0.5)}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <BtnPrimary onClick={() => handleAcceptQuote(job)} disabled={busy} loading={busy}>
                                                    Accept & Pay
                                                </BtnPrimary>
                                                <BtnDanger onClick={() => handleDeclineQuote(job)} disabled={busy}>
                                                    Decline
                                                </BtnDanger>
                                            </div>
                                        </div>
                                    )}

                                    {/* AWAITING PAYMENT */}
                                    {status === 'awaiting_payment' && (
                                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-base">⏳</div>
                                            <div>
                                                <p className="font-semibold text-amber-800 text-sm">Payment in Progress</p>
                                                <p className="text-xs text-amber-600 mt-0.5">Redirecting to payment page…</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* DEPOSIT PAID — WORK ONGOING */}
                                    {status === 'deposit_paid' && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1">
                                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Work in Progress</p>
                                            <p className="text-sm text-blue-700 mb-3">{cName} has received your deposit and is working on your job.</p>
                                            <div className="bg-white rounded-xl p-3 space-y-0.5">
                                                <PRow label="Deposit Paid (50%)" value={fmt(depositAmt)} valueClass="text-blue-700" />
                                                <PDivider />
                                                {/* BUG FIX: was hardcoded "50%" — now dynamic */}
                                                <PRow label={`Balance Due (${pd?.hasIntermediate ? '20%' : '50%'})`} value={fmt(balanceDue)} bold />
                                                <PRow label="Total Paid" value={fmt(totalPaid)} valueClass="text-emerald-600" />
                                            </div>
                                            <p className="text-xs text-blue-500 text-center pt-1">You'll be notified when {cName} marks the work as completed.</p>
                                        </div>
                                    )}

                                    {/* WORK ONGOING — INTERMEDIATE PAYMENT REQUESTED */}
                                    {status === 'work_ongoing' && (
                                        <div className="space-y-3">
                                            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 text-base">📦</div>
                                                    <div>
                                                        <p className="font-semibold text-violet-800 text-sm">Materials Payment Requested</p>
                                                        <p className="text-xs text-violet-600 mt-0.5">{cName} needs 30% to purchase materials for your job.</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-xl p-3 space-y-0.5">
                                                    <PRow label="Deposit Paid (50%)" value={fmt(depositAmt)} valueClass="text-blue-700" />
                                                    {pd?.hasIntermediate && <PRow label="Materials Paid (30%)" value={fmt(intAmt)} valueClass="text-violet-700" />}
                                                    <PDivider />
                                                    <PRow label={`Final Balance (${balancePct})`} value={fmt(balanceDue)} valueClass="text-naijaGreen" bold />
                                                    <PRow label="Total Job" value={fmt(job.quoted_price)} />
                                                </div>
                                            </div>
                                            <BtnPrimary onClick={() => handlePayIntermediate(job.id)} disabled={busy} loading={busy}
                                                className="bg-violet-600 hover:bg-violet-700">
                                                💰 Pay 30% for Materials — {fmt(job.quoted_price * 0.3)}
                                            </BtnPrimary>
                                            <p className="text-xs text-violet-400 text-center">This payment funds materials needed to complete your job.</p>
                                        </div>
                                    )}

                                    {/* INTERMEDIATE PAID */}
                                    {status === 'intermediate_paid' && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-indigo-800 text-sm">Materials Payment Confirmed</p>
                                                    <p className="text-xs text-indigo-600 mt-0.5">{cName} will now purchase materials and continue work.</p>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-xl p-3 space-y-0.5">
                                                <PRow label="Deposit Paid (50%)" value={fmt(depositAmt)} valueClass="text-emerald-600" />
                                                <PRow label="Materials Paid (30%)" value={fmt(intAmt)} valueClass="text-violet-600" />
                                                <PDivider />
                                                <PRow label="Final Due (20%)" value={fmt(job.quoted_price * 0.2)} valueClass="text-blue-600" bold />
                                                <PRow label="Total Job" value={fmt(job.quoted_price)} />
                                            </div>
                                            <p className="text-xs text-indigo-400 text-center mt-3">{cName} will mark work as completed. You'll then pay the final 20%.</p>
                                        </div>
                                    )}

                                    {/* WORK COMPLETED */}
                                    {status === 'work_completed' && (
                                        <div className="space-y-3">
                                            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 text-base">🏁</div>
                                                    <div>
                                                        <p className="font-semibold text-orange-800 text-sm">Work Completed!</p>
                                                        <p className="text-xs text-orange-600 mt-0.5">{cName} has marked this job as done. Please inspect the work.</p>
                                                    </div>
                                                </div>
                                                <div className="bg-white rounded-xl p-3 space-y-0.5">
                                                    <PRow label="Deposit Paid (50%)" value={fmt(depositAmt)} valueClass="text-blue-700" />
                                                    {pd?.hasIntermediate && <PRow label="Materials Paid (30%)" value={fmt(intAmt)} valueClass="text-violet-700" />}
                                                    <PDivider />
                                                    <PRow label={`Final Balance (${balancePct})`} value={fmt(balanceDue)} valueClass="text-naijaGreen" bold />
                                                    <PRow label="Total Paid So Far" value={fmt(totalPaid)} valueClass="text-emerald-600" />
                                                    <PRow label="Total Job" value={fmt(job.quoted_price)} />
                                                </div>
                                            </div>
                                            <BtnPrimary onClick={() => handleApproveWork(job)} disabled={busy} loading={busy}>
                                                ✅ Work Done — Pay {balancePct} Balance
                                            </BtnPrimary>
                                            <BtnDanger onClick={() => handleReportWorkIssue(job)} disabled={busy}>
                                                ❌ Report an Issue
                                            </BtnDanger>
                                        </div>
                                    )}

                                    {/* WORK DISPUTED */}
                                    {status === 'work_disputed' && (
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0 text-base">⚠️</div>
                                                <div>
                                                    <p className="font-semibold text-red-800 text-sm">Issue Reported</p>
                                                    <p className="text-xs text-red-600 mt-0.5">{cName} has been notified and will contact you to arrange fixes.</p>
                                                </div>
                                            </div>
                                            {job.dispute_reason && (
                                                <div className="bg-white rounded-xl p-3 border border-red-100">
                                                    <p className="text-xs text-gray-400 mb-1">Your reported issue</p>
                                                    <p className="text-sm text-gray-800">{job.dispute_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* WORK RECTIFIED */}
                                    {status === 'work_rectified' && (
                                        <div className="space-y-3">
                                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-base">🔧</div>
                                                    <div>
                                                        <p className="font-semibold text-amber-800 text-sm">Fix Ready — Please Review</p>
                                                        <p className="text-xs text-amber-600 mt-0.5">{cName} has addressed your concern. Please inspect the work.</p>
                                                    </div>
                                                </div>
                                                {job.dispute_reason && (
                                                    <div className="bg-white rounded-xl p-3 border border-amber-100 mb-3">
                                                        <p className="text-xs text-gray-400 mb-1">Your reported issue</p>
                                                        <p className="text-sm text-gray-700">{job.dispute_reason}</p>
                                                    </div>
                                                )}
                                                <div className="bg-white rounded-xl p-3 space-y-0.5">
                                                    <PRow label="Deposit Paid (50%)" value={fmt(depositAmt)} valueClass="text-blue-700" />
                                                    {pd?.hasIntermediate && <PRow label="Materials Paid (30%)" value={fmt(intAmt)} valueClass="text-violet-700" />}
                                                    <PDivider />
                                                    {/* BUG FIX: was using totalPaidWithFees which included dead serviceFeePaid */}
                                                    <PRow label={`Final Balance (${pd?.hasFinal ? '0%' : balancePct})`} value={fmt(balanceDue)} valueClass="text-naijaGreen" bold />
                                                    <PRow label="Total Paid" value={fmt(totalPaid)} valueClass="text-emerald-600" />
                                                    <PRow label="Total Job" value={fmt(job.quoted_price)} />
                                                </div>
                                            </div>
                                            <BtnPrimary onClick={() => handleApproveWork(job)} disabled={busy} loading={busy}>
                                                ✅ Accept Fix & Pay Balance
                                            </BtnPrimary>
                                            <BtnDanger onClick={() => handleReportWorkIssueAgain(job)} disabled={busy}>
                                                ❌ Still Not Satisfied
                                            </BtnDanger>
                                        </div>
                                    )}

                                    {/* READY / AWAITING FINAL PAYMENT */}
                                    {(status === 'ready_for_final_payment' || status === 'awaiting_final_payment') && (
                                        <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                                            <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                                <div className="w-4 h-4 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-violet-800 text-sm">Final Payment Processing</p>
                                                {/* BUG FIX: was hardcoded "50%" — now shows correct pct */}
                                                <p className="text-xs text-violet-600 mt-0.5">Completing your final {balancePct} payment…</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* COMPLETED */}
                                    {status === 'completed' && (
                                        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-emerald-800 text-sm">Job Completed!</p>
                                                <p className="text-xs text-emerald-600 mt-0.5">All payments to {cName} are complete. Thank you for using Mount.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* WORK REJECTED */}
                                    {status === 'work_rejected' && (
                                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-base">⚠️</div>
                                            <div>
                                                <p className="font-semibold text-red-800 text-sm">Work Needs Review</p>
                                                <p className="text-xs text-red-600 mt-0.5">{cName} has been notified and will contact you to arrange fixes.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ONSITE FEE REQUESTED */}
                                    {status === 'onsite_fee_requested' && (() => {
                                        let bankDetails = null;
                                        try {
                                            bankDetails = typeof job.onsite_fee_bank_details === 'string'
                                                ? JSON.parse(job.onsite_fee_bank_details)
                                                : job.onsite_fee_bank_details;
                                        } catch { }

                                        return (
                                            <div className="space-y-3">
                                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                                                    <div className="flex items-start gap-3 mb-3">
                                                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 text-base">🏠</div>
                                                        <div>
                                                            <p className="font-semibold text-orange-800 text-sm">Onsite Check Fee Required</p>
                                                            <p className="text-xs text-orange-600 mt-0.5">{cName} needs to visit your location for assessment.</p>
                                                        </div>
                                                    </div>

                                                    {bankDetails ? (
                                                        <div className="bg-gray-900 rounded-2xl p-4 mb-3">
                                                            <p className="text-white/50 text-xs mb-3 uppercase tracking-wide">Send Payment To</p>
                                                            <div className="space-y-2">
                                                                {[
                                                                    { label: 'Bank', value: bankDetails.bank_name },
                                                                    { label: 'Account Name', value: bankDetails.account_name },
                                                                    { label: 'Account Number', value: bankDetails.account_number },
                                                                ].map(({ label, value }) => (
                                                                    <div key={label} className="flex justify-between items-center">
                                                                        <span className="text-white/50 text-xs">{label}</span>
                                                                        <span className="text-white font-bold text-sm">{value}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                                                                    <span className="text-white/50 text-xs">Amount</span>
                                                                    <span className="text-orange-400 font-bold text-lg">{fmt(job.onsite_fee_amount)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gray-50 rounded-xl p-3 mb-3 text-sm text-gray-500">Bank details not available. Contact {cName} directly.</div>
                                                    )}

                                                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-1">
                                                        <p className="text-xs font-bold text-red-700 mb-1">⚠️ Important</p>
                                                        <ul className="space-y-0.5 text-xs text-red-600">
                                                            <li>• Send ONLY the onsite check fee ({fmt(job.onsite_fee_amount)})</li>
                                                            <li>• Do NOT send job payment to this account</li>
                                                            <li>• Job payments must be made through the app</li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                <BtnPrimary onClick={() => handlePayOnsiteFee(job)} disabled={busy} loading={busy}
                                                    className="bg-orange-600 hover:bg-orange-700">
                                                    ✅ I've Paid {fmt(job.onsite_fee_amount)}
                                                </BtnPrimary>
                                                <BtnSecondary onClick={() => handleDeclineOnsiteFee(job)} disabled={busy}>
                                                    Decline Onsite Check
                                                </BtnSecondary>
                                            </div>
                                        );
                                    })()}

                                    {/* ONSITE FEE PENDING CONFIRMATION */}
                                    {status === 'onsite_fee_pending_confirmation' && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                                    <div className="w-4 h-4 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-blue-800 text-sm">Awaiting Company Confirmation</p>
                                                    <p className="text-xs text-blue-600 mt-0.5">{cName} is confirming receipt of your {fmt(job.onsite_fee_amount)} payment.</p>
                                                </div>
                                            </div>
                                            <div className="bg-white rounded-xl p-3 border border-blue-100">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Amount Paid</span>
                                                    <span className="font-bold text-blue-700">{fmt(job.onsite_fee_amount)}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">Once confirmed, {cName} will visit your location.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* PENDING + COMPANY ASSIGNED */}
                                    {status === 'pending' && job.company_id && (
                                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                            <div className="w-4 h-4 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                                            <p className="text-sm font-medium text-blue-700">Awaiting quote from {cName}</p>
                                        </div>
                                    )}

                                    {/* DECLINED BY COMPANY */}
                                    {status === 'declined_by_company' && (
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0 text-base">❌</div>
                                                <div>
                                                    <p className="font-bold text-red-800 text-sm">Declined by {cName}</p>
                                                    <p className="text-xs text-red-500 mt-0.5">You can post this job again to find another provider.</p>
                                                </div>
                                            </div>
                                            {job.decline_reason && (
                                                <div className="bg-white rounded-xl p-3 border border-red-100">
                                                    <p className="text-xs text-gray-400 mb-1">Reason provided</p>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.decline_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FULLY DECLINED (by customer) */}
                                    {status === 'declined' && (
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 text-base">🚫</div>
                                            <div>
                                                <p className="font-semibold text-gray-700 text-sm">Job Cancelled</p>
                                                <p className="text-xs text-gray-400 mt-0.5">This job was declined. You can post a new job at any time.</p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ChatModal
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                currentUserId={user?.id}
                userRole="customer"
            />
        </div>
    );
}