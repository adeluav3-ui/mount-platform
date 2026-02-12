// src/components/MyJobs.jsx - COMPLETE FLOW
import React from 'react';
import { useSupabase } from '../context/SupabaseContext'
import { useState, useEffect } from 'react'

export default function MyJobs({ onHasNewQuotes }) {
    const { user, supabase } = useSupabase()
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(null)
    const [hasNewQuotes, setHasNewQuotes] = useState(false)
    const [companyNames, setCompanyNames] = useState({})

    // Load jobs and company names
    const loadJobs = async () => {
        setLoading(true)

        try {
            const { data: jobsData, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const jobsList = jobsData || []

            // Fetch payment data for ALL jobs at once
            if (jobsList.length > 0) {
                const jobIds = jobsList.map(job => job.id);

                // Fetch all financial transactions for these jobs
                const { data: allPayments, error: paymentsError } = await supabase
                    .from('financial_transactions')
                    .select('job_id, type, amount, status, verified_by_admin')
                    .in('job_id', jobIds)
                    // Get: 1) All completed payments OR 2) Any intermediate payments
                    .or('status.eq.completed,type.eq.intermediate')
                    .order('created_at', { ascending: false });

                console.log('📊 Payment data debug:', {
                    jobIds,
                    paymentCount: allPayments?.length || 0,
                    payments: allPayments
                });

                // Also log the specific job's payments
                if (jobIds.includes('d802ee1a-9fe7-4292-b784-3886684b7bbd')) { // Use your job ID
                    const jobPayments = allPayments?.filter(p => p.job_id === 'd802ee1a-9fe7-4292-b784-3886684b7bbd');
                    console.log('🔍 Specific job payments:', jobPayments);
                }

                if (paymentsError) {
                    console.warn('Could not fetch payment data:', paymentsError);
                }

                // Process each job with its payment data
                // Process each job with its payment data
                const jobsWithPaymentData = await Promise.all(
                    jobsList.map(async (job) => {
                        // Fetch payments for THIS SPECIFIC JOB
                        const { data: jobPayments, error: paymentError } = await supabase
                            .from('financial_transactions')
                            .select('type, amount, status, verified_by_admin, platform_fee')
                            .eq('job_id', job.id)
                            .or('status.eq.completed,type.eq.intermediate')
                            .order('created_at', { ascending: false });

                        if (paymentError) {
                            console.warn(`Could not fetch payments for job ${job.id}:`, paymentError);
                        }

                        const payments = jobPayments || [];
                        const quotedPrice = job.quoted_price || 0;

                        // Calculate payment summary - SEPARATE DEPOSIT FROM SERVICE FEE
                        let depositPaid = 0;
                        let serviceFeePaid = 0;
                        let intermediatePaid = 0;
                        let finalPaid = 0;
                        let hasDeposit = false;
                        let hasIntermediate = false;
                        let hasFinal = false;
                        let pendingIntermediate = false;

                        payments.forEach(payment => {
                            if (payment.type === 'deposit' && payment.status === 'completed') {
                                // IMPORTANT: depositPaid should be the base amount WITHOUT service fee
                                // The service fee is stored in platform_fee
                                depositPaid += (payment.amount || 0) - (payment.platform_fee || 0);
                                serviceFeePaid += payment.platform_fee || 0;
                                hasDeposit = true;
                            } else if (payment.type === 'intermediate') {
                                if (payment.status === 'completed') {
                                    intermediatePaid += payment.amount || 0;
                                    hasIntermediate = true;
                                } else if (payment.status === 'pending') {
                                    pendingIntermediate = true;
                                }
                            } else if (payment.type === 'final_payment' && payment.status === 'completed') {
                                finalPaid += payment.amount || 0;
                                hasFinal = true;
                            }
                        });

                        // Total paid INCLUDING service fee (for display)
                        const totalPaidWithFees = depositPaid + serviceFeePaid + intermediatePaid + finalPaid;

                        // Total paid WITHOUT service fee (for balance calculation)
                        const totalPaidWithoutFees = depositPaid + intermediatePaid + finalPaid;

                        // Balance should be calculated WITHOUT considering service fee
                        const balanceDue = quotedPrice - totalPaidWithoutFees;

                        // Determine payment pattern
                        let depositPercentage = 50; // Always 50% for deposit
                        let intermediatePercentage = 0;
                        let finalPercentage = 0;

                        if (hasIntermediate) {
                            // 50/30/20 pattern
                            intermediatePercentage = 30;
                            finalPercentage = 20;
                        } else {
                            // 50/50 pattern (no intermediate)
                            finalPercentage = 50;
                        }

                        // If final payment already made, show 0%
                        if (hasFinal) {
                            finalPercentage = 0;
                        }

                        // For display - always show clean percentages
                        const displayDepositPercentage = depositPercentage;
                        const displayIntermediatePercentage = intermediatePercentage;
                        const displayFinalPercentage = finalPercentage;

                        console.log(`📊 Payment Summary for ${job.id.substring(0, 8)}:`, {
                            quotedPrice,
                            depositPaid,
                            serviceFeePaid,
                            intermediatePaid,
                            finalPaid,
                            totalPaidWithFees,
                            totalPaidWithoutFees,
                            balanceDue,
                            hasDeposit,
                            hasIntermediate,
                            hasFinal,
                            displayDepositPercentage,
                            displayIntermediatePercentage,
                            displayFinalPercentage,
                            pattern: hasIntermediate ? '50/30/20' : '50/50'
                        });

                        return {
                            ...job,
                            paymentData: {
                                depositPaid,
                                serviceFeePaid,
                                intermediatePaid,
                                finalPaid,
                                totalPaidWithFees,
                                totalPaidWithoutFees,
                                balanceDue,
                                hasDeposit,
                                hasIntermediate,
                                hasFinal,
                                pendingIntermediate,
                                depositPercentage: displayDepositPercentage,
                                intermediatePercentage: displayIntermediatePercentage,
                                finalPercentage: displayFinalPercentage,
                                // Expected amounts
                                expectedDepositAmount: quotedPrice * 0.5,
                                expectedIntermediateAmount: quotedPrice * 0.3,
                                expectedFinalAmount: hasIntermediate ? quotedPrice * 0.2 : quotedPrice * 0.5
                            }
                        };
                    })
                );

                setJobs(jobsWithPaymentData);
            } else {
                setJobs([]);
            }

            // Fetch company names
            const companyIds = [...new Set(
                jobsList.map(job => {
                    // Include both company_id and declined_by_company_id
                    if (job.company_id) return job.company_id
                    if (job.declined_by_company_id) return job.declined_by_company_id
                    return null
                }).filter(id => id)
            )]

            if (companyIds.length > 0) {
                const { data: companies, error: companiesError } = await supabase
                    .from('companies')
                    .select('id, company_name')
                    .in('id', companyIds)

                if (!companiesError && companies) {
                    const companyMap = {}
                    companies.forEach(company => {
                        companyMap[company.id] = company.company_name
                    })
                    setCompanyNames(companyMap)
                }
            }

            // Check for new quotes
            const newQuotedJobs = jobsList.filter(job =>
                job.quoted_price &&
                job.status === 'price_set'
            )

            setHasNewQuotes(newQuotedJobs.length > 0)
            if (onHasNewQuotes) onHasNewQuotes(newQuotedJobs.length > 0)

        } catch (err) {
            console.error('Error loading jobs:', err)
            setJobs([])
        } finally {
            setLoading(false)
        }
    }

    // Get company name - check both company_id and declined_by_company_id
    const getCompanyName = (job) => {
        if (!job.company_id && !job.declined_by_company_id) return 'Waiting for company assignment'

        // For declined jobs, use declined_by_company_id
        const companyId = job.declined_by_company_id || job.company_id
        return companyNames[companyId] || 'Company'
    }

    // ACCEPT QUOTE - Redirect to payment page
    const handleAcceptQuote = async (jobId, quotedPrice, companyName) => {
        setIsProcessing(jobId);

        try {
            // Update status to show payment is being processed
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'price_set', // Keep as price_set until payment is verified
                    upfront_payment: quotedPrice * 0.5,
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (updateError) throw updateError;

            // Simply redirect to the payment page
            // Your PaymentPage component will handle the payment initialization
            window.location.href = `/payment/${jobId}`;
            return; // Important: return after redirect

        } catch (error) {
            console.error('Payment initialization error:', error);

            // Reset status on error
            await supabase
                .from('jobs')
                .update({
                    status: 'price_set',
                    upfront_payment: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            alert('Failed to initialize payment. Please try again.');
            loadJobs();
        } finally {
            setIsProcessing(null);
        }
    };

    // PAY ONSITE FEE - Customer confirms they've paid the onsite fee
    // PAY ONSITE FEE - Customer confirms they've paid (STEP 1)
    const handlePayOnsiteFee = async (jobId, feeAmount, companyName) => {
        const confirmMessage = `Confirm that you've paid ₦${Number(feeAmount).toLocaleString()} to ${companyName}?\n\n` +
            `After confirming:\n` +
            `1. ${companyName} will be notified of your payment\n` +
            `2. They will confirm receipt on their dashboard\n` +
            `3. Once confirmed, they will visit your location\n` +
            `4. Then provide a quote\n\n` +
            `Click OK only if you've made the bank transfer.`;

        if (!window.confirm(confirmMessage)) return;

        setIsProcessing(jobId);

        try {
            // Update job to mark onsite fee as PENDING CONFIRMATION (not paid yet)
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'onsite_fee_pending_confirmation',  // NEW STATUS
                    onsite_fee_paid: false,  // Still false until company confirms
                    onsite_fee_paid_at: null,  // Not set yet
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (updateError) throw updateError;

            // Notify the company that customer claims to have paid
            const job = jobs.find(j => j.id === jobId);
            if (job && job.company_id) {
                await supabase.from('notifications').insert({
                    user_id: job.company_id,
                    job_id: jobId,
                    type: 'onsite_fee_pending_confirmation',
                    title: 'Onsite Fee Payment Claimed',
                    message: `Customer claims to have paid ₦${Number(feeAmount).toLocaleString()} for onsite check. Please confirm receipt in your dashboard.`,
                    metadata: {
                        fee_amount: feeAmount,
                        claimed_at: new Date().toISOString(),
                        requires_action: true
                    },
                    read: false,
                    created_at: new Date().toISOString()
                });
            }

            alert(`✅ Payment claimed! ${companyName} has been notified to confirm receipt.\n\nThey will confirm on their dashboard before visiting.`);
            loadJobs();

        } catch (error) {
            console.error('Error claiming onsite fee payment:', error);
            alert('Failed to claim payment. Please try again.');
        } finally {
            setIsProcessing(null);
        }
    };

    // DECLINE ONSITE FEE - Customer doesn't want to pay
    const handleDeclineOnsiteFee = async (jobId, companyName) => {
        if (!window.confirm(`Decline the onsite check fee from ${companyName}?\n\nThis job will be cancelled.`)) return;

        setIsProcessing(jobId);

        try {
            // Update job status
            const { error } = await supabase
                .from('jobs')
                .update({
                    status: 'declined',
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (error) throw error;

            // Notify company
            const job = jobs.find(j => j.id === jobId);
            if (job && job.company_id) {
                await supabase.from('notifications').insert({
                    user_id: job.company_id,
                    job_id: jobId,
                    type: 'onsite_fee_declined',
                    title: 'Onsite Fee Declined',
                    message: `Customer declined to pay the onsite check fee for job #${jobId}. Job has been cancelled.`,
                    read: false,
                    created_at: new Date().toISOString()
                });
            }

            alert('Onsite check declined. Job has been cancelled.');
            loadJobs();
        } catch (error) {
            console.error('Error declining onsite fee:', error);
            alert('Failed to decline onsite check. Please try again.');
        } finally {
            setIsProcessing(null);
        }
    };

    // DECLINE QUOTE - Notify company
    const handleDeclineQuote = async (jobId, companyName) => {
        if (!window.confirm(`Are you sure you want to decline the quote from ${companyName}?`)) return

        setIsProcessing(jobId)
        try {
            // Get job details first to get company_id
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('company_id')
                .eq('id', jobId)
                .single()

            if (jobError) throw jobError

            // Update job status
            const { error } = await supabase
                .from('jobs')
                .update({
                    status: 'declined',
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)

            if (error) throw error

            // Notify company
            if (job.company_id) {
                await supabase.from('notifications').insert({
                    user_id: job.company_id,
                    job_id: jobId,
                    type: 'quote_declined',
                    title: 'Quote Declined',
                    message: `Customer declined your quote for job #${jobId}. Job has been cancelled.`,
                    read: false
                })
            }

            alert('Quote declined. Company has been notified.')
            loadJobs()
        } catch (error) {
            console.error('Error declining quote:', error)
            alert('Failed to decline quote.')
        } finally {
            setIsProcessing(null)
        }
    }

    // CUSTOMER APPROVES WORK AFTER FIX - WITH DEBUGGING
    // CUSTOMER APPROVES WORK AFTER FIX - WITH PAYMENT DATA
    const handleApproveWork = async (jobId, quotedPrice, companyName) => {
        console.log('🎯 START handleApproveWork:', {
            jobId,
            currentStatus: jobs.find(j => j.id === jobId)?.status,
            paymentData: jobs.find(j => j.id === jobId)?.paymentData,
            time: new Date().toISOString()
        });

        // Get the specific job with payment data
        const currentJob = jobs.find(j => j.id === jobId);
        if (!currentJob) {
            console.error('Job not found:', jobId);
            alert('Job not found. Please refresh the page.');
            return;
        }

        // Use payment data to determine the amount
        const hasIntermediate = currentJob.paymentData?.hasIntermediate || false;
        const balanceDue = currentJob.paymentData?.balanceDue ||
            (hasIntermediate ? quotedPrice * 0.2 : quotedPrice * 0.5);

        // Calculate what has been paid
        const depositPaid = currentJob.paymentData?.depositPaid || quotedPrice * 0.5;
        const intermediatePaid = currentJob.paymentData?.intermediatePaid || 0;
        const totalPaidSoFar = depositPaid + intermediatePaid;

        const confirmMessage = `
Are you satisfied with the work done by ${companyName}?

This will release the final payment of ₦${balanceDue.toLocaleString()} to ${companyName}.

Payment Summary:
• Total Job Amount: ₦${quotedPrice.toLocaleString()}
• Already Paid: ₦${totalPaidSoFar.toLocaleString()} (${hasIntermediate ? '50% deposit + 30% materials' : '50% deposit'})
• Final Payment: ₦${balanceDue.toLocaleString()} (${hasIntermediate ? '20%' : '50%'})

Click OK to proceed to payment.`;

        if (!window.confirm(confirmMessage)) {
            console.log('❌ User cancelled');
            return;
        }

        setIsProcessing(jobId);

        try {
            console.log('💰 Balance due calculation:', {
                quotedPrice,
                hasIntermediate,
                balanceDue,
                depositPaid,
                intermediatePaid,
                totalPaidSoFar,
                shouldBe20Percent: hasIntermediate && Math.abs(balanceDue - (quotedPrice * 0.2)) < 1,
                shouldBe50Percent: !hasIntermediate && Math.abs(balanceDue - (quotedPrice * 0.5)) < 1
            });

            // Just redirect to the payment page
            // The PaymentPage component will calculate the correct amount based on actual payments
            console.log('✅ Redirecting to payment page');
            window.location.href = `/payment/${jobId}`;

        } catch (error) {
            console.error('❌ Final payment error:', error);
            alert('Failed to initialize final payment. Please try again.');
            loadJobs();
        } finally {
            setIsProcessing(null);
        }
    };

    // PAY INTERMEDIATE PAYMENT - For work_ongoing status
    const handlePayIntermediate = async (jobId, quotedPrice, companyName) => {
        setIsProcessing(jobId);

        try {
            // Simply redirect to the payment page
            // The PaymentPage component will detect work_ongoing status and show intermediate payment
            window.location.href = `/payment/${jobId}`;
            return; // Important: return after redirect

        } catch (error) {
            console.error('Intermediate payment initialization error:', error);
            alert('Failed to initialize intermediate payment. Please try again.');
            loadJobs();
        } finally {
            setIsProcessing(null);
        }
    };

    // CUSTOMER REPORTS WORK ISSUE - Proper dispute flow
    const handleReportWorkIssue = async (jobId, companyName) => {
        const issueDetails = prompt(`Please describe what's wrong with the work done by ${companyName}:\n\nBe specific so they can fix it properly.`);

        if (!issueDetails || issueDetails.trim().length < 10) {
            alert('Please provide specific details about the issue (at least 10 characters).');
            return;
        }

        setIsProcessing(jobId);

        try {
            // Get job details
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('id, company_id, customer_id, status')
                .eq('id', jobId)
                .eq('customer_id', user.id)
                .single();

            if (jobError) throw jobError;

            // Update job status to work_disputed (not rejected)
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'work_disputed',
                    dispute_reason: issueDetails.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)
                .eq('customer_id', user.id);

            if (updateError) throw updateError;

            // Create detailed notification for company
            if (job.company_id) {
                await supabase.from('notifications').insert({
                    user_id: job.company_id,
                    job_id: jobId,
                    type: 'work_disputed',
                    title: '⚠️ Work Issue Reported',
                    message: `Customer reported an issue with job #${jobId.substring(0, 8)}.\n\nIssue: "${issueDetails.substring(0, 100)}${issueDetails.length > 100 ? '...' : ''}"\n\nPlease review and contact customer to arrange fixes.`,
                    metadata: {
                        issue_details: issueDetails.trim(),
                        customer_id: job.customer_id,
                        requires_action: true
                    },
                    read: false
                });
            }

            // Confirm to customer
            alert(`Issue reported to ${companyName}.\n\nThey will contact you shortly to arrange fixing the work.`);

            loadJobs();

        } catch (error) {
            console.error('Error reporting work issue:', error);
            alert(`Failed to report issue: ${error.message || 'Please try again.'}`);
        } finally {
            setIsProcessing(null);
        }
    };

    // CUSTOMER REPORTS WORK ISSUE AGAIN - After company has fixed
    const handleReportWorkIssueAgain = async (jobId, companyName) => {
        const issueDetails = prompt(`The work is still not satisfactory. Please explain what's still wrong:\n\nBe specific so ${companyName} can fix it properly.`);

        if (!issueDetails || issueDetails.trim().length < 10) {
            alert('Please provide specific details about what is still wrong (at least 10 characters).');
            return;
        }

        setIsProcessing(jobId);

        try {
            // Update job status back to work_disputed
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'work_disputed',
                    dispute_reason: issueDetails.trim(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)
                .eq('customer_id', user.id);

            if (updateError) throw updateError;

            // Notify company again
            const job = jobs.find(j => j.id === jobId);
            if (job && job.company_id) {
                await supabase.from('notifications').insert({
                    user_id: job.company_id,
                    job_id: jobId,
                    type: 'work_disputed_again',
                    title: '⚠️ Work Still Not Satisfactory',
                    message: `Customer says the work is still not satisfactory for job #${jobId.substring(0, 8)}.\n\nNew issue: "${issueDetails.substring(0, 100)}${issueDetails.length > 100 ? '...' : ''}"`,
                    metadata: {
                        issue_details: issueDetails.trim(),
                        customer_id: job.customer_id,
                        requires_action: true
                    },
                    read: false
                });
            }

            alert(`Issue reported again to ${companyName}. They will contact you to arrange further fixes.`);
            loadJobs();

        } catch (error) {
            console.error('Error reporting work issue again:', error);
            alert(`Failed to report issue: ${error.message || 'Please try again.'}`);
        } finally {
            setIsProcessing(null);
        }
    };
    useEffect(() => {
        if (user && supabase) {
            loadJobs()
        }

        // In your real-time subscription in MyJobs.jsx:
        const channel = supabase
            .channel('customer-jobs')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'jobs',
                filter: `customer_id=eq.${user?.id}`
            }, (payload) => {
                console.log('🔔 Real-time job update:', {
                    event: payload.eventType,
                    oldStatus: payload.old?.status,
                    newStatus: payload.new?.status,
                    jobId: payload.new?.id,
                    timestamp: new Date().toISOString()
                });
                loadJobs();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, supabase])

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short'
        })
    }

    // Helper function to get status display
    const getStatusDisplay = (job) => {
        const status = job.status || 'pending'

        if (status === 'awaiting_payment') return 'Awaiting Payment'
        if (status === 'deposit_paid') return 'Work Ongoing'
        if (status === 'work_ongoing') return 'Intermediate Payment Requested' // NEW
        if (status === 'intermediate_paid') return 'Materials Funded - Work Ongoing' // NEW
        if (status === 'work_completed') return 'Work Completed'
        if (status === 'work_rejected') return 'Needs Review'
        if (status === 'ready_for_final_payment') return 'Processing Final Payment'
        if (status === 'awaiting_final_payment') return 'Final Payment in Progress'
        if (status === 'completed') return 'Job Completed'
        if (status === 'work_disputed') return 'Issue Reported - Awaiting Fix'
        if (status === 'under_review') return 'Company Reviewing Issue'
        if (status === 'work_rectified') return 'Issue Fixed - Review Work'
        if (status === 'declined_by_company') return 'Declined by Company'
        if (status === 'declined') return 'Quote Declined'
        if (status === 'onsite_fee_pending_confirmation') return 'Awaiting Company Confirmation'
        if (status === 'onsite_fee_requested') return 'Onsite Check Fee Required'
        if (job.quoted_price && status === 'price_set') return 'Quote Available'
        return 'Awaiting Quotes'
    }

    // Helper function to get status color
    const getStatusColor = (job) => {
        const status = job.status || 'pending'

        if (status === 'awaiting_payment') return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        if (status === 'deposit_paid') return 'bg-blue-100 text-blue-800 border border-blue-300'
        if (status === 'work_ongoing') return 'bg-purple-100 text-purple-800 border border-purple-300' // NEW
        if (status === 'intermediate_paid') return 'bg-indigo-100 text-indigo-800 border border-indigo-300' // NEW
        if (status === 'work_completed') return 'bg-orange-100 text-orange-800 border border-orange-300'
        if (status === 'work_rejected') return 'bg-red-100 text-red-800 border border-red-300'
        if (status === 'ready_for_final_payment') return 'bg-purple-100 text-purple-800 border border-purple-300'
        if (status === 'awaiting_final_payment') return 'bg-purple-100 text-purple-800 border border-purple-300'
        if (status === 'completed') return 'bg-green-100 text-green-800 border border-green-300'
        if (status === 'work_disputed') return 'bg-red-100 text-red-800 border border-red-300'
        if (status === 'under_review') return 'bg-orange-100 text-orange-800 border border-orange-300'
        if (status === 'work_rectified') return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
        if (status === 'declined') return 'bg-red-100 text-red-800 border border-red-300'
        if (status === 'onsite_fee_pending_confirmation') return 'bg-blue-100 text-blue-800 border border-blue-300'
        if (job.quoted_price && status === 'price_set') return 'bg-green-100 text-green-800 border border-green-300'
        return 'bg-gray-100 text-gray-800'
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naijaGreen mb-4"></div>
                    <p className="text-gray-600">Loading your jobs...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">My Jobs</h1>
                <p className="text-gray-600">Review quotes and manage your jobs</p>

                {hasNewQuotes && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <p className="text-green-800 font-medium">
                            📬 New quotes available! Review below.
                        </p>
                    </div>
                )}
            </div>

            {/* Jobs List */}
            {jobs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl shadow">
                    <p className="text-xl text-gray-600 mb-4">No jobs yet</p>
                    <button
                        onClick={() => window.location.hash = 'postJob'}
                        className="bg-naijaGreen text-white px-6 py-3 rounded-lg font-bold hover:bg-darkGreen transition"
                    >
                        Post Your First Job
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {jobs.map(job => {
                        const companyName = getCompanyName(job)
                        const hasQuote = job.quoted_price && job.quoted_price > 0
                        const hasCompany = job.company_id
                        const status = job.status || 'pending'

                        return (
                            <div key={job.id} className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:shadow-lg transition-shadow">

                                {/* Job Header */}
                                <div className="p-5 border-b border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">
                                                {job.category}
                                                {job.sub_service && (
                                                    <span className="text-gray-600 ml-2">• {job.sub_service}</span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Posted {formatDate(job.created_at)}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(job)}`}>
                                            {getStatusDisplay(job)}
                                        </span>
                                    </div>
                                </div>

                                {/* Job Content */}
                                <div className="p-5">

                                    {/* COMPANY NAME - ALWAYS SHOW IF THERE'S A COMPANY */}
                                    {hasCompany && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Service Provider</p>
                                            <p className="text-lg font-bold text-naijaGreen">
                                                {getCompanyName(job)}
                                            </p>
                                        </div>
                                    )}
                                    {/* QUOTE AVAILABLE - AWAITING ACCEPTANCE */}
                                    {hasQuote && status === 'price_set' && (
                                        <div className="mb-6">
                                            {/* QUOTE AMOUNTS */}
                                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                                                <div className="flex justify-between items-center mb-3">
                                                    <p className="text-gray-700 font-medium">Total Quote</p>
                                                    <p className="text-2xl font-bold text-gray-800">
                                                        ₦{Number(job.quoted_price).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-gray-700">Pay Now (50%)</p>
                                                    <p className="text-xl font-bold text-naijaGreen">
                                                        ₦{(job.quoted_price * 0.5).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ACTION BUTTONS */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleAcceptQuote(job.id, job.quoted_price, companyName)}
                                                    disabled={isProcessing === job.id}
                                                    className="flex-1 bg-naijaGreen text-white py-3 rounded-lg font-bold hover:bg-darkGreen transition disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {isProcessing === job.id ? (
                                                        <>
                                                            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </>
                                                    ) : 'Accept Quote & Pay'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineQuote(job.id, companyName)}
                                                    disabled={isProcessing === job.id}
                                                    className="flex-1 bg-white border-2 border-red-600 text-red-600 py-3 rounded-lg font-bold hover:bg-red-50 transition disabled:opacity-50"
                                                >
                                                    Decline Quote
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* AWAITING PAYMENT STATUS */}
                                    {status === 'awaiting_payment' && (
                                        <div className="mb-6">
                                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-2">
                                                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-yellow-700 font-medium">Payment in Progress</p>
                                                </div>
                                                <p className="text-yellow-600 text-sm">
                                                    Redirecting to payment page... If not redirected, check your payment confirmation.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* DEPOSIT PAID - WORK ONGOING */}
                                    {/* DEPOSIT PAID - WORK ONGOING */}
                                    {status === 'deposit_paid' && (
                                        <div className="mb-6">
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-blue-700 font-medium">Work Ongoing</p>
                                                </div>

                                                <p className="text-blue-600 mb-4">
                                                    {companyName} has received your 50% deposit and is working on your job.
                                                </p>

                                                <div className="bg-white p-3 rounded-lg border border-blue-100">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-gray-600">Deposit Paid (50%)</p>
                                                            <p className="text-lg font-bold text-blue-700">
                                                                ₦{Number(job.paymentData?.depositPaid || (job.quoted_price * 0.5)).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Show service fee if it was charged */}
                                                        {job.paymentData?.serviceFeePaid > 0 && (
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-gray-600">Service Fee</p>
                                                                <p className="text-sm text-purple-600">
                                                                    + ₦{Number(job.paymentData?.serviceFeePaid).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="text-gray-600 font-bold">Balance Due (50%)</p>
                                                            <p className="text-lg font-bold text-gray-800">
                                                                ₦{(job.quoted_price * 0.5).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Total paid including fees */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="text-gray-600">Total Paid:</p>
                                                            <p className="font-bold text-green-700">
                                                                ₦{Number(job.paymentData?.totalPaidWithFees || (job.quoted_price * 0.5)).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-gray-500 text-sm text-center">
                                                You'll be notified when {companyName} marks the work as completed.
                                                {job.intermediate_payment_requested && (
                                                    <span className="text-purple-600 font-medium block mt-2">
                                                        Note: Company may request 30% for materials if needed.
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    )}

                                    {/* WORK ONGOING - INTERMEDIATE PAYMENT REQUESTED */}
                                    {status === 'work_ongoing' && (
                                        <div className="mb-6">
                                            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                                    </svg>
                                                    <p className="text-purple-700 font-medium">Materials Payment Requested</p>
                                                </div>

                                                <p className="text-purple-600 mb-4">
                                                    {companyName} has requested a 30% intermediate payment (₦{(job.quoted_price * 0.3).toLocaleString()})
                                                    to purchase materials needed for your job.
                                                </p>

                                                <div className="bg-white p-3 rounded-lg border border-orange-100 mb-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-gray-600">Deposit Paid (50%)</p>
                                                            <p className="text-lg font-bold text-blue-700">
                                                                ₦{Number(job.paymentData?.depositPaid || (job.quoted_price * 0.5)).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Show intermediate payment if it exists */}
                                                        {job.paymentData?.hasIntermediate && (
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-gray-600">Materials Paid (30%)</p>
                                                                <p className="text-lg font-bold text-purple-700">
                                                                    ₦{Number(job.paymentData?.intermediatePaid || (job.quoted_price * 0.3)).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Final balance - clean percentage */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="text-gray-600 font-bold">
                                                                Final Balance ({job.paymentData?.hasIntermediate ? '20%' : '50%'})
                                                            </p>
                                                            <p className="text-xl font-bold text-naijaGreen">
                                                                ₦{Number(job.paymentData?.balanceDue ||
                                                                    (job.paymentData?.hasIntermediate ? job.quoted_price * 0.2 : job.quoted_price * 0.5)
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Total */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="font-medium">Total Job Amount:</p>
                                                            <p className="text-xl font-bold text-gray-800">
                                                                ₦{Number(job.quoted_price).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* ACTION BUTTON */}
                                                <button
                                                    onClick={() => handlePayIntermediate(job.id, job.quoted_price, companyName)}
                                                    disabled={isProcessing === job.id}
                                                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {isProcessing === job.id ? (
                                                        <>
                                                            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="mr-2">💰</span>
                                                            Pay 30% for Materials - ₦{(job.quoted_price * 0.3).toLocaleString()}
                                                        </>
                                                    )}
                                                </button>

                                                <p className="text-purple-500 text-sm mt-3 text-center">
                                                    This payment will help the company purchase materials needed to complete your job.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* INTERMEDIATE PAID - MATERIALS FUNDED, WORK CONTINUES */}
                                    {status === 'intermediate_paid' && (
                                        <div className="mb-6">
                                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-indigo-700 font-medium">Materials Payment Confirmed</p>
                                                </div>

                                                <p className="text-indigo-600 mb-4">
                                                    Your 30% materials payment has been confirmed. {companyName} will now purchase materials and continue work.
                                                </p>

                                                <div className="bg-white p-3 rounded-lg border border-indigo-100 mb-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-gray-600">Deposit Paid (50%)</p>
                                                            <p className="text-lg font-bold text-green-700">
                                                                ₦{Number(job.paymentData?.depositPaid || (job.quoted_price * 0.5)).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-gray-600">Materials Paid (30%)</p>
                                                            <p className="text-lg font-bold text-purple-700">
                                                                ₦{Number(job.paymentData?.intermediatePaid || (job.quoted_price * 0.3)).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-gray-600">Final Payment Due (20%)</p>
                                                            <p className="text-lg font-bold text-blue-700">
                                                                ₦{(job.quoted_price * 0.2).toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="border-t pt-2 mt-2">
                                                            <div className="flex justify-between items-center">
                                                                <p className="font-medium">Total Job Amount:</p>
                                                                <p className="text-xl font-bold text-gray-800">
                                                                    ₦{Number(job.quoted_price).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-indigo-500 text-sm text-center">
                                                    {companyName} will mark the work as completed when done. You'll then pay the final 20% balance.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* WORK COMPLETED - AWAITING CUSTOMER APPROVAL */}
                                    {/* WORK COMPLETED - AWAITING CUSTOMER APPROVAL */}
                                    {status === 'work_completed' && (
                                        <div className="mb-6">
                                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                    </svg>
                                                    <p className="text-orange-700 font-medium">Work Completed!</p>
                                                </div>

                                                <p className="text-orange-600 mb-4">
                                                    {companyName} has marked this job as completed. Please review the work and confirm if you're satisfied.
                                                </p>

                                                <div className="bg-white p-3 rounded-lg border border-orange-100 mb-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-gray-600">Deposit Paid (50%)</p>
                                                            <p className="text-lg font-bold text-blue-700">
                                                                ₦{Number(job.paymentData?.depositPaid || (job.quoted_price * 0.5)).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Show service fee if it was charged */}
                                                        {job.paymentData?.serviceFeePaid > 0 && (
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-gray-600">Service Fee</p>
                                                                <p className="text-sm text-purple-600">
                                                                    ₦{Number(job.paymentData?.serviceFeePaid).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Show intermediate payment if it exists */}
                                                        {job.paymentData?.hasIntermediate && !job.paymentData?.hasFinal && (
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-gray-600">Materials Paid (30%)</p>
                                                                <p className="text-lg font-bold text-purple-700">
                                                                    ₦{Number(job.paymentData?.intermediatePaid).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Final balance */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="text-gray-600 font-bold">
                                                                Final Balance ({job.paymentData?.hasIntermediate ? '20%' : '50%'})
                                                            </p>
                                                            <p className="text-xl font-bold text-naijaGreen">
                                                                ₦{Number(job.paymentData?.balanceDue ||
                                                                    (job.paymentData?.hasIntermediate ? job.quoted_price * 0.2 : job.quoted_price * 0.5)
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Total job amount */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="font-medium">Total Job Amount:</p>
                                                            <p className="text-xl font-bold text-gray-800">
                                                                ₦{Number(job.quoted_price).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Total paid including fees */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="text-gray-600">Total Paid:</p>
                                                            <p className="font-bold text-green-700">
                                                                ₦{Number(job.paymentData?.totalPaidWithFees ||
                                                                    (job.paymentData?.hasIntermediate ? job.quoted_price * 0.8 : job.quoted_price * 0.5)
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* CUSTOMER ACTIONS */}
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => handleApproveWork(job.id, job.quoted_price, companyName)}
                                                        disabled={isProcessing === job.id}
                                                        className="w-full bg-naijaGreen text-white py-3 rounded-lg font-bold hover:bg-darkGreen transition disabled:opacity-50"
                                                    >
                                                        {isProcessing === job.id ? 'Processing...' :
                                                            job.paymentData?.hasIntermediate ? '✅ Work Well Done - Pay 20% Balance' : '✅ Work Well Done - Pay 50% Balance'}
                                                    </button>

                                                    <button
                                                        onClick={() => handleReportWorkIssue(job.id, companyName)}
                                                        disabled={isProcessing === job.id}
                                                        className="w-full bg-white border-2 border-red-600 text-red-600 py-3 rounded-lg font-bold hover:bg-red-50 transition disabled:opacity-50"
                                                    >
                                                        ❌ Report Work Issue
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* WORK DISPUTED - Customer reported issue */}
                                    {status === 'work_disputed' && (
                                        <div className="mb-6">
                                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    <p className="text-red-700 font-medium">Issue Reported</p>
                                                </div>
                                                <p className="text-red-600 mb-4">
                                                    You've reported an issue with the work. {companyName} has been notified and will contact you to arrange fixes.
                                                </p>
                                                {job.dispute_reason && (
                                                    <div className="bg-white p-3 rounded-lg border border-red-100 mb-4">
                                                        <p className="text-sm text-gray-600 mb-1">Your Reported Issue:</p>
                                                        <p className="text-gray-800">{job.dispute_reason}</p>
                                                    </div>
                                                )}
                                                <p className="text-red-500 text-sm">
                                                    Awaiting company to fix the issue. You'll be notified when they mark it as fixed.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* WORK RECTIFIED - Company fixed the issue */}
                                    {status === 'work_rectified' && (
                                        <div className="mb-6">
                                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                    </svg>
                                                    <p className="text-yellow-700 font-medium">Issue Fixed - Please Review</p>
                                                </div>

                                                <p className="text-yellow-600 mb-4">
                                                    {companyName} has addressed your concerns and fixed the work. Please review the fix.
                                                </p>

                                                {job.dispute_reason && (
                                                    <div className="bg-white p-3 rounded-lg border border-yellow-100 mb-4">
                                                        <p className="text-sm text-gray-600 mb-1">Your Reported Issue:</p>
                                                        <p className="text-gray-800">{job.dispute_reason}</p>
                                                    </div>
                                                )}

                                                {/* FIXED: Correct Payment Breakdown */}
                                                {/* FIXED: Correct Payment Breakdown */}
                                                <div className="bg-white p-3 rounded-lg border border-yellow-100 mb-4">
                                                    <div className="space-y-2">
                                                        {/* Deposit - Always 50% */}
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-gray-600">Deposit Paid (50%)</p>
                                                            <p className="text-lg font-bold text-blue-700">
                                                                ₦{Number(job.paymentData?.depositPaid || (job.quoted_price * 0.5)).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Show service fee if it was charged */}
                                                        {job.paymentData?.serviceFeePaid > 0 && (
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-gray-600">Service Fee</p>
                                                                <p className="text-sm text-purple-600">
                                                                    ₦{Number(job.paymentData?.serviceFeePaid).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Intermediate Payment - Only show if it exists and final not paid */}
                                                        {job.paymentData?.hasIntermediate && !job.paymentData?.hasFinal && (
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-gray-600">Materials Paid (30%)</p>
                                                                <p className="text-lg font-bold text-purple-700">
                                                                    ₦{Number(job.paymentData?.intermediatePaid).toLocaleString()}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Final Balance */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="text-gray-600 font-bold">
                                                                Final Balance (
                                                                {(() => {
                                                                    if (job.paymentData?.hasFinal) return '0%';
                                                                    if (job.paymentData?.hasIntermediate) return '20%';
                                                                    return '50%';
                                                                })()}
                                                                )
                                                            </p>
                                                            <p className="text-xl font-bold text-naijaGreen">
                                                                ₦{Number(job.paymentData?.balanceDue).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Total job amount */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="font-medium">Total Job Amount:</p>
                                                            <p className="text-xl font-bold text-gray-800">
                                                                ₦{Number(job.quoted_price).toLocaleString()}
                                                            </p>
                                                        </div>

                                                        {/* Total paid including fees */}
                                                        <div className="flex justify-between items-center pt-2 border-t">
                                                            <p className="text-gray-600">Total Paid:</p>
                                                            <p className="font-bold text-green-700">
                                                                ₦{Number(job.paymentData?.totalPaidWithFees ||
                                                                    (job.paymentData?.hasIntermediate ?
                                                                        (job.quoted_price * 0.8) + (job.paymentData?.serviceFeePaid || 0) :
                                                                        (job.quoted_price * 0.5) + (job.paymentData?.serviceFeePaid || 0)
                                                                    )
                                                                ).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Customer can now approve the fix */}
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => handleApproveWork(job.id, job.quoted_price, companyName)}
                                                        disabled={isProcessing === job.id}
                                                        className="w-full bg-naijaGreen text-white py-3 rounded-lg font-bold hover:bg-darkGreen transition disabled:opacity-50"
                                                    >
                                                        {isProcessing === job.id ? 'Processing...' :
                                                            `✅ Accept Fix & Pay Balance`}
                                                    </button>

                                                    <button
                                                        onClick={() => handleReportWorkIssueAgain(job.id, companyName)}
                                                        disabled={isProcessing === job.id}
                                                        className="w-full bg-white border-2 border-red-600 text-red-600 py-3 rounded-lg font-bold hover:bg-red-50 transition disabled:opacity-50"
                                                    >
                                                        ❌ Still Not Satisfied
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* READY FOR FINAL PAYMENT */}
                                    {status === 'ready_for_final_payment' && (
                                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <p className="text-purple-700 font-medium">Processing Final Payment</p>
                                            </div>
                                            <p className="text-purple-600 text-sm mt-2">
                                                Final payment being processed. You'll be redirected to payment page...
                                            </p>
                                        </div>
                                    )}

                                    {/* AWAITING FINAL PAYMENT */}
                                    {status === 'awaiting_final_payment' && (
                                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <p className="text-purple-700 font-medium">Final Payment in Progress</p>
                                            </div>
                                            <p className="text-purple-600 text-sm mt-2">
                                                Completing final 50% payment...
                                            </p>
                                        </div>
                                    )}

                                    {/* COMPLETED JOB */}
                                    {status === 'completed' && (
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <div>
                                                    <p className="text-green-700 font-medium">Job Completed Successfully!</p>
                                                    <p className="text-green-600 text-sm mt-1">
                                                        Thank you for using Mount. All payments to {companyName} are complete.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* WORK REJECTED */}
                                    {status === 'work_rejected' && (
                                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <div>
                                                    <p className="text-red-700 font-medium">Work Needs Review</p>
                                                    <p className="text-red-600 text-sm mt-1">
                                                        You've reported that you're not satisfied with the work. {companyName} has been notified to review and contact you.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ONSITE FEE REQUESTED - Customer needs to pay fee */}
                                    {job.status === 'onsite_fee_requested' && (
                                        <div className="mb-6">
                                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <p className="text-orange-700 font-medium">Onsite Check Fee Required</p>
                                                </div>

                                                <p className="text-orange-600 mb-4">
                                                    {getCompanyName(job)} needs to visit your location for assessment.
                                                    Please pay the onsite check fee to proceed.
                                                </p>

                                                {/* BANK DETAILS */}
                                                <div className="bg-white p-4 rounded-lg border border-orange-300 mb-4">
                                                    <h4 className="font-bold text-gray-800 mb-2">💳 Send Payment To:</h4>

                                                    {job.onsite_fee_bank_details ? (
                                                        (() => {
                                                            let bankDetails;
                                                            try {
                                                                bankDetails = typeof job.onsite_fee_bank_details === 'string'
                                                                    ? JSON.parse(job.onsite_fee_bank_details)
                                                                    : job.onsite_fee_bank_details;
                                                            } catch (e) {
                                                                bankDetails = null;
                                                            }

                                                            return bankDetails ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Bank:</span>
                                                                        <span className="font-bold text-gray-800">{bankDetails.bank_name}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Account Number:</span>
                                                                        <span className="font-bold text-gray-800">{bankDetails.account_number}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Account Name:</span>
                                                                        <span className="font-bold text-gray-800">{bankDetails.account_name}</span>
                                                                    </div>
                                                                    <div className="flex justify-between border-t pt-2 mt-2">
                                                                        <span className="text-gray-600 font-bold">Amount:</span>
                                                                        <span className="text-xl font-bold text-orange-600">
                                                                            ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-gray-500">Bank details not available. Please contact the company.</p>
                                                            )
                                                        })()
                                                    ) : (
                                                        <p className="text-gray-500">Bank details not available. Please contact the company.</p>
                                                    )}
                                                </div>

                                                {/* IMPORTANT WARNING */}
                                                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                                                    <p className="text-red-700 text-sm font-bold">⚠️ IMPORTANT:</p>
                                                    <p className="text-red-600 text-sm mt-1">
                                                        • Send <strong>ONLY</strong> the onsite check fee ({job.onsite_fee_amount ? `₦${Number(job.onsite_fee_amount).toLocaleString()}` : 'the specified amount'})
                                                    </p>
                                                    <p className="text-red-600 text-sm mt-1">
                                                        • <strong>DO NOT</strong> send job payment directly to this account
                                                    </p>
                                                    <p className="text-red-600 text-sm mt-1">
                                                        • Job payments must be made through the app for escrow protection
                                                    </p>
                                                </div>

                                                {/* PAYMENT ACTIONS */}
                                                <div className="space-y-3">
                                                    <button
                                                        onClick={() => handlePayOnsiteFee(job.id, job.onsite_fee_amount, getCompanyName(job))}
                                                        disabled={isProcessing === job.id}
                                                        className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold hover:bg-orange-700 transition disabled:opacity-50 flex items-center justify-center"
                                                    >
                                                        {isProcessing === job.id ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Processing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="mr-2">✅</span>
                                                                I've Paid ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeclineOnsiteFee(job.id, getCompanyName(job))}
                                                        disabled={isProcessing === job.id}
                                                        className="w-full bg-white border-2 border-gray-400 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition disabled:opacity-50"
                                                    >
                                                        Decline Onsite Check
                                                    </button>
                                                </div>

                                                <p className="text-orange-500 text-sm mt-3 text-center">
                                                    After payment, company will visit your location and provide a quote.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* ONSITE FEE PENDING CONFIRMATION - Waiting for company to confirm */}
                                    {job.status === 'onsite_fee_pending_confirmation' && (
                                        <div className="mb-6">
                                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                                <div className="flex items-center mb-3">
                                                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <p className="text-blue-700 font-medium">Awaiting Company Confirmation</p>
                                                </div>

                                                <p className="text-blue-600 mb-4">
                                                    You've confirmed payment of ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}.
                                                    {getCompanyName(job)} is checking their bank account and will confirm receipt soon.
                                                </p>

                                                <div className="bg-white p-4 rounded-lg border border-blue-300 mb-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-gray-600">Amount Paid:</span>
                                                        <span className="text-xl font-bold text-blue-700">
                                                            ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        Once confirmed, {getCompanyName(job)} will visit your location.
                                                    </p>
                                                </div>

                                                <p className="text-blue-500 text-sm text-center">
                                                    Company has been notified. They will confirm receipt shortly.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {job.status === 'pending' && job.company_id && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="font-medium text-blue-700">
                                                ⏳ Awaiting quote from {getCompanyName(job)}
                                            </p>
                                        </div>
                                    )}

                                    {job.status === 'declined_by_company' && (
                                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <span className="text-xl">❌</span>
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <p className="font-bold text-red-700 text-lg">
                                                        Declined by {getCompanyName(job)}
                                                    </p>

                                                    {/* Display decline reason if available */}
                                                    {job.decline_reason && (
                                                        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                                                            <p className="font-medium text-red-800 text-sm mb-1">Reason provided:</p>
                                                            <p className="text-red-700 whitespace-pre-wrap">{job.decline_reason}</p>
                                                        </div>
                                                    )}

                                                    <p className="text-red-600 mt-3">
                                                        You can post this job again to find another company.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}