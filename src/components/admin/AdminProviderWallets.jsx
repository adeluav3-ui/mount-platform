// src/components/admin/AdminProviderWallets.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const WITHDRAWAL_STATUS = {
    pending: { color: 'bg-amber-100 text-amber-800', label: 'Pending' },
    processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
};

export default function AdminProviderWallets() {
    const { supabase } = useSupabase();
    const [wallets, setWallets] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('wallets'); // wallets | withdrawals
    const [search, setSearch] = useState('');
    const [withdrawalFilter, setWithdrawalFilter] = useState('all');
    const [summary, setSummary] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch provider wallets
            const { data: walletData, error: walletError } = await supabase
                .from('provider_wallets')
                .select('*')
                .order('available_balance', { ascending: false });

            if (walletError) throw walletError;

            // Fetch company names
            const companyIds = (walletData || []).map(w => w.company_id).filter(Boolean);
            const { data: companies } = await supabase
                .from('companies')
                .select('id, company_name, email, phone, bank_name, bank_account, account_name')
                .in('id', companyIds);

            const companyMap = Object.fromEntries((companies || []).map(c => [c.id, c]));

            const enrichedWallets = (walletData || []).map(w => ({
                ...w,
                company: companyMap[w.company_id] || null,
            }));

            setWallets(enrichedWallets);

            // Fetch withdrawal requests
            const { data: withdrawalData, error: wError } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .order('requested_at', { ascending: false });

            if (wError) throw wError;

            // Enrich withdrawals with company info
            const wCompanyIds = [...new Set((withdrawalData || []).map(w => w.company_id).filter(Boolean))];
            let wCompanyMap = {};
            if (wCompanyIds.length > 0) {
                const { data: wCompanies } = await supabase
                    .from('companies')
                    .select('id, company_name, email, phone')
                    .in('id', wCompanyIds);
                wCompanyMap = Object.fromEntries((wCompanies || []).map(c => [c.id, c]));
            }

            const enrichedWithdrawals = (withdrawalData || []).map(w => ({
                ...w,
                company: wCompanyMap[w.company_id] || null,
            }));

            setWithdrawals(enrichedWithdrawals);

            // Summary
            const totalBalance = enrichedWallets.reduce((s, w) => s + (w.available_balance || 0), 0);
            const totalEarned = enrichedWallets.reduce((s, w) => s + (w.total_earned || 0), 0);
            const totalWithdrawn = enrichedWallets.reduce((s, w) => s + (w.total_withdrawn || 0), 0);
            const totalCommission = enrichedWallets.reduce((s, w) => s + (w.total_commission || 0), 0);
            const pendingCount = enrichedWithdrawals.filter(w => w.status === 'pending').length;
            const pendingAmount = enrichedWithdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + (w.amount || 0), 0);

            setSummary({ totalBalance, totalEarned, totalWithdrawn, totalCommission, pendingCount, pendingAmount, providers: enrichedWallets.length });
        } catch (err) {
            console.error('Error fetching provider wallets:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filteredWallets = wallets.filter(w => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            w.company?.company_name?.toLowerCase().includes(q) ||
            w.company?.email?.toLowerCase().includes(q) ||
            w.company?.phone?.includes(q)
        );
    });

    const filteredWithdrawals = withdrawals.filter(w => {
        if (withdrawalFilter !== 'all' && w.status !== withdrawalFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            w.company?.company_name?.toLowerCase().includes(q) ||
            w.bank_name?.toLowerCase().includes(q) ||
            w.monnify_reference?.toLowerCase().includes(q)
        );
    });

    return (
        <div className="p-4 sm:p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Provider Wallets</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Monnify wallet balances · Withdrawal history</p>
                </div>
                <button
                    onClick={fetchData}
                    className="text-sm text-gray-500 hover:text-naijaGreen flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-emerald-50 rounded-2xl p-4">
                        <p className="text-2xl font-bold text-emerald-800">{fmt(summary.totalBalance)}</p>
                        <p className="text-xs font-semibold text-emerald-600 mt-0.5">Total Available</p>
                        <p className="text-xs text-emerald-500">{summary.providers} providers</p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4">
                        <p className="text-2xl font-bold text-blue-800">{fmt(summary.totalEarned)}</p>
                        <p className="text-xs font-semibold text-blue-600 mt-0.5">Total Earned</p>
                        <p className="text-xs text-blue-500">All time</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-2xl font-bold text-gray-800">{fmt(summary.totalWithdrawn)}</p>
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">Total Withdrawn</p>
                        <p className="text-xs text-gray-500">All time</p>
                    </div>
                    <div className={`rounded-2xl p-4 ${summary.pendingCount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                        <p className={`text-2xl font-bold ${summary.pendingCount > 0 ? 'text-amber-800' : 'text-gray-800'}`}>
                            {summary.pendingCount}
                        </p>
                        <p className={`text-xs font-semibold mt-0.5 ${summary.pendingCount > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                            Pending Withdrawals
                        </p>
                        {summary.pendingCount > 0 && (
                            <p className="text-xs text-amber-500">{fmt(summary.pendingAmount)}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Note about automation */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                <strong>ℹ️ Fully Automated:</strong> Provider wallets are credited instantly via Monnify webhooks when job payments are confirmed. Withdrawals are processed automatically by Monnify (Single Transfer API) — no admin action needed. This page is for monitoring only.
            </div>

            {/* Tabs */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {[
                        { key: 'wallets', label: 'Provider Wallets', count: wallets.length },
                        { key: 'withdrawals', label: 'Withdrawal Requests', count: withdrawals.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition border-b-2 ${activeTab === tab.key
                                ? 'border-naijaGreen text-naijaGreen'
                                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                            <span className={`min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${activeTab === tab.key ? 'bg-naijaGreen text-white' : 'bg-gray-100 text-gray-600'}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search + withdrawal filter */}
                <div className="p-4 border-b border-gray-50 flex flex-wrap gap-2">
                    <div className="relative flex-1 min-w-[200px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        <input
                            type="text"
                            placeholder={activeTab === 'wallets' ? 'Search companies…' : 'Search company, bank, ref…'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-naijaGreen"
                        />
                    </div>
                    {activeTab === 'withdrawals' && (
                        <div className="flex flex-wrap gap-1.5">
                            {['all', 'pending', 'processing', 'completed', 'failed'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setWithdrawalFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${withdrawalFilter === f ? 'bg-naijaGreen text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {f === 'all' ? 'All' : f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-7 h-7 border-[3px] border-naijaGreen border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading…</p>
                    </div>
                ) : activeTab === 'wallets' ? (

                    /* ── Wallet List ── */
                    filteredWallets.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center px-6">
                            <div className="text-4xl mb-3">💰</div>
                            <p className="font-semibold text-gray-700">No wallets found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredWallets.map(wallet => (
                                <div key={wallet.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{wallet.company?.company_name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-400">{wallet.company?.email}</p>
                                            {wallet.company?.phone && <p className="text-xs text-gray-400">{wallet.company.phone}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-emerald-700">{fmt(wallet.available_balance)}</p>
                                            <p className="text-xs text-gray-400">Available</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                                            <p className="text-sm font-bold text-gray-800">{fmt(wallet.total_earned)}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Total Earned</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                                            <p className="text-sm font-bold text-gray-800">{fmt(wallet.total_withdrawn)}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Withdrawn</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                                            <p className="text-sm font-bold text-gray-800">{fmt(wallet.total_commission)}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Commission (5%)</p>
                                        </div>
                                    </div>

                                    {/* Bank details */}
                                    {wallet.company?.bank_name && (
                                        <div className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100 text-xs text-blue-800">
                                            🏦 {wallet.company.bank_name} · {wallet.company.bank_account}
                                            {wallet.company.account_name && ` · ${wallet.company.account_name}`}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-2">
                                        Last updated: {fmtDate(wallet.updated_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )

                ) : (

                    /* ── Withdrawal List ── */
                    filteredWithdrawals.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-center px-6">
                            <div className="text-4xl mb-3">💸</div>
                            <p className="font-semibold text-gray-700">No withdrawal requests found</p>
                            <p className="text-sm text-gray-400 mt-1">Withdrawals are processed automatically by Monnify</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredWithdrawals.map(wr => {
                                const statusCfg = WITHDRAWAL_STATUS[wr.status] || { color: 'bg-gray-100 text-gray-600', label: wr.status };
                                return (
                                    <div key={wr.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="font-bold text-gray-900">{wr.company?.company_name || 'Unknown'}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg.color}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400">{wr.company?.email}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Requested: {fmtDate(wr.requested_at)}
                                                </p>
                                                {wr.completed_at && (
                                                    <p className="text-xs text-gray-400">
                                                        Completed: {fmtDate(wr.completed_at)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-gray-900">{fmt(wr.amount)}</p>
                                                <p className="text-xs text-gray-400">Withdrawal</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <p className="text-gray-400 font-medium mb-1">Bank Details</p>
                                                <p className="text-gray-800 font-semibold">{wr.bank_name || '—'}</p>
                                                <p className="text-gray-600 font-mono">{wr.bank_account || '—'}</p>
                                                {wr.account_name && <p className="text-gray-500">{wr.account_name}</p>}
                                            </div>
                                            <div className="bg-gray-50 rounded-xl p-3">
                                                <p className="text-gray-400 font-medium mb-1">Monnify Reference</p>
                                                {wr.monnify_reference ? (
                                                    <code className="text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded break-all">
                                                        {wr.monnify_reference}
                                                    </code>
                                                ) : (
                                                    <p className="text-gray-400 italic">Not yet assigned</p>
                                                )}
                                            </div>
                                        </div>

                                        {wr.failure_reason && (
                                            <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-700">
                                                ⚠️ Failure reason: {wr.failure_reason}
                                            </div>
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
}