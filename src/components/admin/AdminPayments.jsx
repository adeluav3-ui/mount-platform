// src/components/admin/AdminPayments.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const AdminPayments = () => {
    const { supabase } = useSupabase();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'verified', 'all'
    const [stats, setStats] = useState({
        pending: 0,
        verified: 0,
        totalAmount: 0
    });

    useEffect(() => {
        fetchPayments();
        fetchStats();
    }, [filter]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('financial_transactions')
                .select(`
                *,
                jobs (
                    id,
                    description,
                    status,
                    customer_id
                ),
                profiles!financial_transactions_user_id_fkey (
                    full_name,
                    phone,
                    email
                ),
                companies!financial_transactions_user_id_fkey (
                    company_name  // Changed from business_name
                )
            `)
                .eq('payment_method', 'bank_transfer')
                .order('created_at', { ascending: false });

            if (filter === 'pending') {
                query = query.eq('verified_by_admin', false);
            } else if (filter === 'verified') {
                query = query.eq('verified_by_admin', true);
            }

            const { data, error } = await query;

            if (error) throw error;
            setPayments(data || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('payment_method', 'bank_transfer');

            if (error) throw error;

            const stats = {
                pending: data.filter(p => !p.verified_by_admin).length,
                verified: data.filter(p => p.verified_by_admin).length,
                totalAmount: data.reduce((sum, p) => sum + (p.amount || 0), 0)
            };

            setStats(stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const verifyPayment = async (paymentId, approved = true) => {
        try {
            const updates = {
                verified_by_admin: true,
                admin_verified_at: new Date().toISOString(),
                status: approved ? 'completed' : 'rejected'
            };

            const { error } = await supabase
                .from('financial_transactions')
                .update(updates)
                .eq('id', paymentId);

            if (error) throw error;

            if (approved) {
                // Find the payment to get job_id
                const payment = payments.find(p => p.id === paymentId);
                if (payment?.job_id) {
                    // Update job status
                    await supabase
                        .from('jobs')
                        .update({ status: 'paid' })
                        .eq('id', payment.job_id);

                    // Send notification to customer
                    await supabase.from('notifications').insert({
                        user_id: payment.jobs?.customer?.id,
                        title: 'Payment Verified!',
                        message: `Your payment of ₦${payment.amount?.toLocaleString()} has been verified. The service provider will now proceed with your job.`,
                        type: 'payment_success'
                    });
                }
            }

            // Refresh data
            fetchPayments();
            fetchStats();

            alert(`Payment ${approved ? 'verified' : 'rejected'} successfully!`);
        } catch (error) {
            console.error('Error verifying payment:', error);
            alert('Error updating payment: ' + error.message);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">Loading payments...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Payment Verification</h1>
                <p className="text-gray-600">Verify customer bank transfers and update job status</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending Verification</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">⏰</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Verified Today</p>
                            <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">✅</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Processed</p>
                            <p className="text-2xl font-bold text-blue-600">₦{stats.totalAmount?.toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'pending'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        ⏰ Pending ({stats.pending})
                    </button>
                    <button
                        onClick={() => setFilter('verified')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'verified'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        ✅ Verified ({stats.verified})
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium ${filter === 'all'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        📋 All Payments
                    </button>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {payments.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {filter === 'pending' ? 'No pending payments!' : 'No payments found'}
                        </h3>
                        <p className="text-gray-600">
                            {filter === 'pending'
                                ? 'All payments have been verified. Check back later for new transfers.'
                                : 'No payments match your filter.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {payments.map((payment) => (
                            <div key={payment.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    {/* Left Column: Payment Info */}
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${payment.verified_by_admin
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {payment.verified_by_admin ? 'Verified' : 'Pending'}
                                                </span>
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                                    {payment.bank_reference}
                                                </span>
                                            </div>
                                            <span className="text-xl font-bold text-naijaGreen">
                                                ₦{payment.amount?.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-600">Job:</span>
                                                <span className="ml-2">{payment.jobs?.title || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Customer:</span>
                                                <span className="ml-2">{payment.jobs?.customer?.full_name || payment.jobs?.customer?.email || 'N/A'}</span>
                                                {payment.jobs?.customer?.phone && (
                                                    <span className="ml-4 text-gray-500">📱 {payment.jobs.customer.phone}</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Date:</span>
                                                <span className="ml-2">{formatDate(payment.created_at)}</span>
                                            </div>
                                            {payment.proof_of_payment_url && (
                                                <div>
                                                    <a
                                                        href={payment.proof_of_payment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                                    >
                                                        📎 View Proof of Payment
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Column: Actions */}
                                    {!payment.verified_by_admin && (
                                        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                                            <button
                                                onClick={() => verifyPayment(payment.id, true)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                                            >
                                                <span>✓</span>
                                                <span>Verify Payment</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const reason = prompt('Reason for rejection (optional):');
                                                    if (reason !== null) {
                                                        // Update with rejection reason
                                                        supabase
                                                            .from('financial_transactions')
                                                            .update({
                                                                admin_notes: reason || 'Payment rejected',
                                                                status: 'rejected'
                                                            })
                                                            .eq('id', payment.id);
                                                        verifyPayment(payment.id, false);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2"
                                            >
                                                <span>✗</span>
                                                <span>Reject</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Admin Notes (if any) */}
                                {payment.admin_notes && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700">Admin Notes:</p>
                                        <p className="text-sm text-gray-600">{payment.admin_notes}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">💡 Verification Instructions:</h4>
                <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-700">
                    <li>Check your business bank account for the transfer</li>
                    <li>Verify the amount matches exactly</li>
                    <li>Confirm the reference code matches</li>
                    <li>Click "Verify Payment" to approve or "Reject" if issues</li>
                    <li>Customer and service provider will be notified automatically</li>
                </ol>
            </div>
        </div>
    );
};

export default AdminPayments;