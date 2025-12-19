// src/components/payment/PaymentPage.jsx - CORRECTED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../context/SupabaseContext';

const PaymentPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reference, setReference] = useState('');

    const generateReference = (jobId) => {
        const prefix = 'MT';
        const date = new Date();
        const dateStr = date.getTime().toString().slice(-6);
        const random = Math.floor(1000 + Math.random() * 9000);
        const ref = `${prefix}${jobId.slice(0, 4)}${dateStr}${random}`;
        setReference(ref);
        return ref;
    };

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);

            // 1. Fetch job
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;
            if (!jobData) throw new Error('Job not found');

            console.log('📋 Job status:', jobData.status);

            // 2. Fetch company
            let companyName = 'Service Provider';
            if (jobData.company_id) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('company_name')
                    .eq('id', jobData.company_id)
                    .single();
                if (company) companyName = company.company_name;
            }

            // 3. Get total amount
            const totalAmount = jobData.quoted_price || 0;

            // 4. Get all verified payments for this job
            const { data: verifiedPayments } = await supabase
                .from('financial_transactions')
                .select('type, amount')
                .eq('job_id', jobId)
                .eq('status', 'completed')
                .eq('verified_by_admin', true);

            console.log('✅ Verified payments:', verifiedPayments);

            // 5. Calculate what's been paid
            let paidAmount = 0;
            let hasDeposit = false;
            let hasIntermediate = false;
            let hasFinal = false;

            if (verifiedPayments) {
                verifiedPayments.forEach(payment => {
                    paidAmount += payment.amount || 0;
                    if (payment.type === 'deposit') hasDeposit = true;
                    if (payment.type === 'intermediate') hasIntermediate = true;
                    if (payment.type === 'final_payment') hasFinal = true;
                });
            }

            const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
            const balance = totalAmount - paidAmount;

            console.log('💰 Payment analysis:', {
                totalAmount,
                paidAmount,
                paidPercentage: paidPercentage + '%',
                balance,
                hasDeposit,
                hasIntermediate,
                hasFinal
            });

            // 6. DETERMINE PAYMENT TYPE - SIMPLE CORRECT LOGIC
            // 6. DETERMINE PAYMENT TYPE - FIXED LOGIC
            let paymentType = '';
            let paymentAmount = 0;
            let paymentDescription = '';

            // First, check for pending intermediate payments (for work_ongoing status)
            if (jobData.status === 'work_ongoing') {
                console.log('🔄 Job is work_ongoing, checking for pending intermediate...');

                const { data: pendingIntermediate, error: pendingError } = await supabase
                    .from('financial_transactions')
                    .select('type, status, amount')
                    .eq('job_id', jobId)
                    .eq('type', 'intermediate')
                    .eq('status', 'pending')
                    .eq('verified_by_admin', false)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (!pendingError && pendingIntermediate && pendingIntermediate.length > 0) {
                    console.log('💰 Found pending intermediate payment:', pendingIntermediate[0]);
                    paymentType = 'intermediate';
                    paymentAmount = pendingIntermediate[0].amount || totalAmount * 0.3;
                    paymentDescription = '30% Intermediate payment for materials';
                } else {
                    // No pending intermediate, check what's been paid
                    if (hasDeposit && !hasIntermediate && !hasFinal) {
                        paymentType = 'intermediate';
                        paymentAmount = totalAmount * 0.3;
                        paymentDescription = '30% Intermediate payment for materials';
                    } else if (hasDeposit && hasIntermediate && !hasFinal) {
                        paymentType = 'final_payment';
                        paymentAmount = totalAmount * 0.2;
                        paymentDescription = 'Final payment (20% balance)';
                    }
                }
            }
            // SPECIAL SCENARIO: Job is work_rectified - Always calculate based on actual payments
            else if (jobData.status === 'work_rectified') {
                console.log('🔄 Job is work_rectified. Calculating balance based on actual payments...');

                // Calculate total paid
                let totalPaid = 0;
                if (verifiedPayments) {
                    verifiedPayments.forEach(payment => {
                        totalPaid += payment.amount || 0;
                    });
                }

                const balance = totalAmount - totalPaid;

                // Determine what type of payment this is
                if (hasDeposit && hasIntermediate && !hasFinal) {
                    paymentType = 'final_payment';
                    paymentAmount = balance;
                    paymentDescription = `Final payment (${((balance / totalAmount) * 100).toFixed(0)}% balance)`;
                } else if (hasDeposit && !hasIntermediate && !hasFinal) {
                    paymentType = 'final_payment';
                    paymentAmount = balance;
                    paymentDescription = `Final payment (${((balance / totalAmount) * 100).toFixed(0)}% balance)`;
                } else {
                    paymentType = 'final_payment';
                    paymentAmount = balance;
                    paymentDescription = `Balance payment (₦${balance.toLocaleString()})`;
                }

                console.log('💰 work_rectified calculation:', {
                    totalAmount,
                    totalPaid,
                    balance,
                    paymentAmount,
                    depositCount: hasDeposit,
                    intermediateCount: hasIntermediate,
                    finalCount: hasFinal
                });
            }
            // SCENARIO 1: No payments made yet
            else if (!hasDeposit && !hasIntermediate && !hasFinal) {
                paymentType = 'deposit';
                paymentAmount = totalAmount * 0.5;
                paymentDescription = '50% Deposit to start the job';
            }
            // SCENARIO 2: Only deposit paid (50%), no intermediate
            else if (hasDeposit && !hasIntermediate && !hasFinal) {
                // Check job status - if work is completed, it should be FINAL payment
                if (jobData.status === 'work_completed' || jobData.status === 'work_rectified') {
                    paymentType = 'final_payment';
                    paymentAmount = totalAmount * 0.5;
                    paymentDescription = 'Final payment (50% balance)';
                } else {
                    // For ongoing work, show intermediate payment option
                    paymentType = 'intermediate';
                    paymentAmount = totalAmount * 0.3;
                    paymentDescription = '30% Intermediate payment for materials';
                }
            }
            // SCENARIO 3: Deposit (50%) + Intermediate (30%) paid, need final 20%
            else if (hasDeposit && hasIntermediate && !hasFinal) {
                paymentType = 'final_payment';
                paymentAmount = totalAmount * 0.2;
                paymentDescription = 'Final payment (20% balance)';
            }
            // SCENARIO 4: All payments made
            else if (hasDeposit && hasIntermediate && hasFinal) {
                throw new Error('All payments for this job have been completed.');
            }
            // SCENARIO 5: Edge cases
            else {
                // Calculate based on actual paid amount
                if (paidPercentage >= 80) {
                    // Paid 80%+, need final 20%
                    paymentType = 'final_payment';
                    paymentAmount = totalAmount * 0.2;
                    paymentDescription = 'Final payment (20% balance)';
                } else if (paidPercentage >= 50) {
                    // Paid 50%+, need either intermediate or final
                    paymentType = 'final_payment';
                    paymentAmount = balance;
                    paymentDescription = `Balance payment (₦${balance.toLocaleString()})`;
                } else {
                    // Paid less than 50%
                    paymentType = 'deposit';
                    paymentAmount = totalAmount * 0.5;
                    paymentDescription = '50% Deposit to start the job';
                }
            }

            // 7. Generate reference
            const ref = generateReference(jobId);

            // 8. Set job data
            const jobWithDetails = {
                ...jobData,
                companyName: companyName,
                totalAmount: totalAmount,
                paymentAmount: paymentAmount,
                paymentDescription: paymentDescription,
                paymentType: paymentType,
                reference: ref,
                paidAmount: paidAmount,
                balance: balance
            };

            console.log('🎯 Final payment details:', {
                type: paymentType,
                amount: paymentAmount,
                description: paymentDescription,
                shouldBe20Percent: paymentAmount === totalAmount * 0.2
            });

            setJob(jobWithDetails);

        } catch (error) {
            console.error('❌ Error fetching job:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    const initiateBankTransfer = async () => {
        if (!job) return;

        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error('User not found. Please login again.');

            console.log('💳 Processing payment for user:', user.id);

            // Convert paymentType to valid database value
            let dbPaymentType = job.paymentType;
            if (job.paymentType === 'final') {
                dbPaymentType = 'final_payment';
            }

            // Validate type is allowed
            const allowedTypes = ['deposit', 'intermediate', 'final_payment', 'service_fee', 'commission', 'payout', 'refund', 'disbursement'];
            if (!allowedTypes.includes(dbPaymentType)) {
                throw new Error(`Invalid payment type: ${dbPaymentType}. Must be one of: ${allowedTypes.join(', ')}`);
            }

            // CRITICAL: Check for existing pending payment record FIRST
            console.log('🔍 Checking for existing payment records...');
            const { data: existingPayments, error: checkError } = await supabase
                .from('financial_transactions')
                .select('id, status, proof_of_payment_url, verified_by_admin, amount')
                .eq('job_id', jobId)
                .eq('type', dbPaymentType)
                .eq('status', 'pending')
                .eq('verified_by_admin', false)
                .order('created_at', { ascending: false });

            if (checkError) throw checkError;

            console.log('📋 Existing payments found:', existingPayments);

            let transactionId;
            let existingPayment = null;

            // Check if we should use an existing payment
            if (existingPayments && existingPayments.length > 0) {
                // Find the most suitable existing payment
                existingPayment = existingPayments.find(p => !p.proof_of_payment_url) || existingPayments[0];

                console.log('🎯 Selected existing payment:', existingPayment);

                // Validate the existing payment
                if (existingPayment.status === 'completed') {
                    throw new Error('Payment for this job has already been completed.');
                }

                if (existingPayment.proof_of_payment_url) {
                    throw new Error('Payment proof already uploaded. Please wait for admin verification.');
                }

                if (Math.abs(existingPayment.amount - job.paymentAmount) > 1) {
                    console.warn(`⚠️ Amount mismatch: Existing ${existingPayment.amount} vs New ${job.paymentAmount}`);
                    // Option: Update amount or create new? Let's update for consistency
                }

                transactionId = existingPayment.id;
                console.log('🔄 Using existing payment record ID:', transactionId);
            }

            // Prepare payment data
            const paymentData = {
                job_id: jobId,
                user_id: user.id,
                type: dbPaymentType,
                amount: job.paymentAmount,
                platform_fee: dbPaymentType === 'final_payment' ? job.paymentAmount * 0.05 : 0, // 5% fee only on final
                description: `${job.paymentType} payment for: ${job.description || `Job #${jobId.substring(0, 8)}`}`,
                reference: reference,
                status: 'pending',
                payment_method: 'bank_transfer',
                bank_reference: reference,
                verified_by_admin: false,
                proof_of_payment_url: null,
                admin_notes: null,
                metadata: {
                    job_description: job.description,
                    company_name: job.companyName,
                    customer_id: user.id,
                    created_via: 'customer_payment_page',
                    job_status: job.status,
                    total_job_amount: job.totalAmount,
                    calculated_correctly: job.paymentAmount === job.totalAmount * (dbPaymentType === 'deposit' ? 0.5 : dbPaymentType === 'intermediate' ? 0.3 : 0.2)
                },
                created_at: new Date().toISOString()
            };

            let finalTransactionData;

            if (transactionId) {
                // UPDATE existing payment record
                console.log('📝 Updating existing payment record:', transactionId);

                const { data: updateData, error: updateError } = await supabase
                    .from('financial_transactions')
                    .update({
                        ...paymentData,
                        id: transactionId // Keep same ID
                    })
                    .eq('id', transactionId)
                    .select()
                    .single();

                if (updateError) {
                    console.error('❌ Update failed:', updateError);
                    throw new Error(`Failed to update payment: ${updateError.message}`);
                }

                finalTransactionData = updateData;
                console.log('✅ Payment record updated:', finalTransactionData);
            } else {
                // CREATE new payment record
                console.log('🆕 Creating new payment record');

                const { data: insertData, error: insertError } = await supabase
                    .from('financial_transactions')
                    .insert(paymentData)
                    .select()
                    .single();

                if (insertError) {
                    console.error('❌ Insert failed:', insertError);
                    throw new Error(`Failed to create payment: ${insertError.message}`);
                }

                finalTransactionData = insertData;
                transactionId = insertData.id;
                console.log('✅ New payment record created:', finalTransactionData);
            }

            // Clean up any other duplicate pending payments
            if (existingPayments && existingPayments.length > 1) {
                console.log('🧹 Cleaning up duplicate payments...');
                const duplicateIds = existingPayments
                    .filter(p => p.id !== transactionId)
                    .map(p => p.id);

                if (duplicateIds.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('financial_transactions')
                        .delete()
                        .in('id', duplicateIds);

                    if (deleteError) {
                        console.warn('⚠️ Could not delete duplicates:', deleteError);
                    } else {
                        console.log(`✅ Deleted ${duplicateIds.length} duplicate payments`);
                    }
                }
            }

            console.log('🎯 Navigation details:', {
                reference,
                amount: job.paymentAmount,
                paymentType: job.paymentType,
                transactionId
            });

            // Navigate to bank transfer details page
            navigate(`/payment/bank-transfer/${jobId}`, {
                state: {
                    reference: reference,
                    amount: job.paymentAmount,
                    totalAmount: job.totalAmount,
                    paymentType: job.paymentType,
                    transactionId: transactionId,
                    isUpdate: !!existingPayment // Flag if this was an update
                }
            });

        } catch (error) {
            console.error('❌ Payment processing failed:', error);

            let errorMessage = 'Error processing payment. ';

            if (error.message.includes('already been completed')) {
                errorMessage = 'This payment has already been completed. Please check your job status.';
            } else if (error.message.includes('proof already uploaded')) {
                errorMessage = 'Payment proof already uploaded. Please wait for admin verification (2-4 hours).';
            } else if (error.message.includes('row-level security')) {
                errorMessage = 'Database permission error. Please contact support.';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-md mx-auto mt-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-red-800 mb-2">Unable to Process Payment</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-md mx-auto mt-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200">
                        <p className="text-center text-gray-600">Job not found</p>
                    </div>
                </div>
            </div>
        );
    }

    // Get values from job object
    const totalAmount = job.totalAmount || 0;
    const paymentAmount = job.paymentAmount || 0;
    const paymentDescription = job.paymentDescription || '';
    const companyName = job.companyName || 'Service Provider';

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back
                    </button>

                    <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
                    <p className="text-gray-600">Job #{job.id.substring(0, 8)}</p>
                </div>

                {/* Payment Summary */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-6">Payment Summary</h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b">
                            <div>
                                <p className="font-medium text-gray-900">{job?.description || 'Job Details'}</p>
                                <p className="text-sm text-gray-600">with {companyName}</p>
                            </div>
                            <span className="text-lg font-bold">₦{totalAmount.toLocaleString()}</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Payment Type</span>
                                <span className="font-medium capitalize">{job.paymentType} Payment</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Job Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${job.status === 'price_set' ? 'bg-blue-100 text-blue-800' :
                                    job.status === 'deposit_paid' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {job.status?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Description</span>
                                <span className="font-medium text-right">{paymentDescription}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Amount to Pay</span>
                                <span className="text-3xl font-bold text-naijaGreen">
                                    ₦{paymentAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Method - Only Bank Transfer */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Payment Method</h2>

                    <div className="border-2 border-naijaGreen rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-green-600 text-xl">🏦</span>
                                </div>
                                <div>
                                    <h3 className="font-bold">Bank Transfer</h3>
                                    <p className="text-sm text-gray-600">Pay directly to our bank account</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full border-2 border-naijaGreen flex items-center justify-center">
                                <div className="w-3 h-3 bg-naijaGreen rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
                        <ol className="list-decimal pl-5 space-y-2 text-sm text-blue-700">
                            <li>You'll see our bank account details</li>
                            <li>Transfer the exact amount shown above</li>
                            <li>Use the unique reference code provided</li>
                            <li>Upload proof of payment</li>
                            <li>Admin verifies within 2-4 hours</li>
                            <li>Job status updates automatically</li>
                        </ol>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={initiateBankTransfer}
                    disabled={!reference}
                    className="w-full bg-naijaGreen text-white py-4 rounded-xl font-bold text-lg hover:bg-darkGreen disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {reference ? 'Proceed to Bank Transfer' : 'Loading...'}
                </button>

                {/* Important Notice */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="text-yellow-600 text-xl">⚠️</span>
                        <div>
                            <h4 className="font-medium text-yellow-800">Important Notice</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                Payments are held in escrow until job completion. Your money is protected.
                                Service providers only receive payment when you confirm job completion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;