// src/components/company/JobsSection.jsx — MOBILE-OPTIMIZED VERSION
import React from 'react'
import { useState, useEffect } from 'react'
import QuoteForm from './QuoteForm'
import { useMessaging } from '../../context/MessagingContext.jsx';
import ChatModal from '../chat/ChatModal';

// Add this component at the top, after imports
const CustomerVerificationBadge = ({ verificationLevel, idType }) => {
    const getBadgeDetails = () => {
        switch (verificationLevel) {
            case 'verified':
                return {
                    icon: '✅',
                    text: 'Verified Customer',
                    color: '#10B981',
                    bgColor: '#D1FAE5',
                    tooltip: idType ? `Verified with ${idType}` : 'Verified customer'
                };
            case 'pending':
                return {
                    icon: '⏳',
                    text: 'Verification Pending',
                    color: '#F59E0B',
                    bgColor: '#FEF3C7',
                    tooltip: 'Verification under review'
                };
            default: // 'basic'
                return {
                    icon: '🔒',
                    text: 'Basic Account',
                    color: '#6B7280',
                    bgColor: '#F3F4F6',
                    tooltip: 'Not verified - basic account'
                };
        }
    };

    const badge = getBadgeDetails();

    return (
        <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: badge.bgColor, color: badge.color }}
            title={badge.tooltip}
        >
            <span>{badge.icon}</span>
            <span>{badge.text}</span>
        </span>
    );
};

export default function JobsSection({
    showJobs,
    setShowJobs,
    user,
    supabase
}) {
    const [jobs, setJobs] = useState([])
    const [jobsLoading, setJobsLoading] = useState(false)
    const [jobToQuote, setJobToQuote] = useState(null)
    const [showOnsiteModal, setShowOnsiteModal] = useState(false)
    const [selectedJobForOnsite, setSelectedJobForOnsite] = useState(null)
    const [showDeclineModal, setShowDeclineModal] = useState(false)
    const [showChat, setShowChat] = useState(false);
    const { createConversation, setActiveConversation } = useMessaging();
    const [selectedJobToDecline, setSelectedJobToDecline] = useState(null)

    const loadJobs = async () => {
        setJobsLoading(true)
        try {
            // Get jobs where company_id matches AND status is NOT declined_by_company
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .eq('company_id', user.id)
                .neq('status', 'declined_by_company')
                .order('created_at', { ascending: false })

            if (jobsError) throw jobsError

            if (!jobsData || jobsData.length === 0) {
                setJobs([])
                setJobsLoading(false)
                return
            }

            // Get ALL financial transactions for these jobs
            const jobIds = jobsData.map(job => job.id);
            const { data: allPayments, error: paymentsError } = await supabase
                .from('financial_transactions')
                .select('job_id, type, status, verified_by_admin, amount')
                .in('job_id', jobIds)
                .order('created_at', { ascending: false });

            if (paymentsError) {
                console.warn('Could not fetch payments:', paymentsError);
            }

            // Create a map to track payments per job
            const paymentMap = {};
            if (allPayments) {
                allPayments.forEach(payment => {
                    if (!paymentMap[payment.job_id]) {
                        paymentMap[payment.job_id] = {
                            hasDeposit: false,
                            hasIntermediate: false,
                            hasFinal: false,
                            depositAmount: 0,
                            intermediateAmount: 0,
                            finalAmount: 0
                        };
                    }

                    // Only count verified payments
                    if (payment.verified_by_admin && payment.status === 'completed') {
                        if (payment.type === 'deposit') {
                            paymentMap[payment.job_id].hasDeposit = true;
                            paymentMap[payment.job_id].depositAmount = payment.amount || 0;
                        } else if (payment.type === 'intermediate') {
                            paymentMap[payment.job_id].hasIntermediate = true;
                            paymentMap[payment.job_id].intermediateAmount = payment.amount || 0;
                        } else if (payment.type === 'final_payment') {
                            paymentMap[payment.job_id].hasFinal = true;
                            paymentMap[payment.job_id].finalAmount = payment.amount || 0;
                        }
                    }
                });
            }

            const jobsWithDetails = await Promise.all(
                jobsData.map(async (job) => {
                    let customerDetails = null

                    try {
                        const { data: customer } = await supabase
                            .from('customers')
                            .select('customer_name, phone, email, verification_level, id_verified_at, id_type')
                            .eq('id', job.customer_id)
                            .single();

                        customerDetails = customer
                    } catch (error) {
                        console.warn(`Could not fetch customer ${job.customer_id}:`, error)

                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, phone')
                            .eq('id', job.customer_id)
                            .single()

                        if (profile) {
                            customerDetails = {
                                customer_name: profile.full_name,
                                phone: profile.phone,
                                email: job.customer_id
                            }
                        }
                    }

                    return {
                        ...job,
                        customer: customerDetails || {
                            customer_name: 'Unknown Customer',
                            phone: 'N/A',
                            email: 'N/A'
                        },
                        paymentData: paymentMap[job.id] || {
                            hasDeposit: false,
                            hasIntermediate: false,
                            hasFinal: false,
                            depositAmount: 0,
                            intermediateAmount: 0,
                            finalAmount: 0
                        }
                    }
                })
            )

            setJobs(jobsWithDetails)
        } catch (error) {
            console.error('Error loading jobs:', error)
            alert('Failed to load jobs. Please refresh the page.')
        } finally {
            setJobsLoading(false)
        }
    }

    const markWorkAsCompleted = async (jobId) => {
        console.log('🔄 markWorkAsCompleted called for job:', jobId);

        if (!window.confirm('Mark this job as completed? This will notify the customer to review the work.')) return

        try {
            console.log('📝 Updating job status to work_completed...');

            // Update job status
            const { data: updateData, error } = await supabase
                .from('jobs')
                .update({
                    status: 'work_completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)
                .select()

            console.log('📤 Update response:', { updateData, error });

            if (error) {
                console.error('❌ Update error details:', error);
                throw error;
            }

            console.log('✅ Job status updated. Fetching job details...');

            // Get job details for notification
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('customer_id, category, company_id')
                .eq('id', jobId)
                .single()

            console.log('📋 Job fetch result:', { job, jobError });

            if (jobError) {
                console.error('❌ Job fetch error:', jobError);
                throw jobError;
            }

            if (!job) {
                throw new Error('Job not found after update');
            }

            console.log('📧 Creating notification for customer:', job.customer_id);

            // Notify customer
            const { data: notificationData, error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    user_id: job.customer_id,
                    job_id: jobId,
                    type: 'work_completed',
                    title: 'Work Completed',
                    message: `Company has marked your ${job.category} job as completed. Please review and approve to release final payment.`,
                    read: false,
                    created_at: new Date().toISOString()
                })
                .select()

            console.log('📨 Notification insert result:', { notificationData, notificationError });

            if (notificationError) {
                console.error('❌ Notification error:', notificationError);
                throw notificationError;
            }

            alert('✅ Job marked as completed! Customer has been notified to review.');
            console.log('🔄 Reloading jobs...');
            loadJobs()

        } catch (error) {
            console.error('💥 Error marking work as completed:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            alert(`❌ Failed to mark job as completed. Error: ${error.message || 'Unknown error'}`);
        }
    }

    const requestIntermediatePayment = async (jobId) => {
        console.log('🔄 requestIntermediatePayment called for job:', jobId);

        // Find the job
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            alert('Job not found');
            return;
        }

        const intermediateAmount = Math.round(job.quoted_price * 0.30);

        if (!window.confirm(
            `Request 30% intermediate payment for materials?\n\n` +
            `This will:\n` +
            `1. Request ₦${intermediateAmount.toLocaleString()} from customer\n` +
            `2. Notify customer to make payment\n` +
            `3. Allow you to purchase materials\n\n` +
            `Customer will pay 30% now and 20% upon completion (instead of 50% later).`
        )) return;

        try {
            console.log('📝 Creating intermediate payment request...');

            // 1. Create a financial transaction record for the intermediate payment
            const paymentData = {
                job_id: jobId,
                user_id: job.customer_id,
                type: 'intermediate',
                amount: intermediateAmount,
                platform_fee: 0,
                description: '30% intermediate payment for materials',
                reference: `INT-${jobId.substring(0, 8)}-${Date.now()}`,
                status: 'pending',
                payment_method: 'bank_transfer',
                bank_reference: `INT-${jobId.substring(0, 8)}-${Date.now()}`,
                verified_by_admin: false,
                proof_of_payment_url: null,
                admin_notes: null,
                metadata: {
                    requested_by_company: user.id,
                    company_name: 'Your Company',
                    for_materials: true,
                    requested_at: new Date().toISOString()
                },
                created_at: new Date().toISOString()
            };

            console.log('📦 Creating intermediate payment record:', paymentData);

            // 2. Insert the payment record
            const { data: transaction, error: transactionError } = await supabase
                .from('financial_transactions')
                .insert(paymentData)
                .select()
                .single();

            if (transactionError) {
                console.error('❌ Transaction creation error:', transactionError);
                throw transactionError;
            }

            console.log('✅ Intermediate payment record created:', transaction);

            // 3. Update job status to indicate intermediate payment was requested
            const { error: jobUpdateError } = await supabase
                .from('jobs')
                .update({
                    status: 'work_ongoing',
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (jobUpdateError) {
                console.error('❌ Job update error:', jobUpdateError);
                throw jobUpdateError;
            }

            console.log('✅ Job status updated to work_ongoing');

            // 4. Send notification to customer
            const notificationData = {
                user_id: job.customer_id,
                job_id: jobId,
                type: 'intermediate_payment_requested',
                title: 'Intermediate Payment Requested',
                message: `Company has requested a 30% intermediate payment (₦${intermediateAmount.toLocaleString()}) for materials. Please make payment to continue.`,
                read: false,
                created_at: new Date().toISOString()
            };

            const { error: notificationError } = await supabase
                .from('notifications')
                .insert(notificationData);

            if (notificationError) {
                console.warn('⚠️ Notification error:', notificationError);
            } else {
                console.log('✅ Customer notified');
            }

            alert(`✅ Intermediate payment request sent to customer!\n\nAmount: ₦${intermediateAmount.toLocaleString()}\n\nCustomer has been notified to make payment.`);

            console.log('🔄 Reloading jobs...');
            loadJobs();

        } catch (error) {
            console.error('💥 Error requesting intermediate payment:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            alert(`❌ Failed to request intermediate payment. Error: ${error.message || 'Unknown error'}`);
        }
    };

    useEffect(() => {
        if (!showJobs || !user || !supabase) return

        loadJobs()

        const channel = supabase
            .channel('jobs-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'jobs',
                filter: `company_id=eq.${user.id}`
            }, () => loadJobs())
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [showJobs, supabase, user])

    const handleRequestOnsiteCheck = async (jobId) => {
        try {
            console.log('DEBUG: Fetching company for user:', user.id);

            // Get company data - companies.id should match user.id
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('id, company_name, bank_name, bank_account, email') // Use bank_account, not account_number
                .eq('id', user.id)
                .single();

            console.log('Company data:', { companyData, companyError, userId: user.id });

            if (companyError) {
                console.error('Company fetch error:', companyError);
                alert('Company profile not found. Please complete your company registration first.');
                return;
            }

            if (!companyData) {
                alert('Company profile not found. Please complete your company registration first.');
                return;
            }

            // Check if bank details exist
            if (!companyData.bank_name || !companyData.bank_account) {
                alert('Please update your bank details in your company profile before requesting onsite check.');
                return;
            }

            // Ask for the onsite fee amount
            const feeInput = prompt(
                `Enter the onsite check fee amount (in Naira):\n\n` +
                `This fee covers transportation and serves as commitment from the customer.\n\n` +
                `Your bank details:\n` +
                `Bank: ${companyData.bank_name}\n` +
                `Account: ${companyData.bank_account}\n` +
                `Name: ${companyData.company_name} (company name)\n\n` +
                `Enter amount (e.g., 5000):`
            );

            if (!feeInput) return;

            const onsiteFee = parseFloat(feeInput);
            if (isNaN(onsiteFee) || onsiteFee <= 0) {
                alert('Please enter a valid amount.');
                return;
            }

            if (!window.confirm(
                `Request onsite check with fee of ₦${onsiteFee.toLocaleString()}?\n\n` +
                `Customer will need to pay this amount directly to your bank account before you visit.`
            )) {
                return;
            }

            // Update job with onsite fee details
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'onsite_fee_requested',
                    onsite_fee_requested: true,
                    onsite_fee_amount: onsiteFee,
                    onsite_fee_bank_details: JSON.stringify({
                        bank_name: companyData.bank_name,
                        account_number: companyData.bank_account, // Using bank_account
                        account_name: companyData.company_name, // Using company_name as account name
                        company_name: companyData.company_name
                    }),
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (updateError) {
                console.error('Job update error:', updateError);
                throw updateError;
            }

            console.log('=== DEBUG: Creating onsite fee notification ===');
            console.log('Job ID:', jobId);
            console.log('Onsite Fee:', onsiteFee);

            const { data: job } = await supabase
                .from('jobs')
                .select('customer_id, category')
                .eq('id', jobId)
                .single();

            console.log('Customer ID from job:', job?.customer_id);

            // Create notification for customer
            if (job?.customer_id) {
                await supabase.from('notifications').insert({
                    user_id: job.customer_id,
                    job_id: jobId,
                    type: 'onsite_fee_requested',
                    title: 'Onsite Check Fee Requested',
                    message: `${companyData.company_name} has requested an onsite check. Please pay ₦${onsiteFee.toLocaleString()} to their bank account to proceed.`,
                    read: false,
                    created_at: new Date().toISOString(),
                    metadata: {
                        fee_amount: onsiteFee,
                        bank_details: {
                            bank_name: companyData.bank_name,
                            account_number: companyData.bank_account,
                            account_name: companyData.company_name
                        }
                    }
                });
            }

            alert(`✅ Onsite check fee requested!\n\nAmount: ₦${onsiteFee.toLocaleString()}\n\nCustomer has been notified to make payment.`);
            loadJobs();

        } catch (error) {
            console.error('Failed to request onsite check with fee:', error);
            alert('Error requesting onsite check. Please try again.');
        }
    }

    // Company confirms they received the onsite fee
    const handleConfirmOnsiteFeeReceipt = async (jobId, feeAmount, customerName) => {
        if (!window.confirm(
            `Confirm that you've received ₦${Number(feeAmount).toLocaleString()} from ${customerName || 'the customer'}?\n\n` +
            `This will:\n` +
            `1. Mark payment as confirmed\n` +
            `2. Notify customer\n` +
            `3. Allow you to visit their location\n\n` +
            `Only confirm if you've verified the payment in your bank account.`
        )) return;

        try {
            // Update job status to onsite_fee_paid (company confirmed)
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'onsite_fee_paid',
                    onsite_fee_paid: true,
                    onsite_fee_paid_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (updateError) throw updateError;

            // Notify customer that payment is confirmed
            const job = jobs.find(j => j.id === jobId);
            if (job?.customer_id) {
                await supabase.from('notifications').insert({
                    user_id: job.customer_id,
                    job_id: jobId,
                    type: 'onsite_fee_confirmed',
                    title: 'Onsite Fee Confirmed ✅',
                    message: `Company has confirmed receipt of your ₦${Number(feeAmount).toLocaleString()} payment. They will visit your location soon.`,
                    read: false,
                    created_at: new Date().toISOString()
                });
            }

            alert(`✅ Payment confirmed! Customer has been notified.\n\nYou can now visit their location.`);
            loadJobs();

        } catch (error) {
            console.error('Error confirming onsite fee:', error);
            alert('Failed to confirm payment. Please try again.');
        }
    };

    // Company reports they haven't received the fee yet
    const handleReportNoOnsiteFee = async (jobId, feeAmount, customerName) => {
        const reason = prompt(
            `Report that you haven't received ₦${Number(feeAmount).toLocaleString()} yet.\n\n` +
            `Please provide details (optional):\n` +
            `• Checked account? When?\n` +
            `• Any issues with the transfer?\n` +
            `• Instructions for customer?`
        );

        try {
            // Notify customer
            const job = jobs.find(j => j.id === jobId);
            if (job?.customer_id) {
                await supabase.from('notifications').insert({
                    user_id: job.customer_id,
                    job_id: jobId,
                    type: 'onsite_fee_not_received',
                    title: 'Payment Not Yet Received',
                    message: `Company has not yet received your ₦${Number(feeAmount).toLocaleString()} payment.${reason ? `\n\nNote: ${reason.substring(0, 100)}` : ''}\n\nPlease check with your bank or try again.`,
                    read: false,
                    created_at: new Date().toISOString()
                });
            }

            alert(`Customer notified that payment hasn't been received.${reason ? `\n\nYour note: ${reason}` : ''}`);

        } catch (error) {
            console.error('Error reporting no payment:', error);
            alert('Failed to send notification. Please try again.');
        }
    };

    const createCustomerNotification = async (jobId, notificationType, companyName = '') => {
        try {
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('customer_id, category, sub_service, company_id')
                .eq('id', jobId)
                .single()

            if (!job) return

            let title = '';
            let message = '';

            switch (notificationType) {
                case 'onsite_requested':
                    title = 'Onsite Check Requested';
                    message = `${companyName || 'The company'} has requested to visit your location for assessment before providing a final quote.`;
                    break;
                case 'job_declined':
                    title = 'Job Declined';
                    message = `${companyName || 'A company'} has declined your "${job.sub_service || job.category}" job. You can post the job again to find another company if you wish.`;
                    break;
                case 'quote_received':
                    title = 'New Quote Received';
                    message = `${companyName || 'A company'} has sent you a quote for your "${job.sub_service || job.category}" job.`;
                    break;
                default:
                    title = 'Job Update';
                    message = 'There is an update on your job.';
            }

            const notificationData = {
                user_id: job.customer_id,
                job_id: jobId,
                type: notificationType,
                title: title,
                message: message,
                read: false,
                created_at: new Date().toISOString()
            }

            await supabase.from('notifications').insert(notificationData)

        } catch (error) {
            console.error('Failed to create notification:', error)
        }
    }

    const handleDeleteJob = async (jobId, e) => {
        e.stopPropagation()
        const jobToDelete = jobs.find(job => job.id === jobId)
        if (!jobToDelete) return

        // Show modal instead of immediate confirmation
        setSelectedJobToDecline(jobToDelete)
        setShowDeclineModal(true)
    }

    const OnsiteCheckModal = () => {
        if (!showOnsiteModal || !selectedJobForOnsite) return null

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-naijaGreen mb-4">Request Onsite Check with Fee</h3>

                    <p className="text-gray-700 mb-4">
                        You're about to request an onsite check for:
                        <strong className="block mt-2 text-lg">{selectedJobForOnsite.sub_service || selectedJobForOnsite.category}</strong>
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800">
                            <strong>💰 Onsite Check Fee:</strong> You'll be prompted to enter a fee amount.
                            This fee covers transportation and serves as customer commitment.
                        </p>
                        <p className="text-xs text-yellow-700 mt-2">
                            Customer will pay this fee directly to your bank account before your visit.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                                setShowOnsiteModal(false)
                                setSelectedJobForOnsite(null)
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                await handleRequestOnsiteCheck(selectedJobForOnsite.id)
                                setShowOnsiteModal(false)
                                setSelectedJobForOnsite(null)
                            }}
                            className="flex-1 bg-naijaGreen text-white py-3 rounded-lg font-bold hover:bg-darkGreen transition-colors"
                        >
                            Continue with Fee
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!showJobs) return null
    const DeclineReasonModal = () => {
        if (!showDeclineModal || !selectedJobToDecline) return null

        // Move the state INSIDE the modal component
        const [localDeclineReason, setLocalDeclineReason] = useState('')

        const handleConfirmDecline = async () => {
            if (!declineReason.trim()) {
                alert('Please provide a reason for declining this job.')
                return
            }

            const jobToDelete = selectedJobToDecline

            // Remove from local state immediately
            setJobs(prev => prev.filter(job => job.id !== jobToDelete.id))
            setShowDeclineModal(false)
            setSelectedJobToDecline(null)

            try {
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('company_name')
                    .eq('id', user.id)
                    .single()

                const companyName = companyData?.company_name || 'A company'

                console.log('Updating job with decline reason:', {
                    jobId: jobToDelete.id,
                    status: 'declined_by_company',
                    decline_reason: declineReason.trim(),
                    declined_by_company_id: user.id, // Store who declined
                    company_id: null, // Clear for reassignment
                    companyName
                });

                // Update job with decline reason, store who declined, but clear company_id for reassignment
                const { error } = await supabase
                    .from('jobs')
                    .update({
                        status: 'declined_by_company',
                        decline_reason: declineReason.trim(),
                        declined_by_company_id: user.id, // Store which company declined
                        company_id: null, // Clear for reassignment
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', jobToDelete.id)
                    .eq('company_id', user.id)

                if (error) {
                    console.error('Update error details:', error);
                    throw error;
                }

                console.log('Job declined successfully with reason');

                // Create notification for customer with the reason
                await supabase.from('notifications').insert({
                    user_id: jobToDelete.customer_id,
                    job_id: jobToDelete.id,
                    type: 'job_declined',
                    title: 'Job Declined',
                    message: `${companyName} has declined your "${jobToDelete.sub_service || jobToDelete.category}" job.\n\nReason: ${declineReason.trim()}`,
                    metadata: {
                        decline_reason: declineReason.trim(),
                        company_name: companyName,
                        declined_by_company_id: user.id
                    },
                    read: false,
                    created_at: new Date().toISOString()
                })

                alert('Job declined. The customer has been notified with your reason.')
                setDeclineReason('') // Clear the reason

            } catch (err) {
                console.error('Failed to decline job:', err)
                // Add back to local state if error
                setJobs(prev => [jobToDelete, ...prev.filter(job => job.id !== jobToDelete.id)])
                alert("Error: Failed to decline the job. Please try again. Message: " + err.message)
            }
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-red-600 mb-4">Decline Job</h3>

                    <p className="text-gray-700 mb-4">
                        You're about to decline:
                        <strong className="block mt-2 text-lg">{selectedJobToDecline.sub_service || selectedJobToDecline.category}</strong>
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for declining <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={localDeclineReason}
                            onChange={(e) => setLocalDeclineReason(e.target.value)}
                            placeholder="Please provide a reason (e.g., too far, not our specialty, etc.)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 outline-none resize-none"
                            rows={4}
                            autoFocus // This helps with mobile keyboard
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This reason will be shown to the customer.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                                setShowDeclineModal(false)
                                setSelectedJobToDecline(null)
                                setLocalDeclineReason('')
                            }}
                            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDecline}
                            className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!localDeclineReason.trim()}
                        >
                            Decline Job
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="mt-12 bg-white rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8">
            <button
                onClick={() => setShowJobs(false)}
                className="mb-6 text-naijaGreen font-bold hover:underline flex items-center gap-2 text-sm sm:text-base"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
            </button>

            <OnsiteCheckModal />
            <DeclineReasonModal />

            {jobsLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naijaGreen"></div>
                    <p className="mt-4 text-gray-500 text-sm sm:text-base">Loading jobs...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                    <div className="text-5xl sm:text-6xl mb-4 text-gray-300">🛠️</div>
                    <p className="text-xl sm:text-2xl text-gray-500 font-bold">No jobs yet</p>
                    <p className="text-gray-400 mt-2 text-sm sm:text-base">Jobs will appear here when customers send them.</p>
                </div>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {jobs.map(job => (
                        <div key={job.id} className="relative border-2 border-naijaGreen/20 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
                            <button
                                onClick={(e) => handleDeleteJob(job.id, e)}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-full transition-colors"
                                title="Decline Job"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>

                            <div className="pr-10">
                                <h3 className="text-lg sm:text-xl font-bold text-naijaGreen break-words">
                                    {job.sub_service || job.category}
                                </h3>
                                {job.custom_sub_description && (
                                    <p className="text-sm sm:text-base text-gray-600 italic mt-1 break-words">
                                        Custom: {job.custom_sub_description}
                                    </p>
                                )}
                            </div>

                            {job.category === 'Logistics Services' && job.logistics_type && (
                                <div className="mt-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${job.logistics_type === 'pickup' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                        {job.logistics_type === 'pickup' ? '🔄 Pickup Service' : '🚚 Delivery Service'}
                                    </span>
                                </div>
                            )}

                            <div className="mt-4 grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <p className="text-gray-700 text-sm sm:text-base">
                                        <span className="font-bold">Location:</span> {job.location || 'Not specified'}
                                    </p>
                                    <p className="text-gray-700 text-sm sm:text-base">
                                        <span className="font-bold">Address:</span> {job.exact_address || 'Not provided'}
                                    </p>
                                    {/* LOGISTICS INFORMATION - ONLY FOR LOGISTICS SERVICES */}
                                    {job.category === 'Logistics Services' && (
                                        <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                            <h4 className="font-bold text-blue-800 text-sm sm:text-base mb-2">📦 Logistics Details</h4>

                                            <div className="space-y-2 text-sm sm:text-base">
                                                <div className="flex items-center">
                                                    <span className="font-medium text-blue-700 w-32 sm:w-36">Service Type:</span>
                                                    <span className={`font-bold ${job.logistics_type === 'pickup' ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {job.logistics_type === 'pickup' ? '🔄 Pickup' : '🚚 Delivery'}
                                                    </span>
                                                </div>

                                                <div className="flex items-start">
                                                    <span className="font-medium text-blue-700 w-32 sm:w-36">Contact Phone:</span>
                                                    <div className="flex-1">
                                                        <a
                                                            href={`tel:${job.logistics_contact_phone}`}
                                                            className="font-bold text-blue-800 hover:text-blue-600 hover:underline"
                                                        >
                                                            {job.logistics_contact_phone || 'N/A'}
                                                        </a>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {job.logistics_type === 'pickup'
                                                                ? "Person to pick up from"
                                                                : "Person to deliver to"}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <span className="font-medium text-blue-700 w-32 sm:w-36">
                                                        {job.logistics_type === 'pickup' ? 'Pickup Address:' : 'Delivery Address:'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-gray-800">{job.logistics_other_address || 'N/A'}</p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {job.logistics_type === 'pickup'
                                                                ? "Where to collect package from"
                                                                : "Where to deliver package to"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Destination Information */}
                                            <div className="flex items-start">
                                                <span className="font-medium text-blue-700 w-32 sm:w-36">
                                                    Destination Type:
                                                </span>
                                                <div className="flex-1">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${job.logistics_destination_type === 'intrastate' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                        {job.logistics_destination_type === 'intrastate' ? '🏠 Within Ogun State' : '🗺️ Outside Ogun State'}
                                                    </span>
                                                </div>
                                            </div>

                                            {job.logistics_destination_type === 'intrastate' && job.logistics_destination_location && (
                                                <div className="flex items-start">
                                                    <span className="font-medium text-blue-700 w-32 sm:w-36">
                                                        Destination Area:
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-gray-800 font-medium">{job.logistics_destination_location}</p>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Location in Ogun State
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {job.logistics_destination_type === 'interstate' && job.logistics_interstate_state && (
                                                <div className="flex items-start">
                                                    <span className="font-medium text-blue-700 w-32 sm:w-36">
                                                        Destination State:
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-gray-800 font-medium">{job.logistics_interstate_state}</p>
                                                        <p className="text-xs atext-gray-600 mt-1">
                                                            State outside Ogun
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-gray-700 text-sm sm:text-base">
                                        <span className="font-bold">Customer Budget:</span>
                                        <span className="text-naijaGreen font-bold ml-2">
                                            {job.budget === 'N/A' || !job.budget || job.budget === '0' ? 'Not specified' : `₦${Number(job.budget).toLocaleString()}`}
                                        </span>
                                    </p>
                                    <p className="text-gray-700 text-sm sm:text-base break-words">
                                        <span className="font-bold">Description:</span> {job.description || 'No description provided'}
                                    </p>
                                </div>

                                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                                        <p className="font-bold text-gray-800 text-sm sm:text-base">Customer Contact:</p>
                                        <div className="flex items-center gap-2">
                                            {job.customer?.verification_level && (
                                                <CustomerVerificationBadge
                                                    verificationLevel={job.customer.verification_level}
                                                    idType={job.customer.id_type}
                                                />
                                            )}
                                            {/* Message Button */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const conversation = await createConversation(job.customer_id, job.id);
                                                        setActiveConversation(conversation);
                                                        setShowChat(true);
                                                    } catch (error) {
                                                        console.error('Error starting conversation:', error);
                                                        alert('Failed to start conversation. Please try again.');
                                                    }
                                                }}
                                                className="bg-naijaGreen text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-darkGreen transition flex items-center gap-1"
                                                title="Message customer"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Message
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-sm sm:text-base">
                                        <p className="text-gray-700">
                                            <span className="font-medium">Name:</span> {job.customer?.customer_name || 'N/A'}
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-medium">Phone:</span>
                                            <strong className="ml-2 text-gray-900">{job.customer?.phone || 'Not provided'}</strong>
                                        </p>
                                        <p className="text-gray-700">
                                            <span className="font-medium">Email:</span> {job.customer?.email || 'N/A'}
                                        </p>
                                    </div>
                                    {job.customer?.verification_level === 'verified' && job.customer?.id_verified_at && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            Verified on: {new Date(job.customer.id_verified_at).toLocaleDateString('en-NG')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {job.photos && Array.isArray(job.photos) && job.photos.length > 0 && (
                                <div className="mt-4">
                                    <p className="font-bold text-gray-700 text-sm sm:text-base mb-2">
                                        Job Photos ({job.photos.length}):
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                                        {job.photos.map((url, i) => (
                                            <a
                                                key={i}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Job photo ${i + 1}`}
                                                    className="w-full h-24 sm:h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity"
                                                    onError={(e) => {
                                                        e.target.src = '/default-job-photo.jpg'
                                                        e.target.alt = 'Image failed to load'
                                                    }}
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    job.status === 'onsite_pending' ? 'bg-orange-100 text-orange-800' :
                                        job.status === 'price_set' ? 'bg-blue-100 text-blue-800' :
                                            job.status === 'deposit_paid' ? 'bg-green-100 text-green-800' :
                                                job.status === 'work_ongoing' ? 'bg-blue-100 text-blue-800' :
                                                    job.status === 'intermediate_paid' ? 'bg-purple-100 text-purple-800' :
                                                        job.status === 'work_completed' ? 'bg-orange-100 text-orange-800' :
                                                            job.status === 'completed_paid' ? 'bg-purple-100 text-purple-800' :
                                                                job.status === 'declined_by_customer' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                    }`}>
                                    {job.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>

                            {/* ACTION BUTTONS FOR PENDING STATUS */}
                            {job.status === 'pending' && (
                                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => {
                                            setSelectedJobForOnsite(job)
                                            setShowOnsiteModal(true)
                                        }}
                                        className="bg-orange-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-orange-700 transition-colors text-sm sm:text-base"
                                    >
                                        Request Onsite Check
                                    </button>
                                    <button
                                        onClick={() => setJobToQuote(job)}
                                        className="bg-naijaGreen text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-darkGreen transition-colors text-sm sm:text-base"
                                    >
                                        Send Quote Now
                                    </button>
                                </div>
                            )}

                            {/* ONSITE FEE REQUESTED - Waiting for customer payment */}
                            {job.status === 'onsite_fee_requested' && (
                                <div className="mt-4 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-1">
                                            <span className="text-xl sm:text-2xl">💰</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="font-bold text-orange-800 text-base sm:text-xl">Onsite Check Fee Requested</p>
                                            <p className="text-orange-700 text-sm sm:text-base mt-1">
                                                You've requested ₦{Number(job.onsite_fee_amount || 0).toLocaleString()} for onsite check.
                                                Waiting for customer to make payment.
                                            </p>

                                            {job.onsite_fee_bank_details && (
                                                <div className="mt-2 p-2 sm:p-3 bg-orange-100 border border-orange-300 rounded-lg">
                                                    <p className="font-medium text-orange-800 text-xs sm:text-sm mb-1">Your Bank Details (Shared with customer):</p>
                                                    {(() => {
                                                        let bankDetails;
                                                        try {
                                                            bankDetails = typeof job.onsite_fee_bank_details === 'string'
                                                                ? JSON.parse(job.onsite_fee_bank_details)
                                                                : job.onsite_fee_bank_details;
                                                        } catch (e) {
                                                            bankDetails = null;
                                                        }

                                                        return bankDetails ? (
                                                            <div className="text-orange-700 text-xs sm:text-sm space-y-1">
                                                                <p><span className="font-medium">Bank:</span> {bankDetails.bank_name}</p>
                                                                <p><span className="font-medium">Account:</span> {bankDetails.account_number}</p>
                                                                <p><span className="font-medium">Name:</span> {bankDetails.account_name}</p>
                                                            </div>
                                                        ) : null
                                                    })()}
                                                </div>
                                            )}

                                            <div className="mt-3 bg-white p-3 sm:p-4 rounded-lg border border-orange-300">
                                                <p className="font-medium text-gray-800 text-sm sm:text-base mb-1">Customer Contact:</p>
                                                <p className="text-gray-700 text-sm">
                                                    <span className="font-medium">Name:</span> {job.customer?.customer_name || 'Customer'}
                                                </p>
                                                <p className="text-gray-700 text-sm mt-1">
                                                    <span className="font-medium">Phone:</span>
                                                    <strong className="ml-2 text-orange-700">{job.customer?.phone || 'Check job details'}</strong>
                                                </p>
                                                <p className="text-gray-700 text-sm mt-1">
                                                    <span className="font-medium">Location:</span> {job.location || 'Not specified'}
                                                </p>
                                            </div>

                                            <p className="text-xs text-orange-600 mt-2">
                                                Customer will confirm payment after transferring the fee. Once confirmed, you can visit their location.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}


                            {/* ONSITE FEE PENDING CONFIRMATION - Customer says they paid, waiting for company to confirm */}
                            {job.status === 'onsite_fee_pending_confirmation' && (
                                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-1">
                                            <span className="text-xl sm:text-2xl">⏳</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="font-bold text-blue-800 text-base sm:text-xl">Payment Claimed - Confirm Receipt</p>
                                            <p className="text-blue-700 text-sm sm:text-base mt-1">
                                                Customer claims to have paid ₦{Number(job.onsite_fee_amount || 0).toLocaleString()} for onsite check.
                                                Please check your bank account and confirm receipt.
                                            </p>

                                            <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                                                <p className="font-medium text-blue-800 text-sm sm:text-base mb-1">Payment Details:</p>
                                                <div className="text-blue-700 text-xs sm:text-sm space-y-1">
                                                    <p>• Amount: ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}</p>
                                                    <p>• Claimed by customer: {new Date().toLocaleString()}</p>
                                                    <p>• Check your {job.onsite_fee_bank_details ?
                                                        (() => {
                                                            try {
                                                                const details = typeof job.onsite_fee_bank_details === 'string'
                                                                    ? JSON.parse(job.onsite_fee_bank_details)
                                                                    : job.onsite_fee_bank_details;
                                                                return details.bank_name || 'bank';
                                                            } catch {
                                                                return 'bank';
                                                            }
                                                        })()
                                                        : 'bank'} account
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-3 bg-white p-3 sm:p-4 rounded-lg border border-blue-300">
                                                <p className="font-medium text-gray-800 text-sm sm:text-base mb-1">Customer Contact:</p>
                                                <p className="text-gray-700 text-sm">
                                                    <span className="font-medium">Name:</span> {job.customer?.customer_name || 'Customer'}
                                                </p>
                                                <p className="text-gray-700 text-sm mt-1">
                                                    <span className="font-medium">Phone:</span>
                                                    <strong className="ml-2 text-blue-700">{job.customer?.phone || 'Check job details'}</strong>
                                                </p>
                                                <p className="text-gray-700 text-sm mt-1">
                                                    <span className="font-medium">Location:</span> {job.location || 'Not specified'}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                                <button
                                                    onClick={() => handleConfirmOnsiteFeeReceipt(job.id, job.onsite_fee_amount, job.customer?.customer_name)}
                                                    className="flex-1 bg-green-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-green-700 transition-colors text-sm sm:text-base"
                                                >
                                                    ✅ Confirm Payment Received
                                                </button>

                                                <button
                                                    onClick={() => handleReportNoOnsiteFee(job.id, job.onsite_fee_amount, job.customer?.customer_name)}
                                                    className="flex-1 bg-red-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-red-700 transition-colors text-sm sm:text-base"
                                                >
                                                    ❌ Not Received Yet
                                                </button>
                                            </div>

                                            <p className="text-xs text-blue-600 mt-2">
                                                Only confirm after checking your bank account and verifying the payment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ONSITE FEE PAID - Customer has paid, company can now visit */}
                            {job.status === 'onsite_fee_paid' && (
                                <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-1">
                                            <span className="text-xl sm:text-2xl">✅</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="font-bold text-green-800 text-base sm:text-xl">Onsite Fee Paid!</p>
                                            <p className="text-green-700 text-sm sm:text-base mt-1">
                                                Customer has paid ₦{Number(job.onsite_fee_amount || 0).toLocaleString()} for onsite check.
                                                You can now visit their location for assessment.
                                            </p>

                                            <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                                                <p className="font-medium text-green-800 text-sm sm:text-base mb-1">Payment Confirmed:</p>
                                                <div className="text-green-700 text-xs sm:text-sm space-y-1">
                                                    <p>• Amount: ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}</p>
                                                    <p>• Paid at: {job.onsite_fee_paid_at ? new Date(job.onsite_fee_paid_at).toLocaleString() : 'Recently'}</p>
                                                    <p>• This is for transportation and commitment fee</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 bg-white p-3 sm:p-4 rounded-lg border border-green-300">
                                                <p className="font-medium text-gray-800 text-sm sm:text-base mb-1">Visit Details:</p>
                                                <div className="text-gray-700 text-sm space-y-1">
                                                    <p><span className="font-medium">Customer:</span> {job.customer?.customer_name || 'Customer'}</p>
                                                    <p><span className="font-medium">Phone:</span> <strong className="text-green-700">{job.customer?.phone || 'Check job details'}</strong></p>
                                                    <p><span className="font-medium">Location:</span> {job.location || 'Not specified'}</p>
                                                    <p><span className="font-medium">Address:</span> {job.exact_address || 'Not provided'}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                                <button
                                                    onClick={() => setJobToQuote(job)}
                                                    className="flex-1 bg-naijaGreen text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-darkGreen transition-colors text-sm sm:text-base"
                                                >
                                                    Onsite Done - Send Quote
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (confirm('Have you visited the location? Click OK only after completing the onsite check.')) {
                                                            // Optionally add notes or mark as visited
                                                            alert('Great! Now send your quote using the button above.');
                                                        }
                                                    }}
                                                    className="flex-1 border-2 border-green-600 text-green-600 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-green-50 transition-colors text-sm sm:text-base"
                                                >
                                                    Mark as Visited
                                                </button>
                                            </div>

                                            <p className="text-xs text-green-600 mt-2">
                                                After visiting, send your quote to the customer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {job.status === 'onsite_pending' && (
                                <div className="mt-4 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <p className="font-bold text-orange-800 text-sm sm:text-base">Onsite Check Requested (Old Method)</p>
                                            <p className="text-orange-600 text-xs sm:text-sm mt-1">
                                                Waiting for customer confirmation. Once onsite check is done, send your quote.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setJobToQuote(job)}
                                            className="bg-naijaGreen text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-darkGreen transition-colors text-sm sm:text-base"
                                        >
                                            Onsite Done - Send Quote
                                        </button>
                                    </div>
                                </div>
                            )}

                            {job.status === 'price_set' && (
                                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p className="font-bold text-blue-800 text-base sm:text-lg">
                                        Quote Sent: ₦{Number(job.quoted_price).toLocaleString()}
                                    </p>
                                    <p className="text-blue-600 text-sm sm:text-base mt-1">
                                        Waiting for customer to accept and pay 50% deposit...
                                    </p>
                                    {job.company_notes && (
                                        <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                                            <p className="text-xs sm:text-sm font-medium text-blue-700">Your Notes:</p>
                                            <p className="text-blue-600 text-sm break-words">{job.company_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {jobToQuote?.id === job.id && (
                                <div className="mt-4">
                                    <QuoteForm
                                        jobId={jobToQuote.id}
                                        companyId={user?.id}
                                        onQuoteSubmitted={() => {
                                            setJobToQuote(null);
                                            loadJobs();
                                        }}
                                        onCancel={() => setJobToQuote(null)}
                                    />
                                </div>
                            )}

                            {job.status === 'deposit_paid' && (
                                <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="font-bold text-green-800 text-base sm:text-xl">Deposit Paid — Work Ongoing!</p>
                                    <p className="text-sm sm:text-lg mt-2">
                                        Agreed Price: ₦{Number(job.quoted_price).toLocaleString()}
                                    </p>
                                    <p className="text-sm sm:text-lg font-bold mt-2">
                                        Customer Phone: <span className="text-green-700">{job.customer?.phone || 'N/A'}</span>
                                    </p>

                                    <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                                        <p className="font-bold text-green-700 text-sm sm:text-base mb-2">Payment Structure:</p>
                                        <div className="text-xs sm:text-sm text-green-600 space-y-1">
                                            <p>✅ 50% Deposit: ₦{(job.quoted_price * 0.5).toLocaleString()} (Already Paid)</p>
                                            {job.paymentData?.hasIntermediate ? (
                                                <p>⏳ 30% Intermediate: ₦{(job.quoted_price * 0.3).toLocaleString()} (Already requested)</p>
                                            ) : (
                                                <p>⏳ Remaining Balance: ₦{(job.quoted_price * 0.5).toLocaleString()} (50%)</p>
                                            )}
                                            <p className="font-medium mt-2">Options for remaining balance:</p>
                                            <ul className="list-disc pl-4 sm:pl-5 mt-1 space-y-1">
                                                <li>Request 30% now for materials (customer pays 30%, you get materials)</li>
                                                <li>Complete work and get 50% final payment</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {!job.paymentData?.hasIntermediate && (
                                            <button
                                                onClick={() => requestIntermediatePayment(job.id)}
                                                className="bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                            >
                                                <span>💰</span>
                                                <span>Request 30% for Materials</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => markWorkAsCompleted(job.id)}
                                            className="bg-orange-500 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                        >
                                            <span>✅</span>
                                            <span>Mark Work as Completed</span>
                                        </button>
                                    </div>

                                    <p className="text-xs text-gray-600 mt-2 text-center">
                                        Need materials? Request 30% advance. Otherwise, mark as completed when done.
                                    </p>
                                </div>
                            )}

                            {job.status === 'work_ongoing' && (
                                <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-1">
                                            <span className="text-xl sm:text-2xl">⏳</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="font-bold text-blue-800 text-base sm:text-xl">Intermediate Payment Requested</p>
                                            <p className="text-blue-700 text-sm sm:text-base mt-1">
                                                You have requested a 30% intermediate payment (₦{(job.quoted_price * 0.30).toLocaleString()}) for materials.
                                            </p>
                                            <p className="text-sm sm:text-lg font-bold mt-2">
                                                Customer Phone: <span className="text-blue-700">{job.customer?.phone || 'N/A'}</span>
                                            </p>

                                            <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                                                <p className="font-medium text-blue-800 text-sm sm:text-base mb-1">Waiting for customer to pay:</p>
                                                <div className="text-blue-700 text-xs sm:text-sm space-y-1">
                                                    <p>• 30% Intermediate: ₦{(job.quoted_price * 0.30).toLocaleString()} (for materials)</p>
                                                    <p>• Remaining after payment: 20% final payment</p>
                                                    <p className="mt-2">Once customer pays, you'll receive notification to purchase materials.</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => markWorkAsCompleted(job.id)}
                                                className="mt-3 w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                                disabled={true}
                                            >
                                                <span>⏳</span>
                                                <span>Waiting for Intermediate Payment</span>
                                            </button>

                                            <p className="text-xs text-blue-600 mt-1 text-center">
                                                You can mark work as completed after customer pays the intermediate payment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {job.status === 'intermediate_paid' && (
                                <div className="mt-4 p-3 sm:p-4 bg-purple-50 border border-purple-200 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-1">
                                            <span className="text-xl sm:text-2xl">💰</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="font-bold text-purple-800 text-base sm:text-xl">Intermediate Payment Received!</p>
                                            <p className="text-purple-700 text-sm sm:text-base mt-1">
                                                Customer has paid 30% intermediate payment {
                                                    job.paymentData?.intermediateAmount > 0
                                                        ? `(₦${Number(job.paymentData.intermediateAmount).toLocaleString()})`
                                                        : `(₦${(job.quoted_price * 0.30).toLocaleString()})`
                                                } for materials.
                                            </p>
                                            <p className="text-sm sm:text-lg font-bold mt-2">
                                                Customer Phone: <span className="text-purple-700">{job.customer?.phone || 'N/A'}</span>
                                            </p>

                                            <div className="mt-3 p-3 bg-purple-100 border border-purple-300 rounded-lg">
                                                <p className="font-medium text-purple-800 text-sm sm:text-base mb-1">Payment Status:</p>
                                                <div className="text-purple-700 text-xs sm:text-sm space-y-1">
                                                    <p>✅ 50% Deposit: {
                                                        job.paymentData?.depositAmount > 0
                                                            ? `₦${Number(job.paymentData.depositAmount).toLocaleString()}`
                                                            : `₦${(job.quoted_price * 0.5).toLocaleString()}`
                                                    } (Paid)</p>
                                                    <p>✅ 30% Intermediate: {
                                                        job.paymentData?.intermediateAmount > 0
                                                            ? `₦${Number(job.paymentData.intermediateAmount).toLocaleString()}`
                                                            : `₦${(job.quoted_price * 0.30).toLocaleString()}`
                                                    } (Paid for materials)</p>
                                                    <p>⏳ 20% Final: ₦{(job.quoted_price * 0.20).toLocaleString()} (Due upon completion)</p>
                                                    <p className="font-bold mt-2">You can now purchase materials and continue work.</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => markWorkAsCompleted(job.id)}
                                                className="mt-3 w-full bg-orange-500 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                            >
                                                <span>✅</span>
                                                <span>Mark Work as Completed</span>
                                            </button>

                                            <p className="text-xs text-purple-600 mt-1 text-center">
                                                After completion, customer will pay final 20% balance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {job.status === 'work_completed' && (
                                <div className="mt-4 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <p className="font-bold text-orange-800 text-base sm:text-xl">Work Marked as Completed!</p>
                                    <p className="text-sm sm:text-lg mt-1">
                                        Waiting for customer to review and approve final payment.
                                    </p>

                                    <p className="text-sm sm:text-lg font-bold mt-2">
                                        Balance Due: <span className="text-orange-700">
                                            {job.paymentData?.hasIntermediate
                                                ? `₦${(job.quoted_price * 0.2).toLocaleString()} (20%)`
                                                : `₦${(job.quoted_price * 0.5).toLocaleString()} (50%)`
                                            }
                                        </span>
                                    </p>

                                    <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                                        <p className="font-medium text-orange-800 text-sm sm:text-base mb-1">Payment Summary:</p>
                                        <div className="text-orange-700 text-xs sm:text-sm space-y-1">
                                            <p>✅ 50% Deposit: ₦{(job.quoted_price * 0.5).toLocaleString()} (Paid)</p>
                                            {job.paymentData?.hasIntermediate && (
                                                <p>✅ 30% Intermediate: ₦{(job.quoted_price * 0.3).toLocaleString()} (Paid)</p>
                                            )}
                                            <p>⏳ Final Balance: {
                                                job.paymentData?.hasIntermediate
                                                    ? `₦${(job.quoted_price * 0.2).toLocaleString()} (20%)`
                                                    : `₦${(job.quoted_price * 0.5).toLocaleString()} (50%)`
                                            }</p>
                                        </div>
                                    </div>

                                    {job.paymentData?.depositAmount > 0 && (
                                        <p className="text-xs text-gray-600 mt-2">
                                            Actual deposit received: ₦{Number(job.paymentData.depositAmount).toLocaleString()}
                                        </p>
                                    )}
                                    {job.paymentData?.intermediateAmount > 0 && (
                                        <p className="text-xs text-gray-600 mt-1">
                                            Actual intermediate received: ₦{Number(job.paymentData.intermediateAmount).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}

                            {job.status === 'declined_by_customer' && (
                                <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <p className="font-bold text-red-700 text-base sm:text-xl">Job Cancelled by Customer</p>
                                </div>
                            )}

                            {job.status === 'completed_paid' && (
                                <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl">
                                    <p className="font-bold text-green-700 text-base sm:text-xl">Payment Finalized!</p>
                                    <p className="text-sm sm:text-lg mt-1">
                                        Total Earned: ₦{Number(job.quoted_price || 0).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {job.status === 'work_disputed' && (
                                <div className="mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-1">
                                            <span className="text-xl sm:text-2xl">⚠️</span>
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="font-bold text-red-800 text-base sm:text-xl">Customer Reported Issue</p>
                                            <p className="text-red-700 text-sm sm:text-base mt-1">
                                                Customer is not satisfied with the work and has requested a review.
                                            </p>

                                            {job.dispute_reason && (
                                                <div className="mt-2 p-2 sm:p-3 bg-red-100 border border-red-300 rounded-lg">
                                                    <p className="font-medium text-red-800 text-xs sm:text-sm mb-1">Customer's Issue:</p>
                                                    <p className="text-red-700 text-sm break-words">{job.dispute_reason}</p>
                                                </div>
                                            )}

                                            <div className="mt-3 bg-white p-3 sm:p-4 rounded-lg border border-red-300">
                                                <p className="font-medium text-gray-800 text-sm sm:text-base mb-1">Customer Contact:</p>
                                                <p className="text-gray-700 text-sm">
                                                    <span className="font-medium">Name:</span> {job.customer?.customer_name || 'Customer'}
                                                </p>
                                                <p className="text-gray-700 text-sm mt-1">
                                                    <span className="font-medium">Phone:</span>
                                                    <strong className="ml-2 text-red-700">{job.customer?.phone || 'Check job details'}</strong>
                                                </p>
                                            </div>

                                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                                <button
                                                    onClick={async () => {
                                                        const companyNameToUse = job.company_name || job.companies?.company_name || 'Your company';
                                                        if (!confirm(`Have you contacted the customer and fixed the issue?\n\nThis will mark the work as rectified and notify the customer to review.`)) return;

                                                        try {
                                                            const { error } = await supabase
                                                                .from('jobs')
                                                                .update({
                                                                    status: 'work_rectified',
                                                                    company_notes: `Issue addressed: ${job.dispute_reason?.substring(0, 100)}...`,
                                                                    updated_at: new Date().toISOString()
                                                                })
                                                                .eq('id', job.id);

                                                            if (error) throw error;

                                                            await supabase.from('notifications').insert({
                                                                user_id: job.customer_id,
                                                                job_id: job.id,
                                                                type: 'work_rectified',
                                                                title: 'Issue Fixed ✅',
                                                                message: `${companyNameToUse} has addressed your concerns and fixed the work. Please review and approve for final payment.`,
                                                                read: false
                                                            });

                                                            alert('Work marked as fixed! Customer has been notified to review.');
                                                            loadJobs();

                                                        } catch (error) {
                                                            console.error('Error marking work as fixed:', error);
                                                            alert('Failed to update status. Please try again.');
                                                        }
                                                    }}
                                                    className="flex-1 bg-green-600 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold hover:bg-green-700 transition-colors text-sm sm:text-base"
                                                >
                                                    ✅ Issue Fixed - Notify Customer
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const notes = prompt('Add internal notes about this dispute:');
                                                        if (notes) {
                                                            alert('Notes saved. Continue working with customer.');
                                                        }
                                                    }}
                                                    className="flex-1 border-2 border-gray-400 text-gray-700 px-4 py-2.5 sm:px-4 sm:py-3 rounded-lg font-bold hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                                >
                                                    📝 Add Notes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {job.status === 'work_rectified' && (
                                <div className="mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-1">
                                            <span className="text-xl sm:text-2xl">🔄</span>
                                        </div>
                                        <div className="ml-3">
                                            <p className="font-bold text-yellow-800 text-base sm:text-xl">Waiting for Customer Review</p>
                                            <p className="text-yellow-700 text-sm sm:text-base mt-1">
                                                You've fixed the reported issue. Waiting for customer to review and approve final payment.
                                            </p>
                                            <p className="text-xs sm:text-sm text-yellow-600 mt-2">
                                                Customer will be prompted to pay the remaining balance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            <ChatModal
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                currentUserId={user?.id}
                userRole="company"
            />
        </div>
    )
}