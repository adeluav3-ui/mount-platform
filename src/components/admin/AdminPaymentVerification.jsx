// src/components/admin/AdminPaymentVerification.jsx — REFINED VERSION
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (amount) => `₦${parseFloat(amount || 0).toLocaleString()}`;

const PAYMENT_TYPE_STYLES = {
    deposit: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Deposit (50%)' },
    intermediate: { bg: 'bg-violet-100', text: 'text-violet-800', label: 'Intermediate (30%)' },
    final_payment: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Final Payment' },
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminPaymentVerification() {
    const { supabase } = useSupabase();
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [notesMap, setNotesMap] = useState({}); // tracks inline notes per payment

    useEffect(() => { fetchPendingPayments(); }, []);

    const fetchPendingPayments = async () => {
        setLoading(true);
        try {
            const { data: transactions, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('status', 'pending')
                .eq('verified_by_admin', false)
                .eq('payment_method', 'bank_transfer')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Batch-fetch jobs and customer profiles instead of N+1
            const jobIds = [...new Set((transactions || []).map(t => t.job_id).filter(Boolean))];
            const userIds = [...new Set((transactions || []).map(t => t.user_id).filter(Boolean))];

            const [{ data: jobs }, { data: profiles }] = await Promise.all([
                supabase.from('jobs').select('id, description, status').in('id', jobIds),
                supabase.from('profiles').select('id, full_name, phone, email').in('id', userIds),
            ]);

            const jobMap = Object.fromEntries((jobs || []).map(j => [j.id, j]));
            const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));

            setPendingPayments((transactions || []).map(t => ({
                ...t,
                job: jobMap[t.job_id] || null,
                customer: profileMap[t.user_id] || null,
            })));
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── Verify / Reject ───────────────────────────────────────────────────────
    const verifyPayment = async (paymentId, approved = true) => {
        const payment = pendingPayments.find(p => p.id === paymentId);
        if (!payment) { alert('Payment not found!'); return; }

        const actionLabel = approved ? 'verify' : 'reject';
        if (!window.confirm(`Are you sure you want to ${actionLabel} this payment of ${fmt(payment.amount)}?`)) return;

        setProcessingId(paymentId);
        try {
            // 1. Update financial transaction
            const { error: transactionError } = await supabase
                .from('financial_transactions')
                .update({
                    verified_by_admin: true,
                    admin_verified_at: new Date().toISOString(),
                    status: approved ? 'completed' : 'failed',
                    admin_notes: approved ? 'Payment verified by admin' : 'Payment rejected by admin',
                })
                .eq('id', paymentId);

            if (transactionError) throw new Error(`Transaction update failed: ${transactionError.message}`);

            if (approved) {
                // 2. Determine job status and updates
                let newJobStatus = 'deposit_paid';
                let notificationMessage = `Your payment of ${fmt(payment.amount)} has been verified.`;
                let jobUpdates = { status: newJobStatus };

                if (payment.type === 'deposit') {
                    newJobStatus = 'deposit_paid';
                    notificationMessage = `Your 50% deposit of ${fmt(payment.amount)} has been verified. The service provider will start your job.`;
                    jobUpdates = { status: newJobStatus };
                    if (payment.platform_fee > 0) {
                        jobUpdates.customer_service_fee = payment.platform_fee;
                        jobUpdates.service_fee_waived = false;
                    }
                } else if (payment.type === 'intermediate') {
                    newJobStatus = 'intermediate_paid';
                    notificationMessage = `Your 30% intermediate payment of ${fmt(payment.amount)} has been verified for materials.`;
                    jobUpdates = {
                        status: newJobStatus,
                        intermediate_payment: payment.amount,
                        intermediate_payment_requested: true,
                        intermediate_payment_paid: true,
                        intermediate_paid_at: new Date().toISOString(),
                        split_payment: true,
                    };
                } else if (payment.type === 'final_payment') {
                    newJobStatus = 'completed';
                    notificationMessage = `Your final payment of ${fmt(payment.amount)} has been verified. Job is now complete!`;
                    jobUpdates = { status: newJobStatus };
                }

                // 3. Update job status
                if (payment.job_id) {
                    const { error: jobError } = await supabase
                        .from('jobs')
                        .update(jobUpdates)
                        .eq('id', payment.job_id);

                    if (jobError) console.warn('Job update warning:', jobError);
                }

                // 4. Notify customer
                if (payment.user_id) {
                    await supabase.from('notifications').insert({
                        user_id: payment.user_id,
                        title: 'Payment Verified!',
                        message: notificationMessage,
                        type: 'payment_success',
                        read: false,
                        created_at: new Date().toISOString(),
                        job_id: payment.job_id || null,
                    });
                }

                // 5. Notify company
                // BUG FIX: Original fetched job.company_id AFTER already doing job updates
                // above — a potential ordering issue. Also, it made an unnecessary extra
                // profiles lookup since in Supabase Auth, company.id === auth user id,
                // so company_id IS the profile id. No need for a second profiles query.
                if (payment.job_id) {
                    const { data: jobForCompany } = await supabase
                        .from('jobs')
                        .select('company_id')
                        .eq('id', payment.job_id)
                        .single();

                    if (jobForCompany?.company_id) {
                        await supabase.from('notifications').insert({
                            user_id: jobForCompany.company_id, // company.id === profile.id
                            title: 'Customer Payment Verified!',
                            message: `Customer payment of ${fmt(payment.amount)} has been verified. Job status updated to "${newJobStatus.replace(/_/g, ' ')}".`,
                            type: 'payment_verified',
                            read: false,
                            created_at: new Date().toISOString(),
                            job_id: payment.job_id,
                        });
                    }
                }
            }

            setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
            alert(`✅ Payment ${approved ? 'verified' : 'rejected'} successfully!\n\n${approved ? 'Next: Go to Payout Management to create payout for the company.' : ''}`);

        } catch (error) {
            console.error('Verification error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    // ── Save Notes ────────────────────────────────────────────────────────────
    // BUG FIX: Original "Add Notes" button used prompt() and then fired a
    // supabase update without await — no error handling, no feedback to the user.
    // Replaced with inline notes editing that saves properly with feedback.
    const saveNotes = async (paymentId) => {
        const notes = notesMap[paymentId]?.trim();
        if (!notes) return;

        setProcessingId(paymentId);
        try {
            const { error } = await supabase
                .from('financial_transactions')
                .update({ admin_notes: notes })
                .eq('id', paymentId);

            if (error) throw error;

            // Reflect in local state
            setPendingPayments(prev =>
                prev.map(p => p.id === paymentId ? { ...p, admin_notes: notes } : p)
            );
            setNotesMap(prev => { const n = { ...prev }; delete n[paymentId]; return n; });
            alert('✅ Notes saved');
        } catch (error) {
            alert('Failed to save notes: ' + error.message);
        } finally {
            setProcessingId(null);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    if (loading) {
        // BUG FIX: Original returned a plain unstyled <div>Loading...</div>
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 border-[3px] border-naijaGreen border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Loading pending payments…</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Payment Verification</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {pendingPayments.length > 0
                            ? `${pendingPayments.length} payment${pendingPayments.length !== 1 ? 's' : ''} awaiting verification`
                            : 'No payments awaiting verification'}
                    </p>
                </div>
                <button
                    onClick={fetchPendingPayments}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-naijaGreen transition px-3 py-2 rounded-xl hover:bg-gray-50"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {pendingPayments.length === 0 ? (
                    <div className="flex flex-col items-center py-20 text-center px-6">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mb-4">✅</div>
                        <h3 className="font-bold text-gray-700 text-lg">No Pending Payments</h3>
                        <p className="text-gray-400 text-sm mt-1">All bank transfer payments have been verified.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {pendingPayments.map(payment => {
                            const isProcessing = processingId === payment.id;
                            const typeStyle = PAYMENT_TYPE_STYLES[payment.type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: payment.type || 'Payment' };
                            const editingNotes = notesMap[payment.id] !== undefined;

                            return (
                                <div key={payment.id} className="p-5 sm:p-6">

                                    {/* Top row: amount + type badge */}
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                        <div>
                                            {/* BUG FIX: Payment type badge was completely absent — admin had
                                                no visual indicator of whether this was a deposit, intermediate
                                                or final payment without reading the description text */}
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                                                    {typeStyle.label}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(payment.created_at).toLocaleString('en-NG', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900">{fmt(payment.amount)}</p>
                                            {payment.platform_fee > 0 && (
                                                <p className="text-xs text-gray-500 mt-0.5">Incl. service fee: {fmt(payment.platform_fee)}</p>
                                            )}
                                        </div>

                                        {/* Bank Ref */}
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 mb-1">Bank Reference</p>
                                            {/* BUG FIX: bank_reference could be null/undefined — no fallback shown */}
                                            {payment.bank_reference ? (
                                                <code className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg text-sm font-mono">
                                                    {payment.bank_reference}
                                                </code>
                                            ) : (
                                                <span className="text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">No reference provided</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detail grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
                                            <p className="font-semibold text-gray-800 text-sm">{payment.customer?.full_name || <span className="text-gray-400">Unknown</span>}</p>
                                            {payment.customer?.phone && (
                                                <p className="text-xs text-gray-500 mt-0.5">📞 {payment.customer.phone}</p>
                                            )}
                                            {payment.customer?.email && (
                                                <p className="text-xs text-gray-500 mt-0.5">✉️ {payment.customer.email}</p>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Job</p>
                                            <p className="text-sm text-gray-700 line-clamp-2">
                                                {payment.job?.description || <span className="text-gray-400">No description</span>}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 font-mono">#{payment.job_id?.substring(0, 8)}</p>
                                        </div>
                                    </div>

                                    {/* Proof of payment */}
                                    {payment.proof_of_payment_url && (
                                        <a
                                            href={payment.proof_of_payment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline mb-4"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            View Proof of Payment
                                        </a>
                                    )}

                                    {/* Existing notes */}
                                    {payment.admin_notes && !editingNotes && (
                                        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                            <p className="text-xs font-semibold text-amber-700 mb-0.5">Admin Note</p>
                                            <p className="text-sm text-amber-800">{payment.admin_notes}</p>
                                        </div>
                                    )}

                                    {/* Inline notes editor */}
                                    {editingNotes && (
                                        <div className="mb-4 flex gap-2">
                                            <textarea
                                                value={notesMap[payment.id]}
                                                onChange={e => setNotesMap(prev => ({ ...prev, [payment.id]: e.target.value }))}
                                                placeholder="Add admin notes…"
                                                rows={2}
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-naijaGreen outline-none resize-none"
                                            />
                                            <div className="flex flex-col gap-1.5">
                                                <button
                                                    onClick={() => saveNotes(payment.id)}
                                                    disabled={isProcessing}
                                                    className="px-3 py-2 bg-naijaGreen text-white rounded-xl text-xs font-bold hover:bg-darkGreen transition disabled:opacity-50"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setNotesMap(prev => { const n = { ...prev }; delete n[payment.id]; return n; })}
                                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => verifyPayment(payment.id, true)}
                                            disabled={isProcessing}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying…</>
                                            ) : (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Verify</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => verifyPayment(payment.id, false)}
                                            disabled={isProcessing}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                            Reject
                                        </button>
                                        {!editingNotes && (
                                            <button
                                                onClick={() => setNotesMap(prev => ({ ...prev, [payment.id]: payment.admin_notes || '' }))}
                                                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
                                            >
                                                {payment.admin_notes ? 'Edit Notes' : '+ Add Notes'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}