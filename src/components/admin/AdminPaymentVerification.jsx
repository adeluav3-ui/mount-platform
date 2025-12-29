// src/components/admin/AdminPaymentVerification.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

export default function AdminPaymentVerification() {
    const { supabase } = useSupabase();
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingPayments();
    }, []);

    const fetchPendingPayments = async () => {
        try {
            // First, get transactions without complex joins
            const { data: transactions, error: transactionsError } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('status', 'pending')
                .eq('verified_by_admin', false)
                .eq('payment_method', 'bank_transfer')
                .order('created_at', { ascending: false });

            if (transactionsError) throw transactionsError;

            // Then get additional info for each transaction
            const paymentsWithDetails = await Promise.all(
                (transactions || []).map(async (transaction) => {
                    // Get job details
                    const { data: job } = await supabase
                        .from('jobs')
                        .select('id, description, status')
                        .eq('id', transaction.job_id)
                        .single();

                    // Get customer profile
                    const { data: customer } = await supabase
                        .from('profiles')
                        .select('full_name, phone, email')
                        .eq('id', transaction.user_id)
                        .single();

                    return {
                        ...transaction,
                        job: job || null,
                        customer: customer || null
                    };
                })
            );

            setPendingPayments(paymentsWithDetails);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const verifyPayment = async (paymentId, approved = true) => {
        // Find the payment first
        const payment = pendingPayments.find(p => p.id === paymentId);
        if (!payment) {
            alert('Payment not found!');
            return;
        }

        try {
            console.log('🔄 Verifying payment:', {
                paymentId,
                type: payment.type,
                amount: payment.amount,
                job_id: payment.job_id
            });

            // 1. Update the financial transaction with CORRECT columns
            const updates = {
                verified_by_admin: true,
                admin_verified_at: new Date().toISOString(),
                status: approved ? 'completed' : 'failed',
                admin_notes: approved ? 'Payment verified by admin' : 'Payment rejected by admin'
                // NO updated_at column exists
            };

            console.log('📤 Updating transaction with:', updates);

            const { error: transactionError } = await supabase
                .from('financial_transactions')
                .update(updates)
                .eq('id', paymentId);

            if (transactionError) {
                console.error('❌ Transaction update error:', transactionError);
                throw new Error(`Transaction update failed: ${transactionError.message}`);
            }

            console.log('✅ Transaction updated successfully');

            if (approved) {
                // 2. Determine correct job status based on payment type
                let newJobStatus = '';
                let notificationMessage = '';

                if (payment.type === 'deposit') {
                    newJobStatus = 'deposit_paid';
                    notificationMessage = `Your 50% deposit of ₦${payment.amount} has been verified. The service provider will start your job.`;
                }
                else if (payment.type === 'intermediate') {
                    newJobStatus = 'intermediate_paid';
                    notificationMessage = `Your 30% intermediate payment of ₦${payment.amount} has been verified for materials.`;
                }
                else if (payment.type === 'final_payment') {
                    newJobStatus = 'completed';
                    notificationMessage = `Your final payment of ₦${payment.amount} has been verified. Job is now complete!`;
                }
                else {
                    newJobStatus = 'deposit_paid';
                    notificationMessage = `Your payment of ₦${payment.amount} has been verified.`;
                }

                console.log('🎯 Setting job status to:', newJobStatus, 'for payment type:', payment.type);

                // 3. Update job status ONLY
                if (payment.job_id) {
                    const jobUpdates = {
                        status: newJobStatus
                        // Only update status, no extra columns
                    };

                    const { error: jobError } = await supabase
                        .from('jobs')
                        .update(jobUpdates)
                        .eq('id', payment.job_id);

                    if (jobError) {
                        console.warn('⚠️ Job update warning:', jobError);
                        // Continue even if job update fails
                    } else {
                        console.log('✅ Job status updated to:', newJobStatus);
                    }
                }
                if (payment.type === 'deposit') {
                    newJobStatus = 'deposit_paid';
                    notificationMessage = `Your 50% deposit of ₦${payment.amount} has been verified. The service provider will start your job.`;

                    // Store the service fee amount if present
                    if (payment.platform_fee > 0) {
                        await supabase
                            .from('jobs')
                            .update({
                                customer_service_fee: payment.platform_fee,
                                service_fee_waived: false
                            })
                            .eq('id', payment.job_id);
                    }
                }
                // 4. Send notification to customer
                if (payment.user_id) {
                    const notificationData = {
                        user_id: payment.user_id,
                        title: 'Payment Verified!',
                        message: notificationMessage,
                        type: 'payment_success',
                        read: false,
                        created_at: new Date().toISOString(),
                        job_id: payment.job_id || null
                    };

                    const { error: notificationError } = await supabase
                        .from('notifications')
                        .insert(notificationData);

                    if (notificationError) {
                        console.warn('⚠️ Customer notification warning:', notificationError);
                    } else {
                        console.log('✅ Customer notification sent');
                    }
                }

                // 5. Also notify the company
                if (payment.job_id) {
                    // Get company ID from the job
                    const { data: job } = await supabase
                        .from('jobs')
                        .select('company_id')
                        .eq('id', payment.job_id)
                        .single();

                    if (job && job.company_id) {
                        // Get company user ID (company.id = profile.id)
                        const { data: companyProfile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', job.company_id)
                            .single();

                        if (companyProfile) {
                            await supabase
                                .from('notifications')
                                .insert({
                                    user_id: companyProfile.id,
                                    title: 'Customer Payment Verified!',
                                    message: `Customer payment of ₦${payment.amount} has been verified. Job status updated to "${newJobStatus.replace('_', ' ')}".`,
                                    type: 'payment_verified',
                                    read: false,
                                    created_at: new Date().toISOString(),
                                    job_id: payment.job_id
                                });
                            console.log('✅ Company notification sent');
                        }
                    }
                }
            }

            // Remove from list
            setPendingPayments(prev => prev.filter(p => p.id !== paymentId));

            alert(`✅ Payment ${approved ? 'verified' : 'rejected'} successfully!\n\nNext step: Go to "Payout Management" to create payout for the company.`);
            console.log('🎉 Payment verification completed');

        } catch (error) {
            console.error('❌ Verification error:', error);
            alert(`Error: ${error.message}`);
        }
    };
    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Payment Verification</h1>

            {pendingPayments.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No pending payments to verify</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingPayments.map(payment => (
                        <div key={payment.id} className="border rounded-lg p-4 bg-white shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-bold">Ref:</span>
                                        <code className="bg-gray-100 px-2 py-1 rounded">
                                            {payment.bank_reference}
                                        </code>
                                    </div>

                                    <p className="text-xl font-bold text-naijaGreen">
                                        ₦{payment.amount?.toLocaleString()}
                                    </p>

                                    <div className="mt-2 space-y-1">
                                        <p><span className="font-semibold">Job:</span> {payment.job?.description}</p>
                                        <p><span className="font-semibold">Customer:</span> {payment.customer?.full_name}</p>
                                        <p><span className="font-semibold">Phone: </span>
                                            {payment.customer?.phone ? payment.customer.phone : 'Not provided'}
                                        </p>
                                        <p><span className="font-semibold">Date:</span> {new Date(payment.created_at).toLocaleString()}</p>
                                    </div>

                                    {payment.proof_of_payment_url && (
                                        <a
                                            href={payment.proof_of_payment_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block mt-3 text-blue-600 hover:underline"
                                        >
                                            📎 View Proof of Payment
                                        </a>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => verifyPayment(payment.id, true)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                    >
                                        ✓ Verify
                                    </button>
                                    <button
                                        onClick={() => verifyPayment(payment.id, false)}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                    >
                                        ✗ Reject
                                    </button>
                                    <button
                                        onClick={() => {
                                            const notes = prompt('Add notes (optional):');
                                            if (notes) {
                                                // Add notes to payment
                                                supabase
                                                    .from('financial_transactions')
                                                    .update({ admin_notes: notes })
                                                    .eq('id', payment.id);
                                            }
                                        }}
                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                                    >
                                        Add Notes
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}