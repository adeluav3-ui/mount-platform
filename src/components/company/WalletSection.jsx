// src/components/company/WalletSection.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
const fmtStatus = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
        processing: 'bg-blue-100 text-blue-700 border border-blue-200',
        completed: 'bg-green-100 text-green-700 border border-green-200',
        failed: 'bg-red-100 text-red-700 border border-red-200',
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
            {fmtStatus(status)}
        </span>
    );
};

const WithdrawModal = ({ wallet, company, onClose, onSuccess, supabase, user }) => {
    const [amount, setAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const available = parseFloat(wallet?.available_balance || 0);

    const handleSubmit = async () => {
        setError('');
        const amt = parseFloat(amount);

        if (!amt || amt <= 0) return setError('Enter a valid amount.');
        if (amt > available) return setError(`Amount exceeds available balance of ${fmt(available)}.`);
        if (amt < 100) return setError('Minimum withdrawal is ₦100.');

        setSubmitting(true);
        try {
            // Insert withdrawal request
            const { data: withdrawal, error: insertError } = await supabase
                .from('withdrawal_requests')
                .insert({
                    company_id: user.id,
                    amount: amt,
                    status: 'pending',
                    bank_name: company.bank_name || '',
                    bank_account: company.bank_account || '',
                    account_name: company.account_name || company.company_name || '',
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Call edge function to process immediately
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ withdrawal_request_id: withdrawal.id }),
                }
            );

            const result = await response.json();

            if (result.success) {
                onSuccess('completed');
            } else {
                onSuccess('failed', result.error);
            }
        } catch (err) {
            console.error('Withdrawal error:', err);
            setError('Failed to submit request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen rounded-t-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-white">Request Withdrawal</h3>
                            <p className="text-green-100 text-sm mt-1">Funds processed within 24–48 hours</p>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Available Balance */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium">Available Balance</span>
                        <span className="text-xl font-bold text-green-700">{fmt(available)}</span>
                    </div>

                    {/* Bank Details */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Funds will be sent to</p>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Bank</span>
                                <span className="font-medium text-gray-800">{company.bank_name || '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Account No.</span>
                                <span className="font-medium text-gray-800 font-mono">{company.bank_account || '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Account Name</span>
                                <span className="font-medium text-gray-800">{company.account_name || company.company_name || '—'}</span>
                            </div>
                        </div>
                        {!company.bank_account && (
                            <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                                ⚠️ No bank account on file. Update your profile first.
                            </p>
                        )}
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Withdraw</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₦</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                                placeholder="0.00"
                                min="100"
                                max={available}
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-naijaGreen focus:border-transparent text-lg font-medium"
                            />
                        </div>
                        <button
                            onClick={() => setAmount(available.toString())}
                            className="mt-2 text-xs text-naijaGreen hover:text-darkGreen font-medium"
                        >
                            Withdraw all ({fmt(available)})
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !company.bank_account || !amount}
                            className="flex-1 py-3 bg-naijaGreen text-white rounded-xl font-semibold hover:bg-darkGreen disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            {submitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting...
                                </span>
                            ) : 'Submit Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function WalletSection({ company }) {
    const { supabase, user } = useSupabase();
    const [wallet, setWallet] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const loadWallet = useCallback(async () => {
        if (!user) return;
        try {
            const { data: walletData } = await supabase
                .from('provider_wallets')
                .select('*')
                .eq('company_id', user.id)
                .single();

            const { data: withdrawalData } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('company_id', user.id)
                .order('requested_at', { ascending: false })
                .limit(20);

            setWallet(walletData || { available_balance: 0, total_earned: 0, total_withdrawn: 0, total_commission: 0 });
            setWithdrawals(withdrawalData || []);
        } catch (err) {
            console.error('Error loading wallet:', err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => { loadWallet(); }, [loadWallet]);

    // Real-time wallet updates
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel(`wallet-updates-${user.id}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'provider_wallets',
                filter: `company_id=eq.${user.id}`
            }, loadWallet)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'withdrawal_requests',
                filter: `company_id=eq.${user.id}`
            }, loadWallet)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user, supabase, loadWallet]);

    const handleWithdrawSuccess = (status, errorMsg) => {
        setShowModal(false);
        if (status === 'completed') {
            setSuccessMsg('Withdrawal successful! Funds are on their way to your bank account.');
        } else {
            setSuccessMsg(`Withdrawal could not be processed: ${errorMsg}. Your balance has been restored.`);
        }
        loadWallet();
        setTimeout(() => setSuccessMsg(''), 8000);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-28" />
                ))}
            </div>
        );
    }

    const available = parseFloat(wallet?.available_balance || 0);
    const totalEarned = parseFloat(wallet?.total_earned || 0);
    const totalWithdrawn = parseFloat(wallet?.total_withdrawn || 0);
    const totalCommission = parseFloat(wallet?.total_commission || 0);

    const hasPendingRequest = withdrawals.some(w => w.status === 'pending' || w.status === 'processing');

    return (
        <div className="space-y-6">
            {/* Success Banner */}
            {successMsg && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <p className="text-green-700 font-medium">{successMsg}</p>
                </div>
            )}

            {/* Wallet Balance Card */}
            <div className="bg-gradient-to-br from-naijaGreen to-darkGreen rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/5 rounded-full" />

                <div className="relative z-10">
                    <p className="text-green-100 text-sm font-medium uppercase tracking-widest mb-1">Available Balance</p>
                    <p className="text-5xl font-bold mb-6">{fmt(available)}</p>

                    {/* Bank info */}
                    <div className="bg-white/15 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-white/70 text-xs">Linked Account</p>
                            <p className="text-white font-medium text-sm">
                                {company?.bank_name || 'No bank linked'}
                                {company?.bank_account && <span className="ml-2 font-mono opacity-80">····{company.bank_account.slice(-4)}</span>}
                            </p>
                        </div>
                    </div>

                    {/* Withdraw Button */}
                    {hasPendingRequest ? (
                        <div className="bg-yellow-400/20 border border-yellow-300/40 rounded-xl px-4 py-3 text-yellow-200 text-sm font-medium text-center">
                            ⏳ You have a pending withdrawal request
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            disabled={available <= 0 || !company?.bank_account}
                            className="w-full bg-white text-naijaGreen font-bold py-3.5 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg"
                        >
                            Withdraw Funds
                        </button>
                    )}
                    {!company?.bank_account && (
                        <p className="text-yellow-300 text-xs text-center mt-2">
                            Add your bank account in Profile Settings to withdraw
                        </p>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Total Earned</p>
                    <p className="text-xl font-bold text-gray-800">{fmt(totalEarned)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Withdrawn</p>
                    <p className="text-xl font-bold text-gray-800">{fmt(totalWithdrawn)}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Commission Paid</p>
                    <p className="text-xl font-bold text-gray-800">{fmt(totalCommission)}</p>
                </div>
            </div>

            {/* Withdrawal History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Withdrawal History</h3>
                    <p className="text-sm text-gray-500 mt-0.5">All your past and pending withdrawal requests</p>
                </div>

                {withdrawals.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium">No withdrawals yet</p>
                        <p className="text-gray-400 text-sm mt-1">Your withdrawal requests will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {withdrawals.map((w) => (
                            <div key={w.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${w.status === 'completed' ? 'bg-green-100' :
                                        w.status === 'pending' ? 'bg-yellow-100' :
                                            w.status === 'processing' ? 'bg-blue-100' : 'bg-red-100'
                                        }`}>
                                        {w.status === 'completed' ? '✅' :
                                            w.status === 'pending' ? '⏳' :
                                                w.status === 'processing' ? '🔄' : '❌'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{fmt(w.amount)}</p>
                                        <p className="text-sm text-gray-500">
                                            {w.bank_name} ····{(w.bank_account || '').slice(-4)}
                                        </p>
                                        {w.failure_reason && (
                                            <p className="text-xs text-red-500 mt-0.5">{w.failure_reason}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    <StatusBadge status={w.status} />
                                    <p className="text-xs text-gray-400">
                                        {new Date(w.requested_at).toLocaleDateString('en-NG', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <span className="text-blue-500 text-lg flex-shrink-0">ℹ️</span>
                <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">About Withdrawals</p>
                    <p>Withdrawal requests are processed within 24 hours. Funds below 100k will be processed in under an hour. Funds are sent directly to your linked bank account. Commission (5%) is deducted from final payments only — deposits and intermediate payments are credited in full.</p>
                </div>
            </div>

            {/* Withdrawal Modal */}
            {showModal && (
                <WithdrawModal
                    wallet={wallet}
                    company={company}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleWithdrawSuccess}
                    supabase={supabase}
                    user={user}
                />
            )}
        </div>
    );
}