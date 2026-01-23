// src/components/payment/PaymentPage.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../context/SupabaseContext';
import PaymentService from '../../utils/PaymentService';

// Helper function to calculate payment with service fee - SIMPLIFIED
const calculatePaymentWithServiceFee = async (jobAmount, customerId, paymentType, jobCreatedDate) => {
    try {
        // Only apply service fee to deposit payments
        if (paymentType !== 'deposit') {
            return {
                baseAmount: jobAmount,
                serviceFee: 0,
                totalPayment: jobAmount,
                isFeeWaived: true,
                isDepositPayment: false
            };
        }

        // Check if customer is in promotion
        const promotionResult = await PaymentService.checkCustomerPromotionStatus(customerId);

        const depositAmount = jobAmount * 0.5;

        // Handle first job promotion
        if (promotionResult.isFirstJob && jobCreatedDate) {
            // Set promotion for first job
            await PaymentService.setPromotionForFirstJob(customerId, jobCreatedDate);

            return {
                baseAmount: depositAmount,
                serviceFee: 0,
                totalPayment: depositAmount,
                isFeeWaived: true,
                isDepositPayment: true,
                isFirstJob: true
            };
        }

        // Check if in promotion
        if (promotionResult.isInPromotion) {
            return {
                baseAmount: depositAmount,
                serviceFee: 0,
                totalPayment: depositAmount,
                isFeeWaived: true,
                isDepositPayment: true,
                isFirstJob: false
            };
        } else {
            // Not in promotion: add tiered service fee
            const serviceFee = PaymentService.calculateTieredServiceFee(jobAmount);
            return {
                baseAmount: depositAmount,
                serviceFee: serviceFee,
                totalPayment: depositAmount + serviceFee,
                isFeeWaived: false,
                isDepositPayment: true,
                isFirstJob: false
            };
        }
    } catch (error) {
        console.error('Error calculating payment with fee:', error);
        // Fallback to deposit without fee
        const depositAmount = jobAmount * 0.5;
        return {
            baseAmount: depositAmount,
            serviceFee: 0,
            totalPayment: depositAmount,
            isFeeWaived: true,
            isDepositPayment: true,
            isFirstJob: false
        };
    }
};

const PaymentPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reference, setReference] = useState('');
    const [paymentCalculation, setPaymentCalculation] = useState({
        baseAmount: 0,
        serviceFee: 0,
        totalPayment: 0,
        isFeeWaived: true,
        isDepositPayment: false
    });

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

    // SIMPLIFIED: Get total amount paid for a job
    const getTotalPaidAmount = (verifiedPayments) => {
        if (!verifiedPayments || !Array.isArray(verifiedPayments)) return 0;

        return verifiedPayments.reduce((total, payment) => {
            return total + (payment.amount || 0);
        }, 0);
    };

    // SIMPLIFIED: Determine payment type based on job status and payments
    const determinePaymentType = (jobData, paidAmount, hasDeposit, hasIntermediate, hasFinal) => {
        const totalAmount = jobData.quoted_price || 0;
        const balance = totalAmount - paidAmount;

        // Check job status first
        switch (jobData.status) {
            case 'price_set':
                // First payment - always deposit
                return {
                    type: 'deposit',
                    amount: totalAmount * 0.5,
                    description: '50% Deposit to start the job'
                };

            case 'work_ongoing':
                // Check for pending intermediate
                if (!hasIntermediate) {
                    return {
                        type: 'intermediate',
                        amount: totalAmount * 0.3,
                        description: '30% Materials payment'
                    };
                }
            // Fall through if already has intermediate

            case 'work_completed':
            case 'work_rectified':
                // Always final payment in these statuses
                return {
                    type: 'final_payment',
                    amount: balance,
                    description: 'Final balance payment'
                };

            case 'deposit_paid':
                // Can be intermediate or final based on payments
                if (!hasIntermediate && !hasFinal) {
                    return {
                        type: 'intermediate',
                        amount: totalAmount * 0.3,
                        description: '30% Materials payment'
                    };
                } else if (hasIntermediate && !hasFinal) {
                    return {
                        type: 'final_payment',
                        amount: totalAmount * 0.2,
                        description: '20% Final payment'
                    };
                }
                break;

            default:
                // Generic logic based on payments
                if (!hasDeposit && !hasIntermediate && !hasFinal) {
                    return {
                        type: 'deposit',
                        amount: totalAmount * 0.5,
                        description: '50% Deposit to start the job'
                    };
                } else if (hasDeposit && !hasIntermediate && !hasFinal) {
                    return {
                        type: 'intermediate',
                        amount: totalAmount * 0.3,
                        description: '30% Materials payment'
                    };
                } else if (hasDeposit && hasIntermediate && !hasFinal) {
                    return {
                        type: 'final_payment',
                        amount: totalAmount * 0.2,
                        description: '20% Final payment'
                    };
                }
        }

        // Default fallback
        return {
            type: 'final_payment',
            amount: balance,
            description: 'Balance payment'
        };
    };

    const fetchJobDetails = async () => {
        try {
            setLoading(true);

            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Please login to proceed with payment');

            // 2. Fetch job
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;
            if (!jobData) throw new Error('Job not found');

            console.log('📋 Job status:', jobData.status);

            // 3. Fetch company
            let companyName = 'Service Provider';
            if (jobData.company_id) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('company_name')
                    .eq('id', jobData.company_id)
                    .single();
                if (company) companyName = company.company_name;
            }

            // 4. Get total amount
            const totalAmount = jobData.quoted_price || 0;

            // 5. Get all verified payments for this job
            const { data: verifiedPayments } = await supabase
                .from('financial_transactions')
                .select('type, amount, status, verified_by_admin')
                .eq('job_id', jobId)
                .eq('status', 'completed')
                .eq('verified_by_admin', true);

            console.log('✅ Verified payments:', verifiedPayments);

            // 6. Calculate what's been paid
            const paidAmount = getTotalPaidAmount(verifiedPayments);

            // Track which payment types have been made
            const hasDeposit = verifiedPayments?.some(p => p.type === 'deposit') || false;
            const hasIntermediate = verifiedPayments?.some(p => p.type === 'intermediate') || false;
            const hasFinal = verifiedPayments?.some(p => p.type === 'final_payment') || false;

            console.log('💰 Payment analysis:', {
                totalAmount,
                paidAmount,
                hasDeposit,
                hasIntermediate,
                hasFinal,
                balance: totalAmount - paidAmount
            });

            // 7. DETERMINE PAYMENT TYPE - SIMPLIFIED
            const paymentDetails = determinePaymentType(
                jobData,
                paidAmount,
                hasDeposit,
                hasIntermediate,
                hasFinal
            );

            // 8. Calculate payment with service fee if it's a deposit
            let paymentCalculationResult;
            if (paymentDetails.type === 'deposit') {
                paymentCalculationResult = await calculatePaymentWithServiceFee(
                    totalAmount,
                    user.id,
                    'deposit',
                    jobData.created_at
                );
            } else {
                paymentCalculationResult = {
                    baseAmount: paymentDetails.amount,
                    serviceFee: 0,
                    totalPayment: paymentDetails.amount,
                    isFeeWaived: true,
                    isDepositPayment: false
                };
            }

            // 9. Generate reference
            const ref = generateReference(jobId);

            // 10. Set payment calculation state
            setPaymentCalculation(paymentCalculationResult);

            // 11. Set job data
            const jobWithDetails = {
                ...jobData,
                companyName: companyName,
                totalAmount: totalAmount,
                paymentAmount: paymentCalculationResult.totalPayment,
                paymentDescription: paymentDetails.description,
                paymentType: paymentDetails.type,
                reference: ref,
                paidAmount: paidAmount,
                balance: totalAmount - paidAmount,
                serviceFee: paymentCalculationResult.serviceFee || 0,
                isServiceFeeWaived: paymentCalculationResult.isFeeWaived || true,
                baseAmount: paymentCalculationResult.baseAmount || paymentDetails.amount,
                hasDeposit,
                hasIntermediate,
                hasFinal
            };

            console.log('🎯 Final payment details:', {
                paymentType: paymentDetails.type,
                amount: paymentDetails.amount,
                baseAmount: paymentCalculationResult.baseAmount,
                serviceFee: paymentCalculationResult.serviceFee,
                isFeeWaived: paymentCalculationResult.isFeeWaived,
                totalPayment: paymentCalculationResult.totalPayment
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

            // Check for existing pending payment record
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

            // Prepare payment data with service fee
            const paymentData = {
                job_id: jobId,
                user_id: user.id,
                type: dbPaymentType,
                amount: job.paymentAmount,
                platform_fee: job.serviceFee || 0,
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
                    base_amount: job.baseAmount,
                    service_fee: job.serviceFee,
                    is_service_fee_waived: job.isServiceFeeWaived,
                    is_deposit_payment: dbPaymentType === 'deposit',
                    calculated_correctly: true
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
                        id: transactionId
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
                baseAmount: job.baseAmount,
                serviceFee: job.serviceFee,
                paymentType: job.paymentType,
                transactionId
            });

            // Navigate to bank transfer details page
            navigate(`/payment/bank-transfer/${jobId}`, {
                state: {
                    reference: reference,
                    amount: job.paymentAmount,
                    baseAmount: job.baseAmount,
                    serviceFee: job.serviceFee,
                    totalAmount: job.totalAmount,
                    paymentType: job.paymentType,
                    transactionId: transactionId,
                    isUpdate: !!existingPayment,
                    isServiceFeeWaived: job.isServiceFeeWaived,
                    paymentDescription: job.paymentDescription
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
    const serviceFee = job.serviceFee || 0;
    const baseAmount = job.baseAmount || paymentAmount;
    const isServiceFeeWaived = job.isServiceFeeWaived;

    // Calculate percentage for display
    const getPaymentPercentage = () => {
        if (job.paymentType === 'deposit') return '50%';
        if (job.paymentType === 'intermediate') return '30%';
        if (job.paymentType === 'final_payment') {
            if (job.hasIntermediate) return '20%';
            return '50%';
        }
        return '';
    };

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
                                <span className="font-medium capitalize">{job.paymentType} Payment ({getPaymentPercentage()})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Job Status</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${job.status === 'price_set' ? 'bg-blue-100 text-blue-800' :
                                    job.status === 'deposit_paid' ? 'bg-green-100 text-green-800' :
                                        job.status === 'work_rectified' ? 'bg-yellow-100 text-yellow-800' :
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

                        {/* Payment Breakdown */}
                        <div className="pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-800 mb-3">Payment Breakdown</h4>
                            <div className="space-y-2">
                                {job.paymentType === 'deposit' ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">50% Deposit</span>
                                            <span>₦{baseAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Service Fee</span>
                                            <span className={serviceFee > 0 ? "text-blue-600" : "text-gray-500"}>
                                                {serviceFee > 0 ? "+ ₦" : "₦"}{serviceFee.toLocaleString()}
                                                {serviceFee === 0 && " (Waived)"}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{getPaymentPercentage()} Payment</span>
                                        <span>₦{baseAmount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold">Amount to Pay</span>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-naijaGreen">
                                        ₦{paymentAmount.toLocaleString()}
                                    </div>
                                    {job.paymentType === 'deposit' && serviceFee > 0 && (
                                        <div className="text-sm text-gray-500 mt-1">
                                            (Deposit: ₦{baseAmount.toLocaleString()} + Fee: ₦{serviceFee.toLocaleString()})
                                        </div>
                                    )}
                                    {job.paymentType === 'deposit' && serviceFee === 0 && (
                                        <div className="text-sm text-green-600 mt-1">
                                            ✓ Service fee waived
                                        </div>
                                    )}
                                </div>
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
                            <li>Admin verifies within 5-15 minutes</li>
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
                                {job.paymentType === 'deposit' && !isServiceFeeWaived && (
                                    <span className="block mt-1">
                                        Service fee is charged only on deposit payments and is non-refundable.
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;