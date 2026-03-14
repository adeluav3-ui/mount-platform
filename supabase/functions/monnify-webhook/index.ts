// supabase/functions/monnify-webhook/index.ts
// Handles incoming Monnify payment notifications for Mount.
//
// PAYMENT GATEWAY FLOW (new):
//   Reference format: MT-{jobId8}-{typeCode}-{companyId8}-{timestamp6}
//   typeCode: D=deposit, I=intermediate, F=final_payment
//   Webhook parses reference → finds job + company → credits wallet
//
// JOB STATUS FLOW:
//   price_set        → deposit paid      → deposit_paid
//   work_ongoing     → intermediate paid → intermediate_paid
//   work_completed   → final paid        → completed
//   work_rectified   → final paid        → completed
//
// COMMISSION: 5% of quoted_price on FINAL payment only.
// CREDIT WALLET: reads metadata.credit_used from pending transaction.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const TYPE_CODE_MAP: Record<string, 'deposit' | 'intermediate' | 'final_payment'> = {
    D: 'deposit',
    I: 'intermediate',
    F: 'final_payment',
}

const NEXT_STATUS_MAP: Record<string, string> = {
    deposit: 'deposit_paid',
    intermediate: 'intermediate_paid',
    final_payment: 'completed',
}

function verifySignature(rawBody: string, signature: string): boolean {
    try {
        const computed = createHmac('sha512', MONNIFY_SECRET_KEY)
            .update(rawBody)
            .digest('hex')
        return computed === signature
    } catch {
        return false
    }
}

