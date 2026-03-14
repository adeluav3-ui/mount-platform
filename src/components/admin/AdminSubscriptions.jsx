// src/components/admin/AdminSubscriptions.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const PLAN_CONFIG = {
    logistics: { label: 'Logistics', badge: '🚚', color: 'bg-blue-100 text-blue-800', monthly: 5000, yearly: 57000, credit: 4500, fee: 500 },
    basic: { label: 'Basic', badge: '⚡', color: 'bg-gray-100 text-gray-800', monthly: 15000, yearly: 171000, credit: 13500, fee: 1500 },
    standard: { label: 'Standard', badge: '🌟', color: 'bg-green-100 text-green-800', monthly: 25000, yearly: 285000, credit: 22500, fee: 2500 },
    premium: { label: 'Premium', badge: '👑', color: 'bg-amber-100 text-amber-800', monthly: 50000, yearly: 570000, credit: 45000, fee: 5000 },
};

const STATUS_CONFIG = {
    active: { color: 'bg-green-100 text-green-700', label: 'Active' },
    cancelled: { color: 'bg-gray-100 text-gray-600', label: 'Cancelled' },
    past_due: { color: 'bg-red-100 text-red-700', label: 'Past Due' },
    inactive: { color: 'bg-gray-100 text-gray-500', label: 'Inactive' },
};

export default function AdminSubscriptions() {
    const { supabase } = useSupabase();
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all | active | cancelled | past_due
    const [planFilter, setPlanFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [summary, setSummary] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all subscriptions
            const { data: subs, error } = await supabase
                .from('subscriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Batch fetch customers
            const customerIds = [...new Set((subs || []).map(s => s.customer_id).filter(Boolean))];
            const { data: customers } = await supabase
                .from('customers')
                .select('id, customer_name, email, phone')
                .in('id', customerIds);

            const customerMap = Object.fromEntries((customers || []).map(c => [c.id, c]));

            // Batch fetch credit wallets
            const { data: wallets } = await supabase
                .from('credit_wallets')
                .select('customer_id, balance, monthly_credited, mount_fee_collected, last_credited_at')
                .in('customer_id', customerIds);

            const walletMap = Object.fromEntries((wallets || []).map(w => [w.customer_id, w]));

            const enriched = (subs || []).map(s => ({
                ...s,
                customer: customerMap[s.customer_id] || null,
                wallet: walletMap[s.customer_id] || null,
            }));

            setSubscribers(enriched);

            // Summary stats
            const active = enriched.filter(s => s.status === 'active');
            const planCounts = active.reduce((acc, s) => { acc[s.plan] = (acc[s.plan] || 0) + 1; return acc; }, {});
            const MONTHLY_FEES = { logistics: 5000, basic: 15000, standard: 25000, premium: 50000 };
            const YEARLY_FEES = { logistics: 57000, basic: 171000, standard: 285000, premium: 570000 };
            const totalRevenue = active.reduce((s, sub) => {
                const fees = sub.billing_cycle === 'yearly' ? YEARLY_FEES : MONTHLY_FEES;
                return s + (fees[sub.plan] || 0);
            }, 0);
            const totalCreditOutstanding = enriched.reduce((s, sub) => s + (sub.wallet?.balance || 0), 0);

            setSummary({ active: active.length, total: enriched.length, planCounts, totalRevenue, totalCreditOutstanding });
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Override credit wallet cap for a subscriber
    const overrideCreditCap = async (customerId, customerName) => {
        if (!window.confirm(`Grant full credit cap override for ${customerName}? This requires admin approval.`)) return;
        const { error } = await supabase
            .from('credit_wallets')
            .update({ override_cap: true, override_granted_at: new Date().toISOString() })
            .eq('customer_id', customerId);
        if (error) { alert('Failed: ' + error.message); return; }
        alert('✅ Credit cap override granted.');
        fetchData();
    };

    const filtered = subscribers.filter(s => {
        if (filter !== 'all' && s.status !== filter) return false;
        if (planFilter !== 'all' && s.plan !== planFilter) return false;
        if (search.trim()) {
            const q = search.toLowerCase();
            return (
                s.customer?.customer_name?.toLowerCase().includes(q) ||
                s.customer?.email?.toLowerCase().includes(q) ||
                s.customer?.phone?.includes(q) ||
                s.plan?.includes(q)
            );
        }
        return true;
    });

    // Usable cap calculation
    const getUsableCap = (wallet) => {
        if (!wallet) return 0;
        const day = new Date().getDate();
        const pct = day <= 14 ? 0.5 : 0.7;
        return wallet.monthly_credited * pct;
    };

    return (
        <div className="p-4 sm:p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Subscriber list, plan breakdown, credit wallets</p>
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

            {/* Summary cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-green-50 rounded-2xl p-4">
                        <p className="text-2xl font-bold text-green-800">{summary.active}</p>
                        <p className="text-xs font-semibold text-green-600 mt-0.5">Active Subscribers</p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-4">
                        <p className="text-2xl font-bold text-purple-800">{fmt(summary.totalRevenue)}</p>
                        <p className="text-xs font-semibold text-purple-600 mt-0.5">Subscription Revenue</p>
                    </div>
                    <div className="bg-indigo-50 rounded-2xl p-4">
                        <p className="text-2xl font-bold text-indigo-800">{fmt(summary.totalCreditOutstanding)}</p>
                        <p className="text-xs font-semibold text-indigo-600 mt-0.5">Credit Outstanding</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
                        <p className="text-xs font-semibold text-gray-600 mt-0.5">All Time Subscribers</p>
                    </div>
                </div>
            )}

            {/* Plan breakdown */}
            {summary && (
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Active by Plan</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Object.entries(PLAN_CONFIG).map(([key, cfg]) => (
                            <div key={key} className={`rounded-xl px-4 py-3 ${cfg.color}`}>
                                <p className="text-xl">{cfg.badge}</p>
                                <p className="text-xl font-bold mt-1">{summary.planCounts[key] || 0}</p>
                                <p className="text-xs font-semibold opacity-75">{cfg.label}</p>
                                <p className="text-xs opacity-60">{fmt(cfg.monthly)}/mo</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
                {/* Status filter */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'active', label: 'Active' },
                        { key: 'cancelled', label: 'Cancelled' },
                        { key: 'past_due', label: 'Past Due' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === f.key ? 'bg-naijaGreen text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                    <div className="w-px bg-gray-200 mx-1 self-stretch" />
                    {['all', 'logistics', 'basic', 'standard', 'premium'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPlanFilter(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${planFilter === p ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {p === 'all' ? 'All Plans' : p}
                        </button>
                    ))}
                </div>
                {/* Search */}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, email, phone…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-naijaGreen"
                    />
                </div>
            </div>

            {/* Results count */}
            <p className="text-xs text-gray-400">
                Showing <strong className="text-gray-700">{filtered.length}</strong> subscriber{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Subscriber list */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-7 h-7 border-[3px] border-naijaGreen border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Loading subscribers…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center px-6">
                        <div className="text-4xl mb-3">💳</div>
                        <p className="font-semibold text-gray-700">No subscribers found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map(sub => {
                            const cfg = PLAN_CONFIG[sub.plan] || { label: sub.plan, badge: '?', color: 'bg-gray-100 text-gray-700' };
                            const statusCfg = STATUS_CONFIG[sub.status] || { color: 'bg-gray-100 text-gray-600', label: sub.status };
                            const wallet = sub.wallet;
                            const usableCap = getUsableCap(wallet);
                            const day = new Date().getDate();

                            return (
                                <div key={sub.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex flex-wrap items-start justify-between gap-3">

                                        {/* Left: customer info */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg shrink-0">
                                                {cfg.badge}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-gray-900 text-sm">
                                                        {sub.customer?.customer_name || 'Unknown'}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg.color}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                                                        {sub.billing_cycle}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">{sub.customer?.email}</p>
                                                {sub.customer?.phone && (
                                                    <p className="text-xs text-gray-400">{sub.customer.phone}</p>
                                                )}
                                                <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                                                    <span>Started: {fmtDate(sub.current_period_start)}</span>
                                                    {sub.current_period_end && (
                                                        <span>Renews: {fmtDate(sub.current_period_end)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: amounts */}
                                        <div className="text-right shrink-0">
                                            <p className="text-base font-bold text-gray-900">
                                                {fmt(sub.billing_cycle === 'yearly' ? cfg.yearly : cfg.monthly)}
                                            </p>
                                            <p className="text-xs text-gray-400">/{sub.billing_cycle === 'yearly' ? 'yr' : 'mo'}</p>
                                        </div>
                                    </div>

                                    {/* Credit wallet panel */}
                                    {wallet ? (
                                        <div className="mt-3 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Credit Wallet</p>
                                                {sub.status === 'active' && (
                                                    <button
                                                        onClick={() => overrideCreditCap(sub.customer_id, sub.customer?.customer_name)}
                                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                                                    >
                                                        Override Cap
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                                <div>
                                                    <p className="text-indigo-500 font-medium">Balance</p>
                                                    <p className="font-bold text-indigo-900">{fmt(wallet.balance)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-indigo-500 font-medium">Monthly Credit</p>
                                                    <p className="font-bold text-indigo-900">{fmt(wallet.monthly_credited)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-indigo-500 font-medium">Usable Now ({day <= 14 ? '50%' : '70%'})</p>
                                                    <p className="font-bold text-indigo-900">{fmt(usableCap)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-indigo-500 font-medium">Last Credited</p>
                                                    <p className="font-bold text-indigo-900">{fmtDate(wallet.last_credited_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : sub.status === 'active' ? (
                                        <div className="mt-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                                            <p className="text-xs text-amber-700">⚠️ No credit wallet found for this subscriber</p>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}