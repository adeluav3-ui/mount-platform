import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../context/SupabaseContext';
import logo from '../assets/logo.png';

export default function LandingPage() {
    const [showWaitlist, setShowWaitlist] = useState(true);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [userType, setUserType] = useState('customer');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [betaCode, setBetaCode] = useState('');
    const [betaError, setBetaError] = useState('');

    const { supabase } = useSupabase();
    const navigate = useNavigate();

    // Check if user is already logged in
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/dashboard');
            }
        };
        checkUser();
    }, [navigate, supabase.auth]);

    const handleWaitlistSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Insert into waitlist
            const { error: insertError } = await supabase
                .from('waitlist')
                .insert({
                    email: email.trim().toLowerCase(),
                    phone: phone.trim() || null,
                    user_type: userType,
                    is_beta_tester: false
                });

            if (insertError?.code === '23505') {
                setError('This email is already on our waitlist!');
                return;
            }

            if (insertError) throw insertError;

            // SUCCESS
            setSuccess(true);
            console.log('Waitlist signup:', { email, phone, userType });

        } catch (err) {
            setError(err.message || 'Failed to join waitlist');
        } finally {
            setLoading(false);
        }
    };

    const handleBetaAccess = async (e) => {
        e.preventDefault();
        setBetaError('');
        setLoading(true);

        try {
            // List of valid beta codes (you can store in database later)
            const validBetaCodes = [
                'MOUNTBETA2024',
                'MOUNTLAUNCH',
                'EARLYACCESS',
                'BETATESTER',
                'PIONEER100'
            ];

            const enteredCode = betaCode.trim().toUpperCase();

            if (!validBetaCodes.includes(enteredCode)) {
                setBetaError('Invalid beta access code');
                return;
            }

            // ✅ NO EMAIL PROMPT - Direct redirect to login
            console.log('Beta code accepted, redirecting to login...');

            // Optional: Store in localStorage that user has a valid beta code
            localStorage.setItem('hasValidBetaCode', 'true');
            localStorage.setItem('betaCodeUsed', enteredCode);

            // Direct redirect to login page
            navigate('/login');

        } catch (err) {
            setBetaError(err.message || 'Error processing beta access');
        } finally {
            setLoading(false);
        }
    };

    // If already a waitlist success
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">You're On The List!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for joining the Mount Platform waitlist. We'll notify you as soon as we launch to the public.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-700">
                            <strong>What's Next:</strong><br />
                            • We'll email you at <strong>{email}</strong><br />
                            • Launch announcement in 1-2 weeks<br />
                            • Early access for waitlist members
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setSuccess(false);
                            setEmail('');
                            setPhone('');
                        }}
                        className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Navigation */}
            <nav className="p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                            <img src={logo} alt="Mount Logo" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Mount</h1>
                    </div>
                    <button
                        onClick={() => setShowWaitlist(!showWaitlist)}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {showWaitlist ? 'Beta Tester?' : 'Join Waitlist'}
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {showWaitlist ? (
                    /* WAITLIST FORM */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column: Hero Text */}
                        <div>
                            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                Nigeria's Premier<br />
                                <span className="text-naijaGreen">Home Services</span> Platform
                            </h1>
                            <p className="text-xl text-gray-600 mb-8">
                                Connect with verified professionals for all your home service needs.
                                From electrical work to plumbing, we've got you covered.
                            </p>
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600">✓</span>
                                    </div>
                                    <span className="text-gray-700">Verified & background-checked professionals</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600">✓</span>
                                    </div>
                                    <span className="text-gray-700">Real-time job matching & notifications</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600">✓</span>
                                    </div>
                                    <span className="text-gray-700">Secure payments</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Waitlist Form */}
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Join Our Exclusive Waitlist
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Be among the first to experience seamless home services in Nigeria
                            </p>

                            <form onSubmit={handleWaitlistSubmit} className="space-y-6">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                    />
                                </div>

                                {/* Phone (Optional) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0803 123 4567"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        For SMS job alerts (Nigeria only)
                                    </p>
                                </div>

                                {/* User Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        I want to join as a:
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'customer', label: '👤 Homeowner', desc: 'Find service pros' },
                                            { value: 'company', label: '🏢 Service Company', desc: 'Get more jobs' }
                                        ].map((type) => (
                                            <button
                                                type="button"
                                                key={type.value}
                                                onClick={() => setUserType(type.value)}
                                                className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${userType === type.value
                                                    ? 'border-naijaGreen bg-green-50 text-naijaGreen'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                            >
                                                <div className="font-medium">{type.label}</div>
                                                <div className="text-xs mt-1 text-gray-500">{type.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-700 text-sm">{error}</p>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-naijaGreen to-darkGreen text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Joining Waitlist...</span>
                                        </div>
                                    ) : (
                                        'Join Waitlist'
                                    )}
                                </button>

                                <p className="text-center text-sm text-gray-600">
                                    Already a beta tester?{' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowWaitlist(false)}
                                        className="text-naijaGreen font-semibold hover:underline"
                                    >
                                        Click here for beta access
                                    </button>
                                </p>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* BETA ACCESS FORM */
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🔑</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Beta Tester Access
                            </h2>
                            <p className="text-gray-600">
                                Enter your beta access code to access the platform
                            </p>
                        </div>

                        <form onSubmit={handleBetaAccess} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Beta Access Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={betaCode}
                                    onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                                    placeholder="Enter code (e.g., MOUNT)"
                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors font-mono tracking-wider"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    This code is only for beta testers and early access users
                                </p>
                            </div>

                            {betaError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">{betaError}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Verifying Access...</span>
                                    </div>
                                ) : (
                                    'Access Platform'
                                )}
                            </button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => setShowWaitlist(true)}
                                    className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                    ← Back to waitlist
                                </button>
                            </div>
                        </form>

                        {/* Beta Tester Info */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-3">ℹ️ Beta Tester Information</h4>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>Beta testers get full access to the platform</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>Your feedback helps us improve the platform</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    <span>Report bugs and issues via the feedback button</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-16 p-6 border-t border-gray-200">
                <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
                    <p>© {new Date().getFullYear()} Mount Platform. All rights reserved.</p>
                    <p className="mt-2">Connecting Nigerian homeowners with verified service professionals</p>
                </div>
            </div>
        </div>
    );
}