function parseReference(ref: string): {
    jobIdPrefix: string
    paymentType: 'deposit' | 'intermediate' | 'final_payment'
    companyIdPrefix: string
} | null {
    if (!ref || !ref.startsWith('MT-')) return null
    const parts = ref.split('-')
    if (parts.length !== 5) return null
    const [, jobIdPrefix, typeCode, companyIdPrefix] = parts
    const paymentType = TYPE_CODE_MAP[typeCode]
    if (!paymentType || !jobIdPrefix || !companyIdPrefix) return null
    return { jobIdPrefix, paymentType, companyIdPrefix }
}

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const rawBody = await req.text()
    let payload: any

    try {
        payload = JSON.parse(rawBody)
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
    }

    const signature = req.headers.get('monnify-signature') || ''
    if (!verifySignature(rawBody, signature)) {
        console.error('Webhook signature verification failed')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    const eventType = payload.eventType
    const eventData = payload.eventData

    if (eventType !== 'SUCCESSFUL_TRANSACTION') {
        console.log(`Ignoring event type: ${eventType}`)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    if (eventData?.paymentStatus !== 'PAID') {
        console.log(`Ignoring payment status: ${eventData?.paymentStatus}`)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    const paymentReference = eventData.paymentReference
    const amountPaid = parseFloat(eventData.amountPaid)

    if (!paymentReference || !amountPaid) {
        console.error('Missing required fields', { paymentReference, amountPaid })
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const parsed = parseReference(paymentReference)

    if (!parsed) {
        console.log(`Ignoring non-Mount reference: ${paymentReference}`)
        return new Response(JSON.stringify({ received: true, skipped: true }), { status: 200 })
    }

    const { jobIdPrefix, paymentType, companyIdPrefix } = parsed
    const nextStatus = NEXT_STATUS_MAP[paymentType]

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try {
        // Duplicate guard
        const { data: existingTx } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('reference', paymentReference)
            .eq('status', 'completed')
            .maybeSingle()

        if (existingTx) {
            console.log(`Duplicate ignored: ${paymentReference}`)
            return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 })
        }

        // Find pending transaction by reference first — it has the full job_id and company_id
        const { data: pendingTx } = await supabase
            .from('financial_transactions')
            .select('id, job_id, metadata')
            .eq('reference', paymentReference)
            .eq('status', 'pending')
            .maybeSingle()

        const creditUsed = parseFloat(pendingTx?.metadata?.credit_used || 0)
        const pendingTxId = pendingTx?.id || null

        // Get job_id and company_id from pending transaction metadata or prefix fallback
        const jobIdFromTx = pendingTx?.metadata?.job_id || null
        const companyIdFromTx = pendingTx?.metadata?.company_id || null

        // Find job — use full ID from transaction if available
        let job: any = null
        let jobError: any = null

        if (jobIdFromTx) {
            const res = await supabase
                .from('jobs')
                .select('id, status, quoted_price, customer_id, company_id, category, description')
                .eq('id', jobIdFromTx)
                .maybeSingle()
            job = res.data
            jobError = res.error
        } else {
            // Fallback: cast UUID to text for prefix search
            const res = await supabase
                .from('jobs')
                .select('id, status, quoted_price, customer_id, company_id, category, description')
                .filter('id::text', 'ilike', `${jobIdPrefix}%`)
                .maybeSingle()
            job = res.data
            jobError = res.error
        }

        if (jobError || !job) {
            console.error(`No job found with prefix ${jobIdPrefix}`, jobError)
            return new Response(
                JSON.stringify({ received: true, warning: 'Job not found', jobIdPrefix }),
                { status: 200 }
            )
        }

        const companyId = companyIdFromTx || job.company_id

        const totalPaymentAmount = parseFloat((amountPaid + creditUsed).toFixed(2))

        console.log(`💳 Payment: cash=₦${amountPaid} credit=₦${creditUsed} total=₦${totalPaymentAmount}`)

        // Commission: 5% on final payment only
        let commissionAmount = 0
        let providerCreditAmount = totalPaymentAmount

        if (paymentType === 'final_payment') {
            commissionAmount = parseFloat((job.quoted_price * 0.05).toFixed(2))
            providerCreditAmount = parseFloat((totalPaymentAmount - commissionAmount).toFixed(2))
        }

        // Deduct credit from customer wallet
        if (creditUsed > 0) {
            const { data: creditWallet } = await supabase
                .from('credit_wallets')
                .select('id, balance')
                .eq('customer_id', job.customer_id)
                .maybeSingle()

            if (creditWallet) {
                const newBalance = Math.max(0, parseFloat(creditWallet.balance) - creditUsed)
                await supabase
                    .from('credit_wallets')
                    .update({ balance: parseFloat(newBalance.toFixed(2)), updated_at: new Date().toISOString() })
                    .eq('id', creditWallet.id)
                console.log(`💳 Credit deducted: ₦${creditUsed} | New balance: ₦${newBalance}`)
            }
        }

        // Update job status
        await supabase
            .from('jobs')
            .update({ status: nextStatus, payment_verified: true, updated_at: new Date().toISOString() })
            .eq('id', job.id)

        // Update or insert financial transaction
        const txData = {
            job_id: job.id,
            user_id: job.customer_id,
            type: paymentType,
            amount: totalPaymentAmount,
            platform_fee: commissionAmount,
            reference: paymentReference,
            status: 'completed',
            payment_method: 'monnify_gateway',
            bank_reference: eventData.transactionReference || null,
            verified_by_admin: true,
            metadata: {
                monnify_transaction_reference: eventData.transactionReference,
                monnify_payment_reference: paymentReference,
                paid_on: eventData.paidOn,
                customer_name: eventData.customer?.name,
                customer_email: eventData.customer?.email,
                payment_method: eventData.paymentMethod,
                settlement_amount: eventData.settlementAmount,
                credit_used: creditUsed,
                cash_paid: amountPaid,
            },
            created_at: new Date().toISOString(),
        }

        if (pendingTxId) {
            await supabase.from('financial_transactions').update(txData).eq('id', pendingTxId)
        } else {
            await supabase.from('financial_transactions').insert(txData)
        }

        // Credit provider wallet
        const { data: existingWallet } = await supabase
            .from('provider_wallets')
            .select('available_balance, total_earned, total_commission')
            .eq('company_id', companyId)
            .maybeSingle()

        if (existingWallet) {
            await supabase
                .from('provider_wallets')
                .update({
                    available_balance: parseFloat((existingWallet.available_balance + providerCreditAmount).toFixed(2)),
                    total_earned: parseFloat((existingWallet.total_earned + providerCreditAmount).toFixed(2)),
                    total_commission: parseFloat((existingWallet.total_commission + commissionAmount).toFixed(2)),
                    updated_at: new Date().toISOString(),
                })
                .eq('company_id', companyId)
        } else {
            await supabase
                .from('provider_wallets')
                .insert({
                    company_id: companyId,
                    available_balance: providerCreditAmount,
                    total_earned: providerCreditAmount,
                    total_commission: commissionAmount,
                    updated_at: new Date().toISOString(),
                })
        }

        // Notifications
        const paymentLabels: Record<string, string> = {
            deposit: 'Deposit payment',
            intermediate: 'Intermediate payment',
            final_payment: 'Final payment',
        }

        const creditNote = creditUsed > 0 ? ` (includes ₦${creditUsed.toLocaleString()} credit)` : ''

        await supabase.from('notifications').insert([
            {
                user_id: companyId,
                job_id: job.id,
                type: 'payment_received',
                title: `${paymentLabels[paymentType]} received`,
                message: `₦${providerCreditAmount.toLocaleString()} credited to your wallet for job #${job.id.slice(0, 8).toUpperCase()}${creditNote}.${paymentType === 'final_payment' ? ` Commission of ₦${commissionAmount.toLocaleString()} deducted.` : ''}`,
                read: false,
                created_at: new Date().toISOString(),
            },
            {
                user_id: job.customer_id,
                job_id: job.id,
                type: 'payment_confirmed',
                title: `${paymentLabels[paymentType]} confirmed`,
                message: `Your payment of ₦${totalPaymentAmount.toLocaleString()} has been confirmed for job #${job.id.slice(0, 8).toUpperCase()}.${creditUsed > 0 ? ` ₦${creditUsed.toLocaleString()} was from your credit wallet.` : ''}`,
                read: false,
                created_at: new Date().toISOString(),
            },
        ])

        console.log(`✅ ${paymentReference} | job=${job.id} | ${job.status}→${nextStatus} | cash=₦${amountPaid} credit=₦${creditUsed} provider=₦${providerCreditAmount} commission=₦${commissionAmount}`)

        return new Response(
            JSON.stringify({
                received: true,
                processed: true,
                jobId: job.id,
                paymentType,
                cashPaid: amountPaid,
                creditUsed,
                totalPaymentAmount,
                providerCredited: providerCreditAmount,
                commission: commissionAmount,
                previousStatus: job.status,
                newJobStatus: nextStatus,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ received: true, error: error.message }),
            { status: 200 }
        )
    }
})