// src/components/auth/CompleteProfile.jsx
// Shown to Google OAuth users who don't yet have a customers record
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';
import logo from '../../assets/logo.png';
import NotificationService from '../../services/NotificationService';

export default function CompleteProfile() {
    const { user, supabase } = useSupabase();
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // If no user at all, send to login
    useEffect(() => {
        if (!user) {
            navigate('/app/login');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!phone.trim()) {
            setError('Phone number is required');
            return;
        }

        setLoading(true);

        try {
            const userId = user.id;
            const fullName =
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                'Customer';
            const email = user.email;

            // 1. Upsert profile (may already exist partially)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: fullName,
                    phone: phone.trim(),
                    email: email,
                    role: 'customer',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (profileError) throw profileError;

            // Small delay to ensure profile is committed
            await new Promise(resolve => setTimeout(resolve, 800));

            // 2. Insert customers record
            const { error: customerError } = await supabase
                .from('customers')
                .insert({
                    id: userId,
                    customer_name: fullName,
                    phone: phone.trim(),
                    email: email,
                    created_at: new Date().toISOString()
                });

            if (customerError) throw customerError;

            // 3. Notify admins
            try {
                await NotificationService.notifyAdminsNewUser(userId, 'customer');
            } catch (notifErr) {
                console.warn('Admin notification failed (non-blocking):', notifErr);
            }

            // 4. Go to dashboard
            navigate('/dashboard');

        } catch (err) {
            console.error('CompleteProfile error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

                {/* Header */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                        <img src={logo} alt="Mount Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Mount</h1>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">One Last Step</h2>
                    <p className="text-gray-600">
                        We just need your phone number so service providers can reach you.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Show their name/email from Google - read only */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            disabled
                            value={
                                user?.user_metadata?.full_name ||
                                user?.user_metadata?.name ||
                                user?.email?.split('@')[0] || ''
                            }
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                        </label>
                        <input
                            required
                            type="tel"
                            placeholder="0803 123 4567"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 outline-none transition-colors"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-naijaGreen to-darkGreen text-white font-semibold py-4 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Setting up your account...</span>
                            </>
                        ) : (
                            <span>Complete Sign Up →</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}