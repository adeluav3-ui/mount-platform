// src/components/company/JobsSection.jsx — REFINED VERSION
import React, { useState, useEffect } from 'react'
import QuoteForm from './QuoteForm'
import { useMessaging } from '../../context/MessagingContext.jsx'
import ChatModal from '../chat/ChatModal'

// ─── CUSTOMER VERIFICATION BADGE ─────────────────────────────────────────────
const CustomerVerificationBadge = ({ verificationLevel, idType }) => {
    const getBadgeDetails = () => {
        switch (verificationLevel) {
            case 'verified':
                return { icon: '✅', text: 'Verified Customer', bgColor: '#D1FAE5', color: '#065F46', tooltip: idType ? `Verified with ${idType}` : 'Verified customer' }
            case 'pending':
                return { icon: '⏳', text: 'Verification Pending', bgColor: '#FEF3C7', color: '#92400E', tooltip: 'Verification under review' }
            default:
                return { icon: '🔒', text: 'Basic Account', bgColor: '#F3F4F6', color: '#4B5563', tooltip: 'Not verified - basic account' }
        }
    }
    const badge = getBadgeDetails()
    return (
        <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: badge.bgColor, color: badge.color }}
            title={badge.tooltip}
        >
            <span>{badge.icon}</span>
            <span>{badge.text}</span>
        </span>
    )
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        pending: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-800 border border-amber-200' },
        onsite_fee_requested: { label: 'Onsite Fee Requested', cls: 'bg-orange-100 text-orange-800 border border-orange-200' },
        onsite_fee_pending_confirmation: { label: 'Awaiting Fee Confirmation', cls: 'bg-sky-100 text-sky-800 border border-sky-200' },
        onsite_fee_paid: { label: 'Onsite Fee Paid', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
        onsite_pending: { label: 'Onsite Pending', cls: 'bg-orange-100 text-orange-800 border border-orange-200' },
        price_set: { label: 'Quote Sent', cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
        deposit_paid: { label: 'Deposit Paid — Active', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
        work_ongoing: { label: 'Awaiting Intermediate Payment', cls: 'bg-blue-100 text-blue-800 border border-blue-200' },
        intermediate_paid: { label: 'Intermediate Paid', cls: 'bg-violet-100 text-violet-800 border border-violet-200' },
        work_completed: { label: 'Work Completed', cls: 'bg-orange-100 text-orange-800 border border-orange-200' },
        work_disputed: { label: 'Disputed', cls: 'bg-red-100 text-red-800 border border-red-200' },
        work_rectified: { label: 'Rectified — Awaiting Review', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
        completed_paid: { label: 'Paid & Completed', cls: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
        declined_by_customer: { label: 'Cancelled by Customer', cls: 'bg-red-100 text-red-800 border border-red-200' },
    }
    const s = map[status] || { label: status?.replace(/_/g, ' ').toUpperCase(), cls: 'bg-gray-100 text-gray-600 border border-gray-200' }
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${s.cls}`}>{s.label}</span>
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function JobsSection({ showJobs, setShowJobs, user, supabase }) {
    const [jobs, setJobs] = useState([])
    const [jobsLoading, setJobsLoading] = useState(false)
    const [jobToQuote, setJobToQuote] = useState(null)
    const [showOnsiteModal, setShowOnsiteModal] = useState(false)
    const [selectedJobForOnsite, setSelectedJobForOnsite] = useState(null)
    const [showDeclineModal, setShowDeclineModal] = useState(false)
    const [selectedJobToDecline, setSelectedJobToDecline] = useState(null)
    const [showChat, setShowChat] = useState(false)
    const { createConversation, setActiveConversation } = useMessaging()

    // ── Load Jobs ─────────────────────────────────────────────────────────────
    const loadJobs = async () => {
        setJobsLoading(true)
        try {
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

            const jobIds = jobsData.map(job => job.id)
            const { data: allPayments, error: paymentsError } = await supabase
                .from('financial_transactions')
                .select('job_id, type, status, verified_by_admin, amount')
                .in('job_id', jobIds)
                .order('created_at', { ascending: false })

            if (paymentsError) console.warn('Could not fetch payments:', paymentsError)

            const paymentMap = {}
            if (allPayments) {
                allPayments.forEach(payment => {
                    if (!paymentMap[payment.job_id]) {
                        paymentMap[payment.job_id] = {
                            hasDeposit: false, hasIntermediate: false, hasFinal: false,
                            depositAmount: 0, intermediateAmount: 0, finalAmount: 0
                        }
                    }
                    if (payment.verified_by_admin && payment.status === 'completed') {
                        if (payment.type === 'deposit') {
                            paymentMap[payment.job_id].hasDeposit = true
                            paymentMap[payment.job_id].depositAmount = payment.amount || 0
                        } else if (payment.type === 'intermediate') {
                            paymentMap[payment.job_id].hasIntermediate = true
                            paymentMap[payment.job_id].intermediateAmount = payment.amount || 0
                        } else if (payment.type === 'final_payment') {
                            paymentMap[payment.job_id].hasFinal = true
                            paymentMap[payment.job_id].finalAmount = payment.amount || 0
                        }
                    }
                })
            }

            const jobsWithDetails = await Promise.all(
                jobsData.map(async (job) => {
                    let customerDetails = null
                    try {
                        const { data: customer } = await supabase
                            .from('customers')
                            .select('customer_name, phone, email, verification_level, id_verified_at, id_type')
                            .eq('id', job.customer_id)
                            .single()
                        customerDetails = customer
                    } catch (error) {
                        console.warn(`Could not fetch customer ${job.customer_id}:`, error)
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('full_name, phone')
                            .eq('id', job.customer_id)
                            .single()
                        if (profile) {
                            customerDetails = { customer_name: profile.full_name, phone: profile.phone, email: job.customer_id }
                        }
                    }
                    return {
                        ...job,
                        customer: customerDetails || { customer_name: 'Unknown Customer', phone: 'N/A', email: 'N/A' },
                        paymentData: paymentMap[job.id] || {
                            hasDeposit: false, hasIntermediate: false, hasFinal: false,
                            depositAmount: 0, intermediateAmount: 0, finalAmount: 0
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

    useEffect(() => {
        if (!showJobs || !user || !supabase) return
        loadJobs()
        const channel = supabase
            .channel('jobs-changes')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'jobs',
                filter: `company_id=eq.${user.id}`
            }, () => loadJobs())
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [showJobs, supabase, user])

    // ── Actions ───────────────────────────────────────────────────────────────
    const markWorkAsCompleted = async (jobId) => {
        if (!window.confirm('Mark this job as completed? This will notify the customer to review the work.')) return
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: 'work_completed', updated_at: new Date().toISOString() })
                .eq('id', jobId)
                .select()
            if (error) throw error

            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('customer_id, category, company_id')
                .eq('id', jobId)
                .single()
            if (jobError) throw jobError
            if (!job) throw new Error('Job not found after update')

            const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    user_id: job.customer_id, job_id: jobId, type: 'work_completed',
                    title: 'Work Completed',
                    message: `Company has marked your ${job.category} job as completed. Please review and approve to release final payment.`,
                    read: false, created_at: new Date().toISOString()
                })
            if (notificationError) throw notificationError

            alert('✅ Job marked as completed! Customer has been notified to review.')
            loadJobs()
        } catch (error) {
            console.error('Error marking work as completed:', error)
            alert(`❌ Failed to mark job as completed. Error: ${error.message || 'Unknown error'}`)
        }
    }

    const requestIntermediatePayment = async (jobId) => {
        const job = jobs.find(j => j.id === jobId)
        if (!job) { alert('Job not found'); return }

        const intermediateAmount = Math.round(job.quoted_price * 0.30)

        if (!window.confirm(
            `Request 30% intermediate payment for materials?\n\n` +
            `This will:\n1. Request ₦${intermediateAmount.toLocaleString()} from customer\n` +
            `2. Notify customer to make payment\n3. Allow you to purchase materials\n\n` +
            `Customer will pay 30% now and 20% upon completion (instead of 50% later).`
        )) return

        try {
            const paymentData = {
                job_id: jobId, user_id: job.customer_id, type: 'intermediate',
                amount: intermediateAmount, platform_fee: 0,
                description: '30% intermediate payment for materials',
                reference: `INT-${jobId.substring(0, 8)}-${Date.now()}`,
                status: 'pending', payment_method: 'bank_transfer',
                bank_reference: `INT-${jobId.substring(0, 8)}-${Date.now()}`,
                verified_by_admin: false, proof_of_payment_url: null, admin_notes: null,
                metadata: {
                    requested_by_company: user.id, company_name: 'Your Company',
                    for_materials: true, requested_at: new Date().toISOString()
                },
                created_at: new Date().toISOString()
            }

            const { error: transactionError } = await supabase
                .from('financial_transactions').insert(paymentData).select().single()
            if (transactionError) throw transactionError

            const { error: jobUpdateError } = await supabase
                .from('jobs')
                .update({ status: 'work_ongoing', updated_at: new Date().toISOString() })
                .eq('id', jobId)
            if (jobUpdateError) throw jobUpdateError

            const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    user_id: job.customer_id, job_id: jobId,
                    type: 'intermediate_payment_requested',
                    title: 'Intermediate Payment Requested',
                    message: `Company has requested a 30% intermediate payment (₦${intermediateAmount.toLocaleString()}) for materials. Please make payment to continue.`,
                    read: false, created_at: new Date().toISOString()
                })
            if (notificationError) console.warn('Notification error:', notificationError)

            alert(`✅ Intermediate payment request sent!\n\nAmount: ₦${intermediateAmount.toLocaleString()}\n\nCustomer has been notified.`)
            loadJobs()
        } catch (error) {
            console.error('Error requesting intermediate payment:', error)
            alert(`❌ Failed to request intermediate payment. Error: ${error.message || 'Unknown error'}`)
        }
    }

    const handleRequestOnsiteCheck = async (jobId) => {
        try {
            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('id, company_name, account_name, bank_name, bank_account, email')
                .eq('id', user.id)
                .single()

            if (companyError || !companyData) {
                alert('Company profile not found. Please complete your company registration first.')
                return
            }
            if (!companyData.bank_name || !companyData.bank_account) {
                alert('Please update your bank details in your company profile before requesting onsite check.')
                return
            }

            const displayAccountName = companyData.account_name || companyData.company_name
            const feeInput = prompt(
                `Enter the onsite check fee amount (in Naira):\n\n` +
                `This fee covers transportation and serves as commitment from the customer.\n\n` +
                `Your bank details:\nBank: ${companyData.bank_name}\nAccount: ${companyData.bank_account}\n` +
                `Account Name: ${displayAccountName}\nCompany Name: ${companyData.company_name}\n\nEnter amount (e.g., 5000):`
            )
            if (!feeInput) return

            const onsiteFee = parseFloat(feeInput)
            if (isNaN(onsiteFee) || onsiteFee <= 0) { alert('Please enter a valid amount.'); return }

            if (!window.confirm(
                `Request onsite check with fee of ₦${onsiteFee.toLocaleString()}?\n\n` +
                `Customer will need to pay this amount directly to your bank account before you visit.`
            )) return

            const accountNameToUse = companyData.account_name || companyData.company_name
            const bankDetailsObj = {
                bank_name: companyData.bank_name, account_number: companyData.bank_account,
                account_name: accountNameToUse, company_name: companyData.company_name
            }

            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'onsite_fee_requested', onsite_fee_requested: true,
                    onsite_fee_amount: onsiteFee,
                    onsite_fee_bank_details: JSON.stringify(bankDetailsObj),
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)
            if (updateError) throw updateError

            const { data: job } = await supabase
                .from('jobs').select('customer_id, category').eq('id', jobId).single()

            if (job?.customer_id) {
                await supabase.from('notifications').insert({
                    user_id: job.customer_id, job_id: jobId, type: 'onsite_fee_requested',
                    title: 'Onsite Check Fee Requested',
                    message: `${companyData.company_name} has requested an onsite check. Please pay ₦${onsiteFee.toLocaleString()} to their bank account to proceed.`,
                    read: false, created_at: new Date().toISOString(),
                    metadata: { fee_amount: onsiteFee, bank_details: bankDetailsObj }
                })
            }
            alert(`✅ Onsite check fee requested!\n\nAmount: ₦${onsiteFee.toLocaleString()}\n\nCustomer has been notified to make payment.`)
            loadJobs()
        } catch (error) {
            console.error('Failed to request onsite check with fee:', error)
            alert('Error requesting onsite check. Please try again.')
        }
    }

    const handleConfirmOnsiteFeeReceipt = async (jobId, feeAmount, customerName) => {
        if (!window.confirm(
            `Confirm that you've received ₦${Number(feeAmount).toLocaleString()} from ${customerName || 'the customer'}?\n\n` +
            `This will:\n1. Mark payment as confirmed\n2. Notify customer\n3. Allow you to visit their location\n\n` +
            `Only confirm if you've verified the payment in your bank account.`
        )) return

        try {
            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    status: 'onsite_fee_paid', onsite_fee_paid: true,
                    onsite_fee_paid_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)
            if (updateError) throw updateError

            const job = jobs.find(j => j.id === jobId)
            if (job?.customer_id) {
                await supabase.from('notifications').insert({
                    user_id: job.customer_id, job_id: jobId,
                    type: 'onsite_fee_confirmed', title: 'Onsite Fee Confirmed ✅',
                    message: `Company has confirmed receipt of your ₦${Number(feeAmount).toLocaleString()} payment. They will visit your location soon.`,
                    read: false, created_at: new Date().toISOString()
                })
            }
            alert(`✅ Payment confirmed! Customer has been notified.\n\nYou can now visit their location.`)
            loadJobs()
        } catch (error) {
            console.error('Error confirming onsite fee:', error)
            alert('Failed to confirm payment. Please try again.')
        }
    }

    const handleReportNoOnsiteFee = async (jobId, feeAmount, customerName) => {
        const reason = prompt(
            `Report that you haven't received ₦${Number(feeAmount).toLocaleString()} yet.\n\n` +
            `Please provide details (optional):\n• Checked account? When?\n• Any issues with the transfer?\n• Instructions for customer?`
        )
        try {
            const job = jobs.find(j => j.id === jobId)
            if (job?.customer_id) {
                await supabase.from('notifications').insert({
                    user_id: job.customer_id, job_id: jobId,
                    type: 'onsite_fee_not_received', title: 'Payment Not Yet Received',
                    message: `Company has not yet received your ₦${Number(feeAmount).toLocaleString()} payment.${reason ? `\n\nNote: ${reason.substring(0, 100)}` : ''}\n\nPlease check with your bank or try again.`,
                    read: false, created_at: new Date().toISOString()
                })
            }
            alert(`Customer notified that payment hasn't been received.${reason ? `\n\nYour note: ${reason}` : ''}`)
        } catch (error) {
            console.error('Error reporting no payment:', error)
            alert('Failed to send notification. Please try again.')
        }
    }

    const createCustomerNotification = async (jobId, notificationType, companyName = '') => {
        try {
            const { data: job } = await supabase
                .from('jobs').select('customer_id, category, sub_service, company_id').eq('id', jobId).single()
            if (!job) return

            let title = ''
            let message = ''
            switch (notificationType) {
                case 'onsite_requested':
                    title = 'Onsite Check Requested'
                    message = `${companyName || 'The company'} has requested to visit your location for assessment before providing a final quote.`
                    break
                case 'job_declined':
                    title = 'Job Declined'
                    message = `${companyName || 'A company'} has declined your "${job.sub_service || job.category}" job. You can post the job again to find another company if you wish.`
                    break
                case 'quote_received':
                    title = 'New Quote Received'
                    message = `${companyName || 'A company'} has sent you a quote for your "${job.sub_service || job.category}" job.`
                    break
                default:
                    title = 'Job Update'
                    message = 'There is an update on your job.'
            }
            await supabase.from('notifications').insert({
                user_id: job.customer_id, job_id: jobId, type: notificationType,
                title, message, read: false, created_at: new Date().toISOString()
            })
        } catch (error) {
            console.error('Failed to create notification:', error)
        }
    }

    const handleDeleteJob = async (jobId, e) => {
        e.stopPropagation()
        const jobToDelete = jobs.find(job => job.id === jobId)
        if (!jobToDelete) return
        setSelectedJobToDecline(jobToDelete)
        setShowDeclineModal(true)
    }

    // ── Modals ────────────────────────────────────────────────────────────────
    const OnsiteCheckModal = () => {
        if (!showOnsiteModal || !selectedJobForOnsite) return null
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🏠</div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Request Onsite Check with Fee</h3>
                            <p className="text-sm text-gray-500">{selectedJobForOnsite.sub_service || selectedJobForOnsite.category}</p>
                        </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                        <p className="text-sm font-semibold text-amber-800 mb-1">💰 Onsite Check Fee</p>
                        <p className="text-sm text-amber-700">You'll be prompted to enter a fee amount. This covers transportation and serves as customer commitment.</p>
                        <p className="text-xs text-amber-600 mt-2">Customer pays this fee directly to your bank account before your visit.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => { setShowOnsiteModal(false); setSelectedJobForOnsite(null) }}
                            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                await handleRequestOnsiteCheck(selectedJobForOnsite.id)
                                setShowOnsiteModal(false)
                                setSelectedJobForOnsite(null)
                            }}
                            className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm"
                        >
                            Continue with Fee
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // BUG FIX: localDeclineReason state is declared inside the modal component
    // so it doesn't reference an undefined outer variable like the original did.
    const DeclineReasonModal = () => {
        if (!showDeclineModal || !selectedJobToDecline) return null

        const [localDeclineReason, setLocalDeclineReason] = useState('')

        const handleConfirmDecline = async () => {
            if (!localDeclineReason.trim()) {
                alert('Please provide a reason for declining this job.')
                return
            }

            const jobToDelete = selectedJobToDecline
            setJobs(prev => prev.filter(job => job.id !== jobToDelete.id))
            setShowDeclineModal(false)
            setSelectedJobToDecline(null)

            try {
                const { data: companyData } = await supabase
                    .from('companies').select('company_name').eq('id', user.id).single()

                const companyName = companyData?.company_name || 'A company'

                const { error } = await supabase
                    .from('jobs')
                    .update({
                        status: 'declined_by_company',
                        decline_reason: localDeclineReason.trim(),
                        declined_by_company_id: user.id,
                        company_id: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', jobToDelete.id)
                    .eq('company_id', user.id)

                if (error) throw error

                await supabase.from('notifications').insert({
                    user_id: jobToDelete.customer_id, job_id: jobToDelete.id,
                    type: 'job_declined', title: 'Job Declined',
                    message: `${companyName} has declined your "${jobToDelete.sub_service || jobToDelete.category}" job.\n\nReason: ${localDeclineReason.trim()}`,
                    metadata: {
                        decline_reason: localDeclineReason.trim(),
                        company_name: companyName,
                        declined_by_company_id: user.id
                    },
                    read: false, created_at: new Date().toISOString()
                })

                alert('Job declined. The customer has been notified with your reason.')
            } catch (err) {
                console.error('Failed to decline job:', err)
                setJobs(prev => [jobToDelete, ...prev.filter(job => job.id !== jobToDelete.id)])
                alert("Error: Failed to decline the job. Please try again. Message: " + err.message)
            }
        }

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Decline Job</h3>
                            <p className="text-sm text-gray-500">{selectedJobToDecline.sub_service || selectedJobToDecline.category}</p>
                        </div>
                    </div>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reason for declining <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={localDeclineReason}
                            onChange={(e) => setLocalDeclineReason(e.target.value)}
                            placeholder="Please provide a reason (e.g., too far from our service area, not our specialty, fully booked, etc.)"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none text-sm"
                            rows={4}
                            autoFocus
                        />
                        <p className="text-xs text-gray-400 mt-1.5">This reason will be shared with the customer.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => { setShowDeclineModal(false); setSelectedJobToDecline(null) }}
                            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDecline}
                            disabled={!localDeclineReason.trim()}
                            className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Decline Job
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!showJobs) return null

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="mt-12 bg-white rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => setShowJobs(false)}
                    className="text-naijaGreen font-bold hover:underline flex items-center gap-2 text-sm sm:text-base"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>
                <button
                    onClick={loadJobs}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-naijaGreen font-medium transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            <OnsiteCheckModal />
            <DeclineReasonModal />

            {jobsLoading ? (
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-naijaGreen border-t-transparent mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading your jobs…</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🛠️</div>
                    <p className="text-lg font-bold text-gray-600">No jobs yet</p>
                    <p className="text-gray-400 mt-1 text-sm">Jobs will appear here when customers send them to you.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {jobs.map(job => (
                        <div key={job.id} className="relative border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-naijaGreen/30 transition-all duration-200">

                            {/* ── Card Header ── */}
                            <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 break-words">
                                            {job.sub_service || job.category}
                                        </h3>
                                        {job.category === 'Logistics Services' && job.logistics_type && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${job.logistics_type === 'pickup' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {job.logistics_type === 'pickup' ? '🔄 Pickup' : '🚚 Delivery'}
                                            </span>
                                        )}
                                    </div>
                                    {job.custom_sub_description && (
                                        <p className="text-xs text-gray-500 italic mb-2">Custom: {job.custom_sub_description}</p>
                                    )}
                                    <StatusBadge status={job.status} />
                                </div>
                                <button
                                    onClick={(e) => handleDeleteJob(job.id, e)}
                                    className="shrink-0 w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-xl transition-colors"
                                    title="Decline Job"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>

                            {/* ── Card Body ── */}
                            <div className="px-4 sm:px-6 py-4 space-y-4">

                                {/* Job Details */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div>
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Location</span>
                                        <p className="text-gray-800 mt-0.5">{job.location || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Address</span>
                                        <p className="text-gray-800 mt-0.5">{job.exact_address || 'Not provided'}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer Budget</span>
                                        <p className="font-bold text-naijaGreen mt-0.5">
                                            {job.budget === 'N/A' || !job.budget || job.budget === '0' ? 'Not specified' : `₦${Number(job.budget).toLocaleString()}`}
                                        </p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Description</span>
                                        <p className="text-gray-700 mt-0.5 break-words">{job.description || 'No description provided'}</p>
                                    </div>
                                </div>

                                {/* Logistics Details */}
                                {job.category === 'Logistics Services' && (
                                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <h4 className="font-bold text-blue-800 text-sm mb-3">📦 Logistics Details</h4>
                                        <div className="space-y-2.5 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-blue-700 w-32 sm:w-36 shrink-0">Service Type:</span>
                                                <span className={`font-bold ${job.logistics_type === 'pickup' ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                    {job.logistics_type === 'pickup' ? '🔄 Pickup' : '🚚 Delivery'}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-medium text-blue-700 w-32 sm:w-36 shrink-0 pt-0.5">Contact Phone:</span>
                                                <div>
                                                    <a href={`tel:${job.logistics_contact_phone}`} className="font-bold text-blue-800 hover:underline">
                                                        {job.logistics_contact_phone || 'N/A'}
                                                    </a>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {job.logistics_type === 'pickup' ? 'Person to pick up from' : 'Person to deliver to'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-medium text-blue-700 w-32 sm:w-36 shrink-0 pt-0.5">
                                                    {job.logistics_type === 'pickup' ? 'Pickup Address:' : 'Delivery Address:'}
                                                </span>
                                                <div>
                                                    <p className="text-gray-800">{job.logistics_other_address || 'N/A'}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {job.logistics_type === 'pickup' ? 'Where to collect package from' : 'Where to deliver package to'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-blue-700 w-32 sm:w-36 shrink-0">Destination Type:</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${job.logistics_destination_type === 'intrastate' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                    {job.logistics_destination_type === 'intrastate' ? '🏠 Within Ogun State' : '🗺️ Outside Ogun State'}
                                                </span>
                                            </div>
                                            {job.logistics_destination_type === 'intrastate' && job.logistics_destination_location && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-blue-700 w-32 sm:w-36 shrink-0">Destination Area:</span>
                                                    <p className="text-gray-800 font-medium">{job.logistics_destination_location}</p>
                                                </div>
                                            )}
                                            {job.logistics_destination_type === 'interstate' && job.logistics_interstate_state && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-blue-700 w-32 sm:w-36 shrink-0">Destination State:</span>
                                                    <p className="text-gray-800 font-medium">{job.logistics_interstate_state}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Customer Contact */}
                                <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                        <p className="font-bold text-gray-800 text-sm">Customer Contact</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {job.customer?.verification_level && (
                                                <CustomerVerificationBadge
                                                    verificationLevel={job.customer.verification_level}
                                                    idType={job.customer.id_type}
                                                />
                                            )}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const conversation = await createConversation(job.customer_id, job.id)
                                                        setActiveConversation(conversation)
                                                        setShowChat(true)
                                                    } catch (error) {
                                                        console.error('Error starting conversation:', error)
                                                        alert('Failed to start conversation. Please try again.')
                                                    }
                                                }}
                                                className="bg-naijaGreen text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-darkGreen transition-colors flex items-center gap-1.5"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                                Message
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5 text-sm">
                                        <p className="text-gray-700"><span className="font-medium text-gray-500">Name:</span> <span className="font-semibold text-gray-800">{job.customer?.customer_name || 'N/A'}</span></p>
                                        <p className="text-gray-700"><span className="font-medium text-gray-500">Phone:</span> <strong className="ml-1 text-gray-900 text-base">{job.customer?.phone || 'Not provided'}</strong></p>
                                        <p className="text-gray-700"><span className="font-medium text-gray-500">Email:</span> {job.customer?.email || 'N/A'}</p>
                                    </div>
                                    {job.customer?.verification_level === 'verified' && job.customer?.id_verified_at && (
                                        <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                                            Verified on: {new Date(job.customer.id_verified_at).toLocaleDateString('en-NG')}
                                        </p>
                                    )}
                                </div>

                                {/* Job Photos */}
                                {job.photos && Array.isArray(job.photos) && job.photos.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                            Job Photos ({job.photos.length})
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {job.photos.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                                    <img
                                                        src={url}
                                                        alt={`Job photo ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = '/default-job-photo.jpg'; e.target.alt = 'Image failed to load' }}
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── STATUS-SPECIFIC ACTION PANELS ── */}

                                {/* PENDING */}
                                {job.status === 'pending' && (
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <button
                                            onClick={() => { setSelectedJobForOnsite(job); setShowOnsiteModal(true) }}
                                            className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            🏠 Request Onsite Check
                                        </button>
                                        <button
                                            onClick={() => setJobToQuote(job)}
                                            className="flex-1 bg-naijaGreen text-white px-4 py-3 rounded-xl font-bold hover:bg-darkGreen transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            📋 Send Quote Now
                                        </button>
                                    </div>
                                )}

                                {/* ONSITE FEE REQUESTED */}
                                {job.status === 'onsite_fee_requested' && (
                                    <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl shrink-0">💰</span>
                                            <div className="flex-1">
                                                <p className="font-bold text-orange-800 text-base">Onsite Check Fee Requested</p>
                                                <p className="text-orange-700 text-sm mt-1">
                                                    You've requested <strong>₦{Number(job.onsite_fee_amount || 0).toLocaleString()}</strong> for the onsite check. Waiting for customer to make payment.
                                                </p>
                                                {job.onsite_fee_bank_details && (() => {
                                                    let bankDetails
                                                    try { bankDetails = typeof job.onsite_fee_bank_details === 'string' ? JSON.parse(job.onsite_fee_bank_details) : job.onsite_fee_bank_details } catch (e) { bankDetails = null }
                                                    return bankDetails ? (
                                                        <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                                                            <p className="font-semibold text-orange-800 text-xs mb-1.5">Bank Details Shared with Customer:</p>
                                                            <div className="text-orange-700 text-xs space-y-1">
                                                                <p><span className="font-medium">Bank:</span> {bankDetails.bank_name}</p>
                                                                <p><span className="font-medium">Account:</span> {bankDetails.account_number}</p>
                                                                <p><span className="font-medium">Name:</span> {bankDetails.account_name}</p>
                                                            </div>
                                                        </div>
                                                    ) : null
                                                })()}
                                                <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                                                    <p className="font-semibold text-gray-700 text-xs mb-1.5">Customer Contact:</p>
                                                    <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {job.customer?.customer_name || 'Customer'}</p>
                                                    <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Phone:</span> <strong className="ml-1 text-orange-700">{job.customer?.phone || 'Check job details'}</strong></p>
                                                    <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Location:</span> {job.location || 'Not specified'}</p>
                                                </div>
                                                <p className="text-xs text-orange-500 mt-2">Customer will confirm payment after transferring the fee. Once confirmed, you can visit their location.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ONSITE FEE PENDING CONFIRMATION */}
                                {job.status === 'onsite_fee_pending_confirmation' && (
                                    <div className="mt-2 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl shrink-0">⏳</span>
                                            <div className="flex-1">
                                                <p className="font-bold text-sky-800 text-base">Payment Claimed — Confirm Receipt</p>
                                                <p className="text-sky-700 text-sm mt-1">
                                                    Customer claims to have paid <strong>₦{Number(job.onsite_fee_amount || 0).toLocaleString()}</strong>. Please check your bank account and confirm.
                                                </p>
                                                <div className="mt-3 p-3 bg-sky-100 border border-sky-200 rounded-lg">
                                                    <p className="font-semibold text-sky-800 text-xs mb-1.5">Payment Details:</p>
                                                    <div className="text-sky-700 text-xs space-y-1">
                                                        <p>• Amount: ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}</p>
                                                        <p>• Check your {job.onsite_fee_bank_details ? (() => { try { const d = typeof job.onsite_fee_bank_details === 'string' ? JSON.parse(job.onsite_fee_bank_details) : job.onsite_fee_bank_details; return d.bank_name || 'bank' } catch { return 'bank' } })() : 'bank'} account</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-3 bg-white rounded-lg border border-sky-200">
                                                    <p className="font-semibold text-gray-700 text-xs mb-1.5">Customer Contact:</p>
                                                    <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {job.customer?.customer_name || 'Customer'}</p>
                                                    <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Phone:</span> <strong className="ml-1 text-sky-700">{job.customer?.phone || 'Check job details'}</strong></p>
                                                    <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Location:</span> {job.location || 'Not specified'}</p>
                                                </div>
                                                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => handleConfirmOnsiteFeeReceipt(job.id, job.onsite_fee_amount, job.customer?.customer_name)}
                                                        className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm"
                                                    >
                                                        ✅ Confirm Payment Received
                                                    </button>
                                                    <button
                                                        onClick={() => handleReportNoOnsiteFee(job.id, job.onsite_fee_amount, job.customer?.customer_name)}
                                                        className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors text-sm"
                                                    >
                                                        ❌ Not Received Yet
                                                    </button>
                                                </div>
                                                <p className="text-xs text-sky-500 mt-2">Only confirm after checking your bank account and verifying the payment.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ONSITE FEE PAID */}
                                {job.status === 'onsite_fee_paid' && (
                                    <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl shrink-0">✅</span>
                                            <div className="flex-1">
                                                <p className="font-bold text-emerald-800 text-base">Onsite Fee Paid — Visit Customer</p>
                                                <p className="text-emerald-700 text-sm mt-1">
                                                    Customer has paid <strong>₦{Number(job.onsite_fee_amount || 0).toLocaleString()}</strong>. You can now visit their location for assessment.
                                                </p>
                                                <div className="mt-3 p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
                                                    <p className="font-semibold text-emerald-800 text-xs mb-1.5">Payment Confirmed:</p>
                                                    <div className="text-emerald-700 text-xs space-y-1">
                                                        <p>• Amount: ₦{Number(job.onsite_fee_amount || 0).toLocaleString()}</p>
                                                        <p>• Paid at: {job.onsite_fee_paid_at ? new Date(job.onsite_fee_paid_at).toLocaleString() : 'Recently'}</p>
                                                        <p>• This is for transportation and commitment fee</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200">
                                                    <p className="font-semibold text-gray-700 text-xs mb-1.5">Visit Details:</p>
                                                    <div className="text-sm text-gray-700 space-y-1">
                                                        <p><span className="font-medium">Customer:</span> {job.customer?.customer_name || 'Customer'}</p>
                                                        <p><span className="font-medium">Phone:</span> <strong className="ml-1 text-emerald-700">{job.customer?.phone || 'Check job details'}</strong></p>
                                                        <p><span className="font-medium">Location:</span> {job.location || 'Not specified'}</p>
                                                        <p><span className="font-medium">Address:</span> {job.exact_address || 'Not provided'}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => setJobToQuote(job)}
                                                        className="flex-1 bg-naijaGreen text-white px-4 py-2.5 rounded-xl font-bold hover:bg-darkGreen transition-colors text-sm"
                                                    >
                                                        Onsite Done — Send Quote
                                                    </button>
                                                    <button
                                                        onClick={() => { if (confirm('Have you visited the location? Click OK only after completing the onsite check.')) { alert('Great! Now send your quote using the button above.') } }}
                                                        className="flex-1 border-2 border-emerald-600 text-emerald-700 px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-colors text-sm"
                                                    >
                                                        Mark as Visited
                                                    </button>
                                                </div>
                                                <p className="text-xs text-emerald-500 mt-2">After visiting, send your quote to the customer.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ONSITE PENDING (old method) */}
                                {job.status === 'onsite_pending' && (
                                    <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <div>
                                                <p className="font-bold text-orange-800 text-sm">Onsite Check Requested (Old Method)</p>
                                                <p className="text-orange-600 text-xs mt-1">Waiting for customer confirmation. Once onsite check is done, send your quote.</p>
                                            </div>
                                            <button
                                                onClick={() => setJobToQuote(job)}
                                                className="bg-naijaGreen text-white px-4 py-2.5 rounded-xl font-bold hover:bg-darkGreen transition-colors text-sm whitespace-nowrap"
                                            >
                                                Onsite Done — Send Quote
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* PRICE SET / QUOTE SENT */}
                                {job.status === 'price_set' && (
                                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="font-bold text-blue-800 text-base">
                                            Quote Sent: ₦{Number(job.quoted_price).toLocaleString()}
                                        </p>
                                        <p className="text-blue-600 text-sm mt-1">Waiting for customer to accept and pay 50% deposit…</p>
                                        {job.company_notes && (
                                            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">Your Notes:</p>
                                                <p className="text-blue-700 text-sm break-words">{job.company_notes}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* QUOTE FORM (inline) */}
                                {jobToQuote?.id === job.id && (
                                    <div className="mt-2 border border-gray-200 rounded-xl p-4">
                                        <QuoteForm
                                            jobId={jobToQuote.id}
                                            companyId={user?.id}
                                            onQuoteSubmitted={() => { setJobToQuote(null); loadJobs() }}
                                            onCancel={() => setJobToQuote(null)}
                                        />
                                    </div>
                                )}

                                {/* DEPOSIT PAID */}
                                {job.status === 'deposit_paid' && (
                                    <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <p className="font-bold text-emerald-800 text-base">Deposit Paid — Work Ongoing!</p>
                                        <p className="text-sm mt-1.5">Agreed Price: <strong>₦{Number(job.quoted_price).toLocaleString()}</strong></p>
                                        <p className="text-sm font-bold mt-1">Customer Phone: <span className="text-emerald-700">{job.customer?.phone || 'N/A'}</span></p>
                                        <div className="mt-3 p-3 bg-emerald-100 border border-emerald-200 rounded-lg">
                                            <p className="font-bold text-emerald-700 text-xs mb-2">Payment Structure:</p>
                                            <div className="text-xs text-emerald-700 space-y-1">
                                                <p>✅ 50% Deposit: ₦{(job.quoted_price * 0.5).toLocaleString()} (Paid)</p>
                                                {job.paymentData?.hasIntermediate ? (
                                                    <p>⏳ 30% Intermediate: ₦{(job.quoted_price * 0.3).toLocaleString()} (Already requested)</p>
                                                ) : (
                                                    <p>⏳ Remaining Balance: ₦{(job.quoted_price * 0.5).toLocaleString()} (50%)</p>
                                                )}
                                                <p className="font-semibold mt-2">Options for remaining balance:</p>
                                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                                    <li>Request 30% now for materials</li>
                                                    <li>Complete work and get 50% final payment</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {!job.paymentData?.hasIntermediate && (
                                                <button
                                                    onClick={() => requestIntermediatePayment(job.id)}
                                                    className="bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <span>💰</span><span>Request 30% for Materials</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => markWorkAsCompleted(job.id)}
                                                className="bg-orange-500 text-white py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                            >
                                                <span>✅</span><span>Mark Work as Completed</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 text-center">Need materials? Request 30% advance. Otherwise, mark as completed when done.</p>
                                    </div>
                                )}

                                {/* WORK ONGOING (intermediate requested, waiting for customer) */}
                                {job.status === 'work_ongoing' && (
                                    <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl shrink-0">⏳</span>
                                            <div className="flex-1">
                                                <p className="font-bold text-blue-800 text-base">Intermediate Payment Requested</p>
                                                <p className="text-blue-700 text-sm mt-1">
                                                    You have requested a 30% intermediate payment (<strong>₦{(job.quoted_price * 0.30).toLocaleString()}</strong>) for materials.
                                                </p>
                                                <p className="text-sm font-bold mt-2">Customer Phone: <span className="text-blue-700">{job.customer?.phone || 'N/A'}</span></p>
                                                <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                                                    <p className="font-semibold text-blue-800 text-xs mb-1.5">Waiting for customer to pay:</p>
                                                    <div className="text-blue-700 text-xs space-y-1">
                                                        <p>• 30% Intermediate: ₦{(job.quoted_price * 0.30).toLocaleString()} (for materials)</p>
                                                        <p>• Remaining after payment: 20% final payment</p>
                                                        <p className="mt-1">Once customer pays, you'll receive a notification to purchase materials.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={true}
                                                    className="mt-3 w-full bg-blue-300 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm cursor-not-allowed opacity-60"
                                                >
                                                    <span>⏳</span><span>Waiting for Intermediate Payment</span>
                                                </button>
                                                <p className="text-xs text-blue-500 mt-1 text-center">You can mark work as completed after customer pays the intermediate payment.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* INTERMEDIATE PAID */}
                                {job.status === 'intermediate_paid' && (
                                    <div className="mt-2 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl shrink-0">💰</span>
                                            <div className="flex-1">
                                                <p className="font-bold text-violet-800 text-base">Intermediate Payment Received!</p>
                                                <p className="text-violet-700 text-sm mt-1">
                                                    Customer has paid 30% intermediate payment {
                                                        job.paymentData?.intermediateAmount > 0
                                                            ? `(₦${Number(job.paymentData.intermediateAmount).toLocaleString()})`
                                                            : `(₦${(job.quoted_price * 0.30).toLocaleString()})`
                                                    } for materials.
                                                </p>
                                                <p className="text-sm font-bold mt-2">Customer Phone: <span className="text-violet-700">{job.customer?.phone || 'N/A'}</span></p>
                                                <div className="mt-3 p-3 bg-violet-100 border border-violet-200 rounded-lg">
                                                    <p className="font-semibold text-violet-800 text-xs mb-1.5">Payment Status:</p>
                                                    <div className="text-violet-700 text-xs space-y-1">
                                                        <p>✅ 50% Deposit: {job.paymentData?.depositAmount > 0 ? `₦${Number(job.paymentData.depositAmount).toLocaleString()}` : `₦${(job.quoted_price * 0.5).toLocaleString()}`} (Paid)</p>
                                                        <p>✅ 30% Intermediate: {job.paymentData?.intermediateAmount > 0 ? `₦${Number(job.paymentData.intermediateAmount).toLocaleString()}` : `₦${(job.quoted_price * 0.30).toLocaleString()}`} (Paid for materials)</p>
                                                        <p>⏳ 20% Final: ₦{(job.quoted_price * 0.20).toLocaleString()} (Due upon completion)</p>
                                                        <p className="font-bold mt-1.5">You can now purchase materials and continue work.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => markWorkAsCompleted(job.id)}
                                                    className="mt-3 w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm"
                                                >
                                                    <span>✅</span><span>Mark Work as Completed</span>
                                                </button>
                                                <p className="text-xs text-violet-500 mt-1 text-center">After completion, customer will pay the final 20% balance.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* WORK COMPLETED */}
                                {job.status === 'work_completed' && (
                                    <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <p className="font-bold text-orange-800 text-base">Work Marked as Completed!</p>
                                        <p className="text-sm mt-1">Waiting for customer to review and approve final payment.</p>
                                        <p className="text-sm font-bold mt-2">
                                            Balance Due: <span className="text-orange-700">
                                                {job.paymentData?.hasIntermediate
                                                    ? `₦${(job.quoted_price * 0.2).toLocaleString()} (20%)`
                                                    : `₦${(job.quoted_price * 0.5).toLocaleString()} (50%)`}
                                            </span>
                                        </p>
                                        <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                                            <p className="font-semibold text-orange-800 text-xs mb-1.5">Payment Summary:</p>
                                            <div className="text-orange-700 text-xs space-y-1">
                                                <p>✅ 50% Deposit: ₦{(job.quoted_price * 0.5).toLocaleString()} (Paid)</p>
                                                {job.paymentData?.hasIntermediate && (
                                                    <p>✅ 30% Intermediate: ₦{(job.quoted_price * 0.3).toLocaleString()} (Paid)</p>
                                                )}
                                                <p>⏳ Final Balance: {job.paymentData?.hasIntermediate ? `₦${(job.quoted_price * 0.2).toLocaleString()} (20%)` : `₦${(job.quoted_price * 0.5).toLocaleString()} (50%)`}</p>
                                            </div>
                                        </div>
                                        {job.paymentData?.depositAmount > 0 && (
                                            <p className="text-xs text-gray-500 mt-2">Actual deposit received: ₦{Number(job.paymentData.depositAmount).toLocaleString()}</p>
                                        )}
                                        {job.paymentData?.intermediateAmount > 0 && (
                                            <p className="text-xs text-gray-500 mt-1">Actual intermediate received: ₦{Number(job.paymentData.intermediateAmount).toLocaleString()}</p>
                                        )}
                                    </div>
                                )}

                                {/* DECLINED BY CUSTOMER */}
                                {job.status === 'declined_by_customer' && (
                                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <p className="font-bold text-red-700 text-base">Job Cancelled by Customer</p>
                                    </div>
                                )}

                                {/* COMPLETED PAID */}
                                {job.status === 'completed_paid' && (
                                    <div className="mt-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                        <p className="font-bold text-emerald-700 text-base">🏆 Payment Finalized!</p>
                                        <p className="text-sm mt-1">Total Earned: <strong className="text-emerald-700">₦{Number(job.quoted_price || 0).toLocaleString()}</strong></p>
                                    </div>
                                )}

                                {/* WORK DISPUTED */}
                                {job.status === 'work_disputed' && (
                                    <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl shrink-0">⚠️</span>
                                            <div className="flex-1">
                                                <p className="font-bold text-red-800 text-base">Customer Reported Issue</p>
                                                <p className="text-red-700 text-sm mt-1">Customer is not satisfied with the work and has requested a review.</p>
                                                {job.dispute_reason && (
                                                    <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                                                        <p className="font-semibold text-red-800 text-xs mb-1">Customer's Issue:</p>
                                                        <p className="text-red-700 text-sm break-words">{job.dispute_reason}</p>
                                                    </div>
                                                )}
                                                <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
                                                    <p className="font-semibold text-gray-700 text-xs mb-1.5">Customer Contact:</p>
                                                    <p className="text-sm text-gray-700"><span className="font-medium">Name:</span> {job.customer?.customer_name || 'Customer'}</p>
                                                    <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Phone:</span> <strong className="ml-1 text-red-700">{job.customer?.phone || 'Check job details'}</strong></p>
                                                </div>
                                                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            const companyNameToUse = job.company_name || job.companies?.company_name || 'Your company'
                                                            if (!confirm('Have you contacted the customer and fixed the issue?\n\nThis will mark the work as rectified and notify the customer to review.')) return
                                                            try {
                                                                const { error } = await supabase
                                                                    .from('jobs')
                                                                    .update({
                                                                        status: 'work_rectified',
                                                                        company_notes: `Issue addressed: ${job.dispute_reason?.substring(0, 100)}...`,
                                                                        updated_at: new Date().toISOString()
                                                                    })
                                                                    .eq('id', job.id)
                                                                if (error) throw error
                                                                await supabase.from('notifications').insert({
                                                                    user_id: job.customer_id, job_id: job.id,
                                                                    type: 'work_rectified', title: 'Issue Fixed ✅',
                                                                    message: `${companyNameToUse} has addressed your concerns and fixed the work. Please review and approve for final payment.`,
                                                                    read: false
                                                                })
                                                                alert('Work marked as fixed! Customer has been notified to review.')
                                                                loadJobs()
                                                            } catch (error) {
                                                                console.error('Error marking work as fixed:', error)
                                                                alert('Failed to update status. Please try again.')
                                                            }
                                                        }}
                                                        className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm"
                                                    >
                                                        ✅ Issue Fixed — Notify Customer
                                                    </button>
                                                    <button
                                                        onClick={() => { const notes = prompt('Add internal notes about this dispute:'); if (notes) { alert('Notes saved. Continue working with customer.') } }}
                                                        className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
                                                    >
                                                        📝 Add Notes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* WORK RECTIFIED */}
                                {job.status === 'work_rectified' && (
                                    <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl shrink-0">🔄</span>
                                            <div>
                                                <p className="font-bold text-amber-800 text-base">Waiting for Customer Review</p>
                                                <p className="text-amber-700 text-sm mt-1">You've fixed the reported issue. Waiting for customer to review and approve final payment.</p>
                                                <p className="text-xs text-amber-600 mt-2">Customer will be prompted to pay the remaining balance.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>{/* end card body */}
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