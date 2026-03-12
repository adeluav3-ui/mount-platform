// src/components/CustomerProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import VerificationModal from './VerificationModal';

const PAYSTACK_PUBLIC_KEY = 'pk_live_0d70846f234f0d4d3861698734950048b58f2764';

const PLANS = [
    {
        key: 'logistics',
        name: 'Logistics',
        monthlyPrice: 5000,
        yearlyPrice: 57000,
        planIdMonthly: 'PLN_3tdtvb132thk1hr',
        planIdYearly: null, // yearly is one-time charge
        color: 'from-blue-500 to-blue-600',
        badge: '🚚',
        features: ['Priority logistics matching', 'Delivery tracking', 'Basic support'],
        restricted: true, // logistics providers only
    },
    {
        key: 'basic',
        name: 'Basic',
        monthlyPrice: 15000,
        yearlyPrice: 171000,
        planIdMonthly: 'PLN_2iwog9z6h8jgbzt',
        planIdYearly: null,
        color: 'from-gray-500 to-gray-600',
        badge: '⚡',
        features: ['Access to all service categories', 'Standard support', 'Job history'],
    },
    {
        key: 'standard',
        name: 'Standard',
        monthlyPrice: 25000,
        yearlyPrice: 285000,
        planIdMonthly: 'PLN_746nl7acl3cs1sy',
        planIdYearly: null,
        color: 'from-naijaGreen to-darkGreen',
        badge: '🌟',
        features: ['Everything in Basic', 'Priority matching', 'Dedicated support', 'Credit wallet access'],
        popular: true,
    },
    {
        key: 'premium',
        name: 'Premium',
        monthlyPrice: 50000,
        yearlyPrice: 570000,
        planIdMonthly: 'PLN_5l5rozwz1c2zour',
        planIdYearly: null,
        color: 'from-amber-500 to-amber-600',
        badge: '👑',
        features: ['Everything in Standard', 'VIP matching', '24/7 support', 'Maximum credit wallet', 'Exclusive deals'],
    },
];

const BADGES = [
    { name: 'Novice', min: 1, max: 3, icon: '🌱', color: 'text-gray-600 bg-gray-100' },
    { name: 'Amateur', min: 4, max: 9, icon: '⚡', color: 'text-blue-600 bg-blue-100' },
    { name: 'Bronze', min: 10, max: 19, icon: '🥉', color: 'text-amber-700 bg-amber-100' },
    { name: 'Silver', min: 20, max: 49, icon: '🥈', color: 'text-gray-500 bg-gray-200' },
    { name: 'Golden', min: 50, max: 99, icon: '🥇', color: 'text-yellow-600 bg-yellow-100' },
    { name: 'Diamond', min: 100, max: Infinity, icon: '💎', color: 'text-cyan-600 bg-cyan-100' },
];

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;

function getBadge(totalJobs) {
    if (!totalJobs || totalJobs === 0) return null;
    return BADGES.find(b => totalJobs >= b.min && totalJobs <= b.max) || null;
}

function getDisplayName(name) {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

// ─── Leaderboard Modal ───────────────────────────────────────────────────────
function LeaderboardModal({ onClose, currentUserId, supabase, myRank, myTotalJobs, myName }) {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('customers')
                .select('id, customer_name, total_jobs')
                .order('total_jobs', { ascending: false })
                .gt('total_jobs', 0)
                .limit(20);
            setLeaders(data || []);
            setLoading(false);
        };
        load();
    }, [supabase]);

    const isMe = (id) => id === currentUserId;
    const myInTop20 = leaders.some(l => l.id === currentUserId);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen rounded-t-2xl px-6 py-5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white">🏆 Leaderboard</h3>
                        <p className="text-green-100 text-sm">Top customers by completed jobs</p>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="py-12 text-center text-gray-400">Loading...</div>
                    ) : leaders.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">No ranked customers yet</div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {leaders.map((leader, idx) => {
                                const rank = idx + 1;
                                const badge = getBadge(leader.total_jobs);
                                const me = isMe(leader.id);
                                const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;

                                return (
                                    <div key={leader.id}
                                        className={`px-5 py-3.5 flex items-center gap-4 ${me ? 'bg-green-50 border-l-4 border-naijaGreen' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="w-8 text-center">
                                            {rankIcon
                                                ? <span className="text-xl">{rankIcon}</span>
                                                : <span className="text-sm font-bold text-gray-500">#{rank}</span>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold truncate ${me ? 'text-naijaGreen' : 'text-gray-800'}`}>
                                                {getDisplayName(leader.customer_name)}
                                                {me && <span className="ml-2 text-xs font-normal text-naijaGreen">(You)</span>}
                                            </p>
                                            {badge && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                                                    {badge.icon} {badge.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{leader.total_jobs}</p>
                                            <p className="text-xs text-gray-400">jobs</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* My rank pinned at bottom if not in top 20 */}
                {!loading && !myInTop20 && myRank && (
                    <div className="border-t-2 border-dashed border-gray-200 px-5 py-3.5 flex items-center gap-4 bg-green-50">
                        <div className="w-8 text-center">
                            <span className="text-sm font-bold text-gray-500">#{myRank}</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-naijaGreen">
                                {getDisplayName(myName)}
                                <span className="ml-2 text-xs font-normal">(You)</span>
                            </p>
                            {getBadge(myTotalJobs) && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBadge(myTotalJobs).color}`}>
                                    {getBadge(myTotalJobs).icon} {getBadge(myTotalJobs).name}
                                </span>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-800">{myTotalJobs || 0}</p>
                            <p className="text-xs text-gray-400">jobs</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CustomerProfile({ user, supabase, setViewWithHistory }) {
    const [customer, setCustomer] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    // Edit state
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editing, setEditing] = useState(false);

    // UI state
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [myRank, setMyRank] = useState(null);

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            const [{ data: cust }, { data: sub }] = await Promise.all([
                supabase.from('customers').select('*').eq('id', user.id).single(),
                supabase.from('subscriptions').select('*').eq('customer_id', user.id).eq('status', 'active').maybeSingle(),
            ]);

            if (cust) {
                setCustomer(cust);
                setEditName(cust.customer_name || '');
                setEditPhone(cust.phone || '');

                // Get rank
                if (cust.total_jobs > 0) {
                    const { count } = await supabase
                        .from('customers')
                        .select('*', { count: 'exact', head: true })
                        .gt('total_jobs', cust.total_jobs);
                    setMyRank((count || 0) + 1);
                }
            }
            setSubscription(sub || null);
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    }, [user, supabase]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    customer_name: editName.trim(),
                    phone: editPhone.trim(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) throw error;

            setCustomer(prev => ({ ...prev, customer_name: editName.trim(), phone: editPhone.trim() }));
            setEditing(false);
            setSaveMsg('Profile updated successfully!');
            setTimeout(() => setSaveMsg(''), 4000);
        } catch (err) {
            console.error('Save error:', err);
            setSaveMsg('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePaystackCheckout = (plan) => {
        const amount = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
        const planId = plan.planIdMonthly; // monthly recurring; yearly handled separately

        // Load Paystack inline
        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: amount * 100, // kobo
            currency: 'NGN',
            plan: billingCycle === 'monthly' ? planId : undefined,
            // For yearly: one-time charge, no plan
            metadata: {
                custom_fields: [
                    { display_name: 'Plan', variable_name: 'plan', value: plan.name },
                    { display_name: 'Billing Cycle', variable_name: 'billing_cycle', value: billingCycle },
                    { display_name: 'Customer ID', variable_name: 'customer_id', value: user.id },
                ]
            },
            callback: (response) => {
                console.log('Paystack payment successful:', response.reference);
                // Webhook will handle subscription creation
                setSaveMsg('Payment successful! Your plan will activate shortly.');
                setTimeout(() => setSaveMsg(''), 6000);
                loadData();
            },
            onClose: () => {
                console.log('Paystack modal closed');
            },
        });
        handler.openIframe();
    };

    const badge = getBadge(customer?.total_jobs);
    const currentPlan = PLANS.find(p => p.key === subscription?.plan);

    if (loading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />)}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Paystack script */}
            <script src="https://js.paystack.co/v1/inline.js" />

            {/* Save message */}
            {saveMsg && (
                <div className={`rounded-xl p-4 text-sm font-medium ${saveMsg.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {saveMsg}
                </div>
            )}

            {/* ── Profile Card ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                                <span className="text-2xl font-bold text-white">
                                    {(customer?.customer_name || user?.email || 'U').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{customer?.customer_name || 'Customer'}</h2>
                                <p className="text-green-100 text-sm">{user?.email}</p>
                            </div>
                        </div>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {editing ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-naijaGreen focus:border-transparent"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    value={editPhone}
                                    onChange={e => setEditPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-naijaGreen focus:border-transparent"
                                    placeholder="e.g. 08012345678"
                                    type="tel"
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => { setEditing(false); setEditName(customer?.customer_name || ''); setEditPhone(customer?.phone || ''); }}
                                    className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !editName.trim()}
                                    className="flex-1 py-2.5 bg-naijaGreen text-white rounded-xl font-medium hover:bg-darkGreen disabled:opacity-50 transition"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-sm text-gray-500">Phone</span>
                                <span className="font-medium text-gray-800">{customer?.phone || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-sm text-gray-500">Member Since</span>
                                <span className="font-medium text-gray-800">
                                    {customer?.created_at ? new Date(customer.created_at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' }) : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-500">Verification</span>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${customer?.verification_level === 'verified' ? 'bg-green-100 text-green-700' :
                                        customer?.verification_level === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {customer?.verification_level === 'verified' ? '✓ Verified' :
                                            customer?.verification_level === 'pending' ? '⏳ Pending' : 'Basic'}
                                    </span>
                                    {customer?.verification_level !== 'verified' && (
                                        <button
                                            onClick={() => setShowVerificationModal(true)}
                                            className="text-xs text-naijaGreen hover:underline font-medium"
                                        >
                                            Upgrade →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Rank & Badge Card ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">My Standing</h3>
                    <button
                        onClick={() => setShowLeaderboard(true)}
                        className="text-sm text-naijaGreen hover:text-darkGreen font-medium flex items-center gap-1"
                    >
                        🏆 Leaderboard
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-gray-50 rounded-xl p-4">
                        <p className="text-2xl font-bold text-gray-800">{customer?.total_jobs || 0}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Jobs</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-4">
                        <p className="text-2xl font-bold text-gray-800">
                            {myRank ? `#${myRank}` : '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">My Rank</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-4">
                        {badge ? (
                            <>
                                <p className="text-2xl">{badge.icon}</p>
                                <p className="text-xs font-semibold mt-1" style={{ color: 'inherit' }}>{badge.name}</p>
                            </>
                        ) : (
                            <>
                                <p className="text-2xl">🌿</p>
                                <p className="text-xs text-gray-500 mt-1">No Badge Yet</p>
                            </>
                        )}
                    </div>
                </div>

                {badge && (
                    <div className={`mt-4 rounded-xl p-3 flex items-center gap-3 ${badge.color}`}>
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                            <p className="font-semibold text-sm">{badge.name} Badge</p>
                            <p className="text-xs opacity-75">
                                {badge.max === Infinity
                                    ? `${badge.min}+ completed jobs`
                                    : `${badge.min}–${badge.max} completed jobs`}
                            </p>
                        </div>
                    </div>
                )}

                {!customer?.total_jobs && (
                    <p className="mt-3 text-sm text-gray-400 text-center">
                        Complete your first job to earn a badge and appear on the leaderboard
                    </p>
                )}
            </div>

            {/* ── Subscription Card ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Subscription</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {subscription
                                    ? `Active: ${currentPlan?.name || subscription.plan} Plan`
                                    : 'You are on the Free Plan'}
                            </p>
                        </div>
                        {subscription && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                Active
                            </span>
                        )}
                    </div>

                    {/* Current plan details */}
                    {subscription && (
                        <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Plan</span>
                                <span className="font-medium">{currentPlan?.name || subscription.plan}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Billing</span>
                                <span className="font-medium capitalize">{subscription.billing_cycle}</span>
                            </div>
                            {subscription.current_period_end && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Renews</span>
                                    <span className="font-medium">
                                        {new Date(subscription.current_period_end).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Billing toggle */}
                <div className="px-6 pt-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-gray-700">Available Plans</p>
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${billingCycle === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${billingCycle === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                            >
                                Yearly
                                <span className="ml-1 text-naijaGreen">−5%</span>
                            </button>
                        </div>
                    </div>

                    {/* Plan cards */}
                    <div className="space-y-3 pb-6">
                        {PLANS.map(plan => {
                            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                            const isActive = subscription?.plan === plan.key;

                            return (
                                <div
                                    key={plan.key}
                                    className={`relative rounded-xl border-2 p-4 transition ${isActive ? 'border-naijaGreen bg-green-50' :
                                        plan.popular ? 'border-naijaGreen/40' : 'border-gray-200'
                                        }`}
                                >
                                    {plan.popular && !isActive && (
                                        <span className="absolute -top-2.5 left-4 bg-naijaGreen text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                                            Most Popular
                                        </span>
                                    )}
                                    {isActive && (
                                        <span className="absolute -top-2.5 left-4 bg-naijaGreen text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                                            Current Plan
                                        </span>
                                    )}

                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{plan.badge}</span>
                                            <div>
                                                <p className="font-bold text-gray-800">{plan.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {plan.features[0]}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-800">{fmt(price)}</p>
                                            <p className="text-xs text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {plan.features.map((f, i) => (
                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                {f}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => !isActive && handlePaystackCheckout(plan)}
                                        disabled={isActive}
                                        className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition ${isActive
                                            ? 'bg-green-100 text-green-700 cursor-default'
                                            : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
                                            }`}
                                    >
                                        {isActive ? '✓ Active Plan' : `Upgrade to ${plan.name}`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <LeaderboardModal
                    onClose={() => setShowLeaderboard(false)}
                    currentUserId={user?.id}
                    supabase={supabase}
                    myRank={myRank}
                    myTotalJobs={customer?.total_jobs}
                    myName={customer?.customer_name}
                />
            )}

            {/* Verification Modal */}
            <VerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                onVerificationSubmitted={(status) => {
                    setCustomer(prev => ({ ...prev, verification_level: status }));
                    setShowVerificationModal(false);
                }}
            />
        </div>
    );
}
