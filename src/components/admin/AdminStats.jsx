// src/components/admin/AdminStats.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { Link } from 'react-router-dom';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;

const AdminStats = () => {
    const { supabase } = useSupabase();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchStats(); }, []);

    const fetchStats = async () => {
        try {
            const [
                { count: totalJobs },
                { count: pendingJobs },
                { count: activeCompanies },
                { count: totalCustomers },
                { data: completedJobs },
                { data: subscriptions },
                { data: creditWallets },
                { data: providerWallets },
                { count: pendingWithdrawals },
            ] = await Promise.all([
                supabase.from('jobs').select('*', { count: 'exact', head: true }),
                supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('companies').select('*', { count: 'exact', head: true }).eq('approved', true),
                supabase.from('customers').select('*', { count: 'exact', head: true }),
                supabase.from('jobs').select('platform_fee').eq('status', 'completed'),
                supabase.from('subscriptions').select('plan, billing_cycle, status').eq('status', 'active'),
                supabase.from('credit_wallets').select('balance, monthly_credited, mount_fee_collected'),
                supabase.from('provider_wallets').select('available_balance, total_earned, total_withdrawn, total_commission'),
                supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            ]);

            // Job revenue
            const jobRevenue = (completedJobs || []).reduce((s, j) => s + (j.platform_fee || 0), 0);

            // Subscription stats
            const activeSubscriptions = subscriptions || [];
            const subByPlan = activeSubscriptions.reduce((acc, s) => {
                acc[s.plan] = (acc[s.plan] || 0) + 1;
                return acc;
            }, {});

            const MONTHLY_FEES = { logistics: 5000, basic: 15000, standard: 25000, premium: 50000 };
            const YEARLY_FEES = { logistics: 57000, basic: 171000, standard: 285000, premium: 570000 };
            const subRevenue = activeSubscriptions.reduce((s, sub) => {
                const fees = sub.billing_cycle === 'yearly' ? YEARLY_FEES : MONTHLY_FEES;
                return s + (fees[sub.plan] || 0);
            }, 0);

            // Credit wallet stats
            const totalCreditBalance = (creditWallets || []).reduce((s, w) => s + (w.balance || 0), 0);
            const totalMountFees = (creditWallets || []).reduce((s, w) => s + (w.mount_fee_collected || 0), 0);

            // Provider wallet stats
            const totalProviderBalance = (providerWallets || []).reduce((s, w) => s + (w.available_balance || 0), 0);
            const totalEarned = (providerWallets || []).reduce((s, w) => s + (w.total_earned || 0), 0);
            const totalWithdrawn = (providerWallets || []).reduce((s, w) => s + (w.total_withdrawn || 0), 0);
            const totalCommission = (providerWallets || []).reduce((s, w) => s + (w.total_commission || 0), 0);

            setStats({
                totalJobs: totalJobs || 0,
                pendingJobs: pendingJobs || 0,
                activeCompanies: activeCompanies || 0,
                totalCustomers: totalCustomers || 0,
                jobRevenue,
                activeSubscriptions: activeSubscriptions.length,
                subByPlan,
                subRevenue,
                totalCreditBalance,
                totalMountFees,
                totalProviderBalance,
                totalEarned,
                totalWithdrawn,
                totalCommission,
                pendingWithdrawals: pendingWithdrawals || 0,
            });
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24" />
                ))}
            </div>
        );
    }

    const PLAN_COLORS = {
        logistics: 'text-blue-700 bg-blue-50',
        basic: 'text-gray-700 bg-gray-100',
        standard: 'text-green-700 bg-green-50',
        premium: 'text-amber-700 bg-amber-50',
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">Platform Overview</h1>
                <button
                    onClick={fetchStats}
                    className="text-sm text-gray-500 hover:text-naijaGreen flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* ── Row 1: Core Platform ── */}
            <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Platform Activity</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Jobs', value: stats.totalJobs, icon: '🔧', color: 'bg-blue-50 text-blue-700', link: '/admin/jobs' },
                        { label: 'Pending Jobs', value: stats.pendingJobs, icon: '⏳', color: 'bg-amber-50 text-amber-700', link: '/admin/jobs' },
                        { label: 'Active Companies', value: stats.activeCompanies, icon: '🏢', color: 'bg-purple-50 text-purple-700', link: '/admin/approvals' },
                        { label: 'Customers', value: stats.totalCustomers, icon: '👤', color: 'bg-gray-50 text-gray-700', link: '/admin/users' },
                    ].map(card => (
                        <Link key={card.label} to={card.link} className={`${card.color} rounded-2xl p-4 hover:opacity-90 transition`}>
                            <p className="text-2xl mb-1">{card.icon}</p>
                            <p className="text-2xl font-bold">{card.value}</p>
                            <p className="text-xs font-semibold opacity-70 mt-0.5">{card.label}</p>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── Row 2: Revenue ── */}
            <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Revenue</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-2xl p-5">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">Job Commission (5%)</p>
                        <p className="text-2xl font-bold text-green-800">{fmt(stats.jobRevenue)}</p>
                        <p className="text-xs text-green-600 mt-1">From completed jobs</p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-5">
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Subscription Revenue</p>
                        <p className="text-2xl font-bold text-purple-800">{fmt(stats.subRevenue)}</p>
                        <p className="text-xs text-purple-600 mt-1">{stats.activeSubscriptions} active subscribers</p>
                    </div>
                    <div className="bg-indigo-50 rounded-2xl p-5">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Mount Wallet Fees</p>
                        <p className="text-2xl font-bold text-indigo-800">{fmt(stats.totalMountFees)}</p>
                        <p className="text-xs text-indigo-600 mt-1">10% from credit wallet use</p>
                    </div>
                </div>
            </section>

            {/* ── Row 3: Subscriptions ── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subscriptions</p>
                    <Link to="/admin/subscriptions" className="text-xs text-naijaGreen font-semibold hover:underline">View all →</Link>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                            <p className="text-sm text-gray-500">Active subscribers</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold text-purple-700">{fmt(stats.subRevenue)}</p>
                            <p className="text-xs text-gray-400">Total subscription value</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['logistics', 'basic', 'standard', 'premium'].map(plan => (
                            <div key={plan} className={`rounded-xl px-3 py-2.5 ${PLAN_COLORS[plan]}`}>
                                <p className="text-lg font-bold">{stats.subByPlan[plan] || 0}</p>
                                <p className="text-xs font-semibold capitalize opacity-75">{plan}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Row 4: Credit Wallets ── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Credit Wallets</p>
                    <Link to="/admin/subscriptions" className="text-xs text-naijaGreen font-semibold hover:underline">View all →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Total Credit Outstanding</p>
                        <p className="text-2xl font-bold text-gray-900">{fmt(stats.totalCreditBalance)}</p>
                        <p className="text-xs text-gray-400 mt-1">Across all subscriber wallets</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Mount Fees Collected</p>
                        <p className="text-2xl font-bold text-gray-900">{fmt(stats.totalMountFees)}</p>
                        <p className="text-xs text-gray-400 mt-1">10% retained from subscriptions</p>
                    </div>
                </div>
            </section>

            {/* ── Row 5: Provider Wallets ── */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Provider Wallets</p>
                    <Link to="/admin/provider-wallets" className="text-xs text-naijaGreen font-semibold hover:underline">View all →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Balance', value: fmt(stats.totalProviderBalance), sub: 'Available to withdraw', color: 'text-emerald-700 bg-emerald-50' },
                        { label: 'Total Earned', value: fmt(stats.totalEarned), sub: 'All time', color: 'text-blue-700 bg-blue-50' },
                        { label: 'Total Withdrawn', value: fmt(stats.totalWithdrawn), sub: 'All time', color: 'text-gray-700 bg-gray-50' },
                        { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, sub: 'Requests', color: stats.pendingWithdrawals > 0 ? 'text-amber-700 bg-amber-50' : 'text-gray-700 bg-gray-50' },
                    ].map(card => (
                        <div key={card.label} className={`${card.color} rounded-2xl p-4`}>
                            <p className="text-xl font-bold">{card.value}</p>
                            <p className="text-xs font-semibold opacity-80 mt-0.5">{card.label}</p>
                            <p className="text-xs opacity-60 mt-0.5">{card.sub}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Quick Actions ── */}
            <section>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { to: '/admin/approvals', icon: '✅', label: 'Approvals', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                        { to: '/admin/jobs', icon: '🔧', label: 'Jobs', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                        { to: '/admin/subscriptions', icon: '💳', label: 'Subscriptions', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                        { to: '/admin/provider-wallets', icon: '💰', label: 'Provider Wallets', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                    ].map(action => (
                        <Link key={action.to} to={action.to} className={`${action.color} rounded-xl p-4 text-center font-semibold text-sm transition`}>
                            <span className="block text-2xl mb-1">{action.icon}</span>
                            {action.label}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AdminStats;