// supabase/functions/monnify-webhook/index.ts
// Handles incoming Monnify payment notifications for Mount.
//
// ACTUAL JOB STATUS FLOW:
//   price_set        → deposit paid      → deposit_paid
//   work_ongoing     → intermediate paid → intermediate_paid
//   work_completed   → final paid        → completed
//   work_rectified   → final paid        → completed
//
// COMMISSION:
//   5% of quoted_price deducted from FINAL payment only.
//
// CREDIT WALLET:
//   If customer used credit, the pending financial_transaction row
//   will have metadata.credit_used > 0.
//   Webhook reads this, deducts from credit_wallets, and credits
//   provider with full amount (cash + credit), minus commission.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ── Signature verification ────────────────────────────────────────────────────
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

// ── Determine payment type from job status ────────────────────────────────────
function determinePaymentType(
    jobStatus: string
): { type: 'deposit' | 'intermediate' | 'final_payment'; nextStatus: string } | null {
    switch (jobStatus) {
        case 'price_set':
            return { type: 'deposit', nextStatus: 'deposit_paid' }
        case 'work_ongoing':
            return { type: 'intermediate', nextStatus: 'intermediate_paid' }
        case 'work_completed':
        case 'work_rectified':
            return { type: 'final_payment', nextStatus: 'completed' }
        default:
            return null
    }
}

// ── Main handler ──────────────────────────────────────────────────────────────
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

    if (eventData?.product?.type !== 'RESERVED_ACCOUNT') {
        console.log(`Ignoring product type: ${eventData?.product?.type}`)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    if (eventData?.paymentStatus !== 'PAID') {
        console.log(`Ignoring payment status: ${eventData?.paymentStatus}`)
        return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    const transactionReference = eventData.transactionReference
    const companyId = eventData.product.reference
    const amountPaid = parseFloat(eventData.amountPaid) // cash actually received

    if (!transactionReference || !companyId || !amountPaid) {
        console.error('Missing required fields', { transactionReference, companyId, amountPaid })
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try {
        // ── Duplicate guard ───────────────────────────────────────────────────
        const { data: existingTx } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('reference', transactionReference)
            .eq('status', 'completed')
            .maybeSingle()

        if (existingTx) {
            console.log(`Duplicate transaction ignored: ${transactionReference}`)
            return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 })
        }

        // ── Find active payable job for this company ──────────────────────────
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, status, quoted_price, customer_id, company_id, category')
            .eq('company_id', companyId)
            .in('status', ['price_set', 'work_ongoing', 'work_completed', 'work_rectified'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (jobError || !job) {
            console.error(`No active payable job found for company ${companyId}`, jobError)
            return new Response(
                JSON.stringify({ received: true, warning: 'No matching job found', companyId }),
                { status: 200 }
            )
        }

        const paymentInfo = determinePaymentType(job.status)

        if (!paymentInfo) {
            console.error(`Cannot determine payment type for job status: ${job.status}`)
            return new Response(
                JSON.stringify({ received: true, warning: 'Unhandled job status', status: job.status }),
                { status: 200 }
            )
        }

        const { type: paymentType, nextStatus } = paymentInfo

        // ── Read pending transaction to get credit_used ───────────────────────
        // Customer may have applied credit at checkout — if so, the pending
        // financial_transaction row will have metadata.credit_used set.
        const { data: pendingTx } = await supabase
            .from('financial_transactions')
            .select('id, metadata')
            .eq('job_id', job.id)
            .eq('type', paymentType)
            .eq('status', 'pending')
            .eq('verified_by_admin', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        const creditUsed = parseFloat(pendingTx?.metadata?.credit_used || 0)
        const pendingTxId = pendingTx?.id || null

        // Total amount = cash paid + credit used
        const totalPaymentAmount = parseFloat((amountPaid + creditUsed).toFixed(2))

        console.log(`💳 Payment breakdown: cash=₦${amountPaid} credit=₦${creditUsed} total=₦${totalPaymentAmount}`)

        // ── Commission: 5% of quoted_price on final payment only ──────────────
        let commissionAmount = 0
        let providerCreditAmount = totalPaymentAmount

        if (paymentType === 'final_payment') {
            commissionAmount = parseFloat((job.quoted_price * 0.05).toFixed(2))
            providerCreditAmount = parseFloat((totalPaymentAmount - commissionAmount).toFixed(2))
        }

        // ── Deduct credit from customer wallet ────────────────────────────────
        if (creditUsed > 0) {
            const { data: creditWallet } = await supabase
                .from('credit_wallets')
                .select('id, balance')
                .eq('customer_id', job.customer_id)
                .maybeSingle()

            if (creditWallet) {
                const newBalance = parseFloat(
                    Math.max(0, parseFloat(creditWallet.balance) - creditUsed).toFixed(2)
                )
                const { error: creditDeductError } = await supabase
                    .from('credit_wallets')
                    .update({
                        balance: newBalance,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', creditWallet.id)

                if (creditDeductError) {
                    console.error(`Credit wallet deduction failed: ${creditDeductError.message}`)
                    // Non-fatal — continue processing payment
                } else {
                    console.log(`💳 Credit deducted: ₦${creditUsed} from customer ${job.customer_id} | New balance: ₦${newBalance}`)
                }
            } else {
                console.warn(`Credit wallet not found for customer ${job.customer_id}`)
            }
        }

        // ── Update job status ─────────────────────────────────────────────────
        const { error: jobUpdateError } = await supabase
            .from('jobs')
            .update({
                status: nextStatus,
                payment_verified: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

        if (jobUpdateError) throw new Error(`Job update failed: ${jobUpdateError.message}`)

        // ── Update or insert financial transaction ────────────────────────────
        const txData = {
            job_id: job.id,
            user_id: job.customer_id,
            type: paymentType,
            amount: totalPaymentAmount,
            platform_fee: commissionAmount,
            reference: transactionReference,
            status: 'completed',
            payment_method: 'bank_transfer',
            bank_reference: eventData.paymentReference || null,
            verified_by_admin: true,
            metadata: {
                monnify_transaction_reference: transactionReference,
                monnify_payment_reference: eventData.paymentReference,
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
            // Update the existing pending transaction
            const { error: txUpdateError } = await supabase
                .from('financial_transactions')
                .update(txData)
                .eq('id', pendingTxId)

            if (txUpdateError) throw new Error(`Transaction update failed: ${txUpdateError.message}`)
        } else {
            // Insert new transaction record
            const { error: txError } = await supabase
                .from('financial_transactions')
                .insert(txData)

            if (txError) throw new Error(`Financial transaction insert failed: ${txError.message}`)
        }

        // ── Credit provider wallet ────────────────────────────────────────────
        const { data: existingWallet } = await supabase
            .from('provider_wallets')
            .select('available_balance, total_earned, total_commission')
            .eq('company_id', companyId)
            .maybeSingle()

        if (existingWallet) {
            const { error: walletError } = await supabase
                .from('provider_wallets')
                .update({
                    available_balance: parseFloat((existingWallet.available_balance + providerCreditAmount).toFixed(2)),
                    total_earned: parseFloat((existingWallet.total_earned + providerCreditAmount).toFixed(2)),
                    total_commission: parseFloat((existingWallet.total_commission + commissionAmount).toFixed(2)),
                    updated_at: new Date().toISOString(),
                })
                .eq('company_id', companyId)

            if (walletError) throw new Error(`Wallet update failed: ${walletError.message}`)
        } else {
            const { error: walletCreateError } = await supabase
                .from('provider_wallets')
                .insert({
                    company_id: companyId,
                    available_balance: providerCreditAmount,
                    total_earned: providerCreditAmount,
                    total_commission: commissionAmount,
                    updated_at: new Date().toISOString(),
                })

            if (walletCreateError) throw new Error(`Wallet creation failed: ${walletCreateError.message}`)
        }

        // ── Notifications ─────────────────────────────────────────────────────
        const paymentLabels: Record<string, string> = {
            deposit: 'Deposit payment',
            intermediate: 'Intermediate payment',
            final_payment: 'Final payment',
        }

        const creditNote = creditUsed > 0
            ? ` (includes ₦${creditUsed.toLocaleString()} customer credit)`
            : ''

        await supabase.from('notifications').insert({
            user_id: companyId,
            job_id: job.id,
            type: 'payment_received',
            title: `${paymentLabels[paymentType]} received`,
            message: `₦${providerCreditAmount.toLocaleString()} has been credited to your Mount wallet for job #${job.id.slice(0, 8).toUpperCase()}${creditNote}.${paymentType === 'final_payment'
                    ? ` Platform commission of ₦${commissionAmount.toLocaleString()} has been deducted.`
                    : ''
                }`,
            read: false,
            created_at: new Date().toISOString(),
        })

        await supabase.from('notifications').insert({
            user_id: job.customer_id,
            job_id: job.id,
            type: 'payment_confirmed',
            title: `${paymentLabels[paymentType]} confirmed`,
            message: `Your ${paymentLabels[paymentType].toLowerCase()} of ₦${totalPaymentAmount.toLocaleString()} has been confirmed for job #${job.id.slice(0, 8).toUpperCase()}.${creditUsed > 0 ? ` ₦${creditUsed.toLocaleString()} was covered by your credit wallet.` : ''
                }`,
            read: false,
            created_at: new Date().toISOString(),
        })

        if (paymentType === 'final_payment' && commissionAmount > 0) {
            console.log(`COMMISSION: Job ${job.id} | Quoted: ₦${job.quoted_price} | Commission: ₦${commissionAmount} | Provider receives: ₦${providerCreditAmount}`)
        }

        console.log(`✅ Webhook: ${transactionReference} | Company: ${companyId} | Cash: ₦${amountPaid} | Credit: ₦${creditUsed} | Total: ₦${totalPaymentAmount} | ${job.status} → ${nextStatus}`)

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
        console.error('Webhook processing error:', error)
        return new Response(
            JSON.stringify({ received: true, error: error.message }),
            { status: 200 }
        )
    }
})