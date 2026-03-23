// src/components/CustomerProfile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../context/SupabaseContext';
import VerificationModal from './VerificationModal';

const PAYSTACK_PUBLIC_KEY = 'pk_test_535c52d3bb40d34bd34aba8b4db32bcc29db5b1f';

const PLANS = [
    {
        key: 'logistics',
        name: 'Logistics',
        monthlyPrice: 5000,
        yearlyPrice: 57000,
        planIdMonthly: 'PLN_32rwu4fudk5yl1z',
        planIdYearly: null,
        color: 'from-blue-500 to-blue-600',
        badge: '🚚',
        features: ['Priority logistics matching', 'Delivery tracking', 'Basic support'],
        restricted: true,
    },
    {
        key: 'basic',
        name: 'Basic',
        monthlyPrice: 15000,
        yearlyPrice: 171000,
        planIdMonthly: 'PLN_h0pvuhhdtinof53',
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
        planIdMonthly: 'PLN_6x6uirl9g69w52k',
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
        planIdMonthly: 'PLN_bqietirrn2omu3p',
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

const SP_PLUS_CATEGORIES = [
    { key: 'automobile', label: 'Automobile', icon: '🚗', desc: 'Mechanics, auto electricians, panel beaters' },
    { key: 'catering', label: 'Catering', icon: '🍽️', desc: 'Caterers, bakers, personal chefs' },
    { key: 'appliance', label: 'Appliance Repair', icon: '🔧', desc: 'AC, fridge, washing machine specialists' },
    { key: 'fashion', label: 'Fashion', icon: '👗', desc: 'Tailors, fashion designers, alterations' },
    { key: 'instruments', label: 'Instrument Repair', icon: '🎸', desc: 'Musical instrument servicing and repair' },
    { key: 'creative', label: 'Creative & Digital', icon: '🎨', desc: 'Videography, photography, graphics design' },
    { key: 'tech', label: 'Tech & Software', icon: '💻', desc: 'Software engineers, AI automation, IT support' },
    { key: 'media', label: 'Media Production', icon: '🎬', desc: 'Video editing, animation, content creation' },
    { key: 'shoe_repair', label: 'Shoe Repair', icon: '👟', desc: 'Cobblers, shoe restoration, bag repair' },
    { key: 'veterinary', label: 'Veterinary', icon: '🐾', desc: 'Mobile vets, pet care, animal health' },
    { key: 'hair', label: 'Hair Services', icon: '💇', desc: 'Mobile hairstylists and barbers' },
    { key: 'makeup', label: 'Makeup & Beauty', icon: '💄', desc: 'Makeup artists, nail technicians, henna' },
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

// ─── Service Providers+ Modal ─────────────────────────────────────────────────
// ─── Service Providers+ Modal ─────────────────────────────────────────────────
function ServiceProvidersPlusModal({ onClose, hasAccess, onSubscribe, supabase }) {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [providers, setProviders] = useState([]);
    const [loadingProviders, setLoadingProviders] = useState(false);

    useEffect(() => {
        if (!hasAccess || !selectedCategory) return;
        const fetchProviders = async () => {
            setLoadingProviders(true);
            const { data } = await supabase
                .from('sp_plus_providers')
                .select('*')
                .eq('category', selectedCategory)
                .eq('is_active', true)
                .order('name');
            setProviders(data || []);
            setLoadingProviders(false);
        };
        fetchProviders();
    }, [selectedCategory, hasAccess, supabase]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 relative shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">✨</div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Service Providers+</h3>
                            <p className="text-purple-200 text-sm">Beyond home services</p>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1">
                    {hasAccess ? (
                        <div className="p-4 space-y-4">
                            {/* Category pills */}
                            <div className="flex flex-wrap gap-2">
                                {SP_PLUS_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.key}
                                        onClick={() => setSelectedCategory(cat.key === selectedCategory ? null : cat.key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition border ${selectedCategory === cat.key
                                                ? 'bg-purple-600 text-white border-purple-600'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                                            }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Provider list */}
                            {!selectedCategory ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-3xl mb-3">👆</p>
                                    <p className="text-sm font-medium">Select a category to browse providers</p>
                                </div>
                            ) : loadingProviders ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-24" />
                                    ))}
                                </div>
                            ) : providers.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <p className="text-3xl mb-3">🔍</p>
                                    <p className="text-sm font-medium">No providers listed yet in this category</p>
                                    <p className="text-xs mt-1">Check back soon — we're always adding more</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {providers.map(provider => (
                                        <div key={provider.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex gap-4 items-start">
                                            {/* Photo */}
                                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-purple-100 flex items-center justify-center">
                                                {provider.photo_url ? (
                                                    <img src={provider.photo_url} alt={provider.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl">
                                                        {SP_PLUS_CATEGORIES.find(c => c.key === provider.category)?.icon || '👤'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 truncate">{provider.name}</p>
                                                <p className="text-sm text-purple-600 font-medium">{provider.specialty}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">📍 {provider.location}</p>

                                                {/* Action buttons */}
                                                <div className="flex gap-2 mt-3">
                                                    <a
                                                        href={`tel:${provider.phone}`}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
                                                    >
                                                        📞 Call
                                                    </a>
                                                    {provider.whatsapp && (
                                                        <a
                                                            href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition"
                                                        >
                                                            💬 WhatsApp
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 space-y-5">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">
                                    🔒 Subscribers Only
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">A whole new world of professionals</h4>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    Mount subscribers get exclusive access to a curated directory of verified professionals beyond home services — all personally vetted by our team.
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 space-y-3">
                                <p className="text-sm font-bold text-purple-800">What's inside Service Providers+</p>
                                {SP_PLUS_CATEGORIES.map(cat => (
                                    <div key={cat.key} className="flex items-start gap-3">
                                        <span className="text-xl shrink-0">{cat.icon}</span>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-800">{cat.label}</p>
                                            <p className="text-xs text-gray-500">{cat.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2.5">
                                {[
                                    { icon: '✅', text: 'Every provider is manually verified by Mount' },
                                    { icon: '📸', text: 'Browse real photos of previous work' },
                                    { icon: '📞', text: 'Contact providers directly via call or WhatsApp' },
                                    { icon: '🌍', text: 'Hard skills and soft skills — all in one place' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                        <span className="text-base shrink-0">{item.icon}</span>
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Available on these plans</p>
                                <div className="flex gap-2 flex-wrap">
                                    {['Basic', 'Standard', 'Premium'].map(p => (
                                        <span key={p} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 shadow-sm">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={onSubscribe}
                                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:opacity-90 transition shadow-lg shadow-purple-200"
                            >
                                Subscribe to Unlock Access
                            </button>

                            <p className="text-center text-xs text-gray-400 pb-2">
                                Starting from ₦15,000/month · Cancel anytime
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
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
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen rounded-t-2xl px-6 py-5 flex items-center justify-between shrink-0">
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
                                    <div key={leader.id} className={`px-5 py-3.5 flex items-center gap-4 ${me ? 'bg-green-50 border-l-4 border-naijaGreen' : 'hover:bg-gray-50'}`}>
                                        <div className="w-8 text-center">
                                            {rankIcon ? <span className="text-xl">{rankIcon}</span> : <span className="text-sm font-bold text-gray-500">#{rank}</span>}
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

                {!loading && !myInTop20 && myRank && (
                    <div className="border-t-2 border-dashed border-gray-200 px-5 py-3.5 flex items-center gap-4 bg-green-50 shrink-0">
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

// ─── Subscription Terms Modal ─────────────────────────────────────────────────
function SubscriptionTermsModal({ plan, billingCycle, onAccept, onDecline }) {
    const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;
    const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const CREDIT_RATE = 0.9;
    const monthlyCredit = plan.monthlyPrice * CREDIT_RATE;
    const mountFee = plan.monthlyPrice * 0.1;
    const hasSPPlus = ['basic', 'standard', 'premium'].includes(plan.key);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Before You Subscribe</h3>
                            <p className="text-gray-400 text-sm mt-0.5">Please read and agree to continue</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-xl shrink-0`}>
                            {plan.badge}
                        </div>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                    {/* Plan summary */}
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900">{plan.name} Plan</p>
                            <p className="text-xs text-gray-500 capitalize mt-0.5">{billingCycle} billing</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-gray-900">{fmt(price)}</p>
                            <p className="text-xs text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                        </div>
                    </div>

                    {/* Section 1: Credit wallet breakdown */}
                    <div className="space-y-2.5">
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                            How Your Credit Wallet Works
                        </p>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3 text-sm">
                            <p className="text-gray-700 leading-relaxed">
                                Each billing cycle, your subscription fee is split between Mount and your credit wallet:
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5">
                                    <span className="text-gray-600">Mount service fee (10%)</span>
                                    <span className="font-bold text-gray-800">{fmt(mountFee)}</span>
                                </div>
                                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5">
                                    <span className="text-gray-600">Your credit wallet (90%)</span>
                                    <span className="font-bold text-indigo-700">{fmt(monthlyCredit)}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Credit is added to your wallet every month and can be used to offset job payments on Mount.
                            </p>
                        </div>
                    </div>

                    {/* Section 2: Credit allowance structure */}
                    <div className="space-y-2.5">
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                            Monthly Credit Allowance Structure
                        </p>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-3 text-sm">
                            <p className="text-gray-700 leading-relaxed">
                                To ensure fair usage, only a portion of your credit wallet is usable at any given time within each billing cycle:
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5">
                                    <div>
                                        <p className="font-semibold text-gray-800">Days 1 – 14</p>
                                        <p className="text-xs text-gray-500">First half of the month</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-amber-700">50% usable</p>
                                        <p className="text-xs text-gray-500">{fmt(monthlyCredit * 0.5)} available</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5">
                                    <div>
                                        <p className="font-semibold text-gray-800">Days 15 – End</p>
                                        <p className="text-xs text-gray-500">Second half of the month</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-700">70% usable</p>
                                        <p className="text-xs text-gray-500">{fmt(monthlyCredit * 0.7)} available</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Unused credit rolls over indefinitely — it never expires. A full override of these caps requires admin approval. Contact support to request one.
                            </p>
                        </div>
                    </div>

                    {/* Section 3: Service Providers+ notice (only if applicable) */}
                    {hasSPPlus && (
                        <div className="space-y-2.5">
                            <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                Service Providers+ Payments
                            </p>
                            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                                <p>
                                    Your plan includes access to <strong>Service Providers+</strong> — our exclusive directory of verified professionals beyond home services.
                                </p>
                                <p className="mt-2 text-purple-700 font-medium">
                                    ⚠️ Please note: At this time, credit wallet funds cannot be used to pay for Service Providers+ bookings. This feature is on our roadmap and will be enabled in a future update.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Section 4: No refunds */}
                    <div className="space-y-2.5">
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span className={`w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}>{hasSPPlus ? '4' : '3'}</span>
                            Refund Policy
                        </p>
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                            <p>
                                <strong>Subscription payments are non-refundable.</strong> Once a payment is processed, it cannot be reversed or refunded under any circumstances.
                            </p>
                            <p className="mt-2">
                                If you are unsatisfied with what Mount offers, you may <strong>cancel your subscription at any time</strong> by reaching out to our customer care team. Cancellation takes effect at the end of your current billing period.
                            </p>
                        </div>
                    </div>

                    {/* Section 5: Support */}
                    <div className="space-y-2.5">
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <span className={`w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}>{hasSPPlus ? '5' : '4'}</span>
                            Need Help?
                        </p>
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-gray-700 space-y-2">
                            <p>Our customer support team is available to help with subscription changes, cancellations, credit queries, and anything else.</p>
                            <p className="font-medium text-green-800">
                                📞 Call, text, or email us via the <strong>Help Center</strong> in the app — we're always reachable.
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 text-center pb-1">
                        By tapping "I Agree & Continue", you confirm that you have read, understood, and accepted these terms.
                    </p>
                </div>

                {/* Footer buttons */}
                <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 shrink-0 bg-white">
                    <button
                        onClick={onDecline}
                        className="flex-1 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAccept}
                        className={`flex-1 py-3 bg-gradient-to-r ${plan.color} text-white rounded-xl font-bold hover:opacity-90 transition text-sm shadow-lg`}
                    >
                        I Agree & Continue
                    </button>
                </div>
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

    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editing, setEditing] = useState(false);

    const [billingCycle, setBillingCycle] = useState('monthly');
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showServiceProvidersPlus, setShowServiceProvidersPlus] = useState(false);
    const [myRank, setMyRank] = useState(null);
    const [pendingPlan, setPendingPlan] = useState(null); // plan awaiting terms acceptance

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
        const isYearly = billingCycle === 'yearly';
        const amount = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: amount * 100,
            currency: 'NGN',
            plan: isYearly ? undefined : plan.planIdMonthly,
            channels: isYearly ? ['card', 'bank_transfer', 'ussd', 'bank'] : ['card'],
            metadata: {
                custom_fields: [
                    { display_name: 'Plan', variable_name: 'plan', value: plan.key },
                    { display_name: 'Billing Cycle', variable_name: 'billing_cycle', value: billingCycle },
                    { display_name: 'Customer ID', variable_name: 'customer_id', value: user.id },
                ]
            },
            callback: (response) => {
                setSaveMsg('Payment successful! Your plan will activate shortly.');
                setTimeout(() => setSaveMsg(''), 6000);
                loadData();
            },
            onClose: () => { },
        });
        handler.openIframe();
    };

    // Show terms modal first — only proceed to Paystack after acceptance
    const handleSubscribeClick = (plan) => {
        if (subscription?.plan === plan.key) return;
        setPendingPlan(plan);
    };

    const handleTermsAccept = () => {
        const plan = pendingPlan;
        setPendingPlan(null);
        handlePaystackCheckout(plan);
    };

    const handleTermsDecline = () => {
        setPendingPlan(null);
    };

    // Access: basic, standard, premium only
    const spPlusAccess = ['basic', 'standard', 'premium'].includes(subscription?.plan);

    const scrollToSubscription = () => {
        setShowServiceProvidersPlus(false);
        setTimeout(() => {
            document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
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
            <script src="https://js.paystack.co/v1/inline.js" />

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
                            <button onClick={() => setEditing(true)} className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition">
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
                                <input value={editName} onChange={e => setEditName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-naijaGreen focus:border-transparent"
                                    placeholder="Your full name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input value={editPhone} onChange={e => setEditPhone(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-naijaGreen focus:border-transparent"
                                    placeholder="e.g. 08012345678" type="tel" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => { setEditing(false); setEditName(customer?.customer_name || ''); setEditPhone(customer?.phone || ''); }}
                                    className="flex-1 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving || !editName.trim()}
                                    className="flex-1 py-2.5 bg-naijaGreen text-white rounded-xl font-medium hover:bg-darkGreen disabled:opacity-50 transition">
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
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${customer?.verification_level === 'verified' ? 'bg-green-100 text-green-700' : customer?.verification_level === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {customer?.verification_level === 'verified' ? '✓ Verified' : customer?.verification_level === 'pending' ? '⏳ Pending' : 'Basic'}
                                    </span>
                                    {customer?.verification_level !== 'verified' && (
                                        <button onClick={() => setShowVerificationModal(true)} className="text-xs text-naijaGreen hover:underline font-medium">
                                            Upgrade →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Service Providers+ Card ── */}
            <button
                onClick={() => setShowServiceProvidersPlus(true)}
                className="w-full text-left bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 shadow-lg shadow-purple-200 hover:opacity-95 transition active:scale-[0.99]"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl shrink-0">✨</div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-bold text-base">Service Providers+</h3>
                                {spPlusAccess ? (
                                    <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">Subscriber</span>
                                ) : (
                                    <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">Members Only</span>
                                )}
                            </div>
                            <p className="text-purple-200 text-sm mt-0.5">
                                {spPlusAccess
                                    ? 'Access verified professionals beyond home services'
                                    : 'Mechanics, caterers, designers, developers & more'}
                            </p>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-white/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {SP_PLUS_CATEGORIES.slice(0, 5).map(cat => (
                        <span key={cat.key} className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                            {cat.icon} {cat.label}
                        </span>
                    ))}
                    <span className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        +{SP_PLUS_CATEGORIES.length - 5} more
                    </span>
                </div>
            </button>

            {/* ── Rank & Badge Card ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">My Standing</h3>
                    <button onClick={() => setShowLeaderboard(true)} className="text-sm text-naijaGreen hover:text-darkGreen font-medium flex items-center gap-1">
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
                        <p className="text-2xl font-bold text-gray-800">{myRank ? `#${myRank}` : '—'}</p>
                        <p className="text-xs text-gray-500 mt-1">My Rank</p>
                    </div>
                    <div className="text-center bg-gray-50 rounded-xl p-4">
                        {badge ? (
                            <><p className="text-2xl">{badge.icon}</p><p className="text-xs font-semibold mt-1">{badge.name}</p></>
                        ) : (
                            <><p className="text-2xl">🌿</p><p className="text-xs text-gray-500 mt-1">No Badge Yet</p></>
                        )}
                    </div>
                </div>
                {badge && (
                    <div className={`mt-4 rounded-xl p-3 flex items-center gap-3 ${badge.color}`}>
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                            <p className="font-semibold text-sm">{badge.name} Badge</p>
                            <p className="text-xs opacity-75">
                                {badge.max === Infinity ? `${badge.min}+ completed jobs` : `${badge.min}–${badge.max} completed jobs`}
                            </p>
                        </div>
                    </div>
                )}
                {!customer?.total_jobs && (
                    <p className="mt-3 text-sm text-gray-400 text-center">Complete your first job to earn a badge and appear on the leaderboard</p>
                )}
            </div>

            {/* ── Subscription Card ── */}
            <div id="subscription-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Subscription</h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {subscription ? `Active: ${currentPlan?.name || subscription.plan} Plan` : 'You are on the Free Plan'}
                            </p>
                        </div>
                        {subscription && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
                        )}
                    </div>
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

                <div className="px-6 pt-5">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-gray-700">Available Plans</p>
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                            <button onClick={() => setBillingCycle('monthly')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${billingCycle === 'monthly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                                Monthly
                            </button>
                            <button onClick={() => setBillingCycle('yearly')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${billingCycle === 'yearly' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                                Yearly <span className="ml-1 text-naijaGreen">−5%</span>
                            </button>
                        </div>
                    </div>

                    <div className={`mb-4 px-3 py-2.5 rounded-lg text-xs flex items-center gap-2 ${billingCycle === 'monthly' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                        {billingCycle === 'monthly'
                            ? <><span>💳</span><span><strong>Card payment only</strong> — monthly plans are automatically renewed via your debit/credit card</span></>
                            : <><span>🏦</span><span><strong>Card or bank transfer</strong> — yearly plans are a one-time charge, you'll be reminded to renew before expiry</span></>
                        }
                    </div>

                    <div className="space-y-3 pb-6">
                        {PLANS.map(plan => {
                            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                            const isActive = subscription?.plan === plan.key;
                            return (
                                <div key={plan.key} className={`relative rounded-xl border-2 p-4 transition ${isActive ? 'border-naijaGreen bg-green-50' : plan.popular ? 'border-naijaGreen/40' : 'border-gray-200'}`}>
                                    {plan.popular && !isActive && (
                                        <span className="absolute -top-2.5 left-4 bg-naijaGreen text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Most Popular</span>
                                    )}
                                    {isActive && (
                                        <span className="absolute -top-2.5 left-4 bg-naijaGreen text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Current Plan</span>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{plan.badge}</span>
                                            <div>
                                                <p className="font-bold text-gray-800">{plan.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{plan.features[0]}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-800">{fmt(price)}</p>
                                            <p className="text-xs text-gray-500">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {plan.features.map((f, i) => (
                                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => !isActive && handleSubscribeClick(plan)}
                                        disabled={isActive}
                                        className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition ${isActive ? 'bg-green-100 text-green-700 cursor-default' : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`}`}
                                    >
                                        {isActive ? '✓ Active Plan' : `Upgrade to ${plan.name}`}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            {pendingPlan && (
                <SubscriptionTermsModal
                    plan={pendingPlan}
                    billingCycle={billingCycle}
                    onAccept={handleTermsAccept}
                    onDecline={handleTermsDecline}
                />
            )}

            {showServiceProvidersPlus && (
                <ServiceProvidersPlusModal
                    onClose={() => setShowServiceProvidersPlus(false)}
                    hasAccess={spPlusAccess}
                    onSubscribe={scrollToSubscription}
                    supabase={supabase}
                />
            )}

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