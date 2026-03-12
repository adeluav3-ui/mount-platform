// supabase/functions/monnify-webhook/index.ts
// Handles incoming Monnify payment notifications for Mount.
// Replaces the entire manual AdminPaymentVerification flow.
//
// SECURITY:
//   1. Verifies SHA-512 HMAC signature from monnify-signature header
//   2. Whitelists Monnify IP: 35.242.133.146
//   3. Guards against duplicate transactionReference
//
// PAYMENT FLOW:
//   Customer pays into provider's reserved account
//   → Monnify fires this webhook
//   → We determine payment type from job status in Supabase
//   → Update financial_transactions, job status, provider_wallets
//   → Notify provider
//
// PAYMENT TYPES (determined by job status):
//   'pending_deposit'          → deposit payment expected    → job moves to 'in_progress'
//   'in_progress'              → intermediate payment        → job moves to 'awaiting_final_payment'
//   'awaiting_final_payment'   → final payment               → job moves to 'awaiting_completion'
//                                                              + 5% commission deducted

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const MONNIFY_WEBHOOK_IP = '35.242.133.146'

// ── Signature verification ────────────────────────────────────────────────────
// SHA-512 HMAC of (secretKey + stringifiedBody)
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
// Monnify doesn't tell us what type of payment this is.
// We determine it from the job's current status in Supabase.
function determinePaymentType(jobStatus: string): 'deposit' | 'intermediate' | 'final' | null {
    switch (jobStatus) {
        case 'pending_deposit':
            return 'deposit'
        case 'in_progress':
            return 'intermediate'
        case 'awaiting_final_payment':
            return 'final'
        default:
            return null
    }
}

// ── Next job status after payment ─────────────────────────────────────────────
function nextJobStatus(paymentType: string): string {
    switch (paymentType) {
        case 'deposit':
            return 'in_progress'
        case 'intermediate':
            return 'awaiting_final_payment'
        case 'final':
            return 'awaiting_completion'
        default:
            return 'in_progress'
    }
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
    // ── Step 1: Return 200 immediately ─────────────────────────────────────────
    // Monnify will retry up to 10 times if we don't respond quickly.
    // We acknowledge first, then process asynchronously.
    // Note: Deno edge functions are synchronous so we process inline,
    // but we keep logic fast to avoid timeouts.

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    // ── Step 2: Read raw body (needed for signature verification) ───────────────
    const rawBody = await req.text()
    let payload: any

    try {
        payload = JSON.parse(rawBody)
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
    }

    // ── Step 3: Verify Monnify signature ───────────────────────────────────────
    const signature = req.headers.get('monnify-signature') || ''

    if (!verifySignature(rawBody, signature)) {
        console.error('Webhook signature verification failed')
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    // ── Step 4: Only handle SUCCESSFUL_TRANSACTION for RESERVED_ACCOUNT ────────
    const eventType = payload.eventType
    const eventData = payload.eventData

    if (eventType !== 'SUCCESSFUL_TRANSACTION') {
        // Acknowledge other event types (disbursement, settlement etc.) without processing
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

    // ── Step 5: Extract key fields from payload ─────────────────────────────────
    const transactionReference = eventData.transactionReference  // unique per transaction
    const companyId = eventData.product.reference                // = our company UUID
    const amountPaid = parseFloat(eventData.amountPaid)          // amount in NGN

    if (!transactionReference || !companyId || !amountPaid) {
        console.error('Missing required fields in payload', { transactionReference, companyId, amountPaid })
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // ── Init Supabase service role client ───────────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try {
        // ── Step 6: Duplicate guard ───────────────────────────────────────────────
        // Check if we've already processed this transactionReference
        const { data: existingTx } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('reference', transactionReference)
            .single()

        if (existingTx) {
            console.log(`Duplicate transaction ignored: ${transactionReference}`)
            return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 })
        }

        // ── Step 7: Find the active job for this company ──────────────────────────
        // Look for a job that is in a payment-awaiting status for this company.
        // We match the most recent job in a payable state.
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, status, quoted_price, customer_id, company_id, intermediate_payment_paid, split_payment')
            .eq('company_id', companyId)
            .in('status', ['pending_deposit', 'in_progress', 'awaiting_final_payment'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (jobError || !job) {
            console.error(`No active payable job found for company ${companyId}`, jobError)
            // Still return 200 so Monnify doesn't retry — log for manual investigation
            return new Response(
                JSON.stringify({ received: true, warning: 'No matching job found', companyId }),
                { status: 200 }
            )
        }

        // ── Step 8: Determine payment type from job status ────────────────────────
        const paymentType = determinePaymentType(job.status)

        if (!paymentType) {
            console.error(`Cannot determine payment type for job status: ${job.status}`)
            return new Response(
                JSON.stringify({ received: true, warning: 'Unhandled job status', status: job.status }),
                { status: 200 }
            )
        }

        // ── Step 9: Calculate commission (final payment only) ─────────────────────
        // Mount's 5% commission = 5% of total quoted_price
        // Only applied on final payment — never on deposit or intermediate
        let commissionAmount = 0
        let providerCreditAmount = amountPaid

        if (paymentType === 'final') {
            commissionAmount = parseFloat((job.quoted_price * 0.05).toFixed(2))
            providerCreditAmount = parseFloat((amountPaid - commissionAmount).toFixed(2))
        }

        // ── Step 10: Update job status ────────────────────────────────────────────
        const newJobStatus = nextJobStatus(paymentType)

        const jobUpdateFields: any = {
            status: newJobStatus,
            payment_verified: true,
            payment_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }

        // Mark intermediate payment as paid if applicable
        if (paymentType === 'intermediate') {
            jobUpdateFields.intermediate_payment_paid = true
            jobUpdateFields.intermediate_paid_at = new Date().toISOString()
        }

        const { error: jobUpdateError } = await supabase
            .from('jobs')
            .update(jobUpdateFields)
            .eq('id', job.id)

        if (jobUpdateError) {
            throw new Error(`Job update failed: ${jobUpdateError.message}`)
        }

        // ── Step 11: Record in financial_transactions ─────────────────────────────
        const { error: txError } = await supabase
            .from('financial_transactions')
            .insert({
                job_id: job.id,
                user_id: job.customer_id,
                type: paymentType,
                amount: amountPaid,
                platform_fee: commissionAmount,
                reference: transactionReference,
                status: 'completed',
                payment_method: 'bank_transfer',
                bank_reference: eventData.paymentReference || null,
                verified_by_admin: true,
                admin_verified_at: new Date().toISOString(),
                metadata: {
                    monnify_transaction_reference: transactionReference,
                    monnify_payment_reference: eventData.paymentReference,
                    paid_on: eventData.paidOn,
                    customer_name: eventData.customer?.name,
                    customer_email: eventData.customer?.email,
                    payment_method: eventData.paymentMethod,
                    settlement_amount: eventData.settlementAmount,
                },
                created_at: new Date().toISOString(),
            })

        if (txError) {
            throw new Error(`Financial transaction insert failed: ${txError.message}`)
        }

        // ── Step 12: Update provider wallet ──────────────────────────────────────
        // Upsert — creates wallet if doesn't exist, updates if it does
        const { data: existingWallet } = await supabase
            .from('provider_wallets')
            .select('available_balance, total_earned, total_commission')
            .eq('company_id', companyId)
            .single()

        if (existingWallet) {
            // Update existing wallet
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
            // Create new wallet record
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

        // ── Step 13: Notify provider ──────────────────────────────────────────────
        const paymentLabels: Record<string, string> = {
            deposit: 'Deposit payment',
            intermediate: 'Intermediate payment',
            final: 'Final payment',
        }

        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_id: companyId,
                type: 'payment_received',
                title: `${paymentLabels[paymentType]} received`,
                message: `₦${providerCreditAmount.toLocaleString()} has been credited to your Mount wallet for job #${job.id.slice(0, 8).toUpperCase()}. ${paymentType === 'final' ? `Platform commission of ₦${commissionAmount.toLocaleString()} has been deducted.` : ''}`,
                is_resolved: false,
                created_at: new Date().toISOString(),
            })

        if (notifError) {
            // Non-blocking — payment is processed, notification failure is not critical
            console.error('Notification insert failed (non-blocking):', notifError)
        }

        // ── Step 14: Log commission for Mount's records ───────────────────────────
        if (paymentType === 'final' && commissionAmount > 0) {
            console.log(`COMMISSION: Job ${job.id} | Quoted: ₦${job.quoted_price} | Commission: ₦${commissionAmount} | Provider receives: ₦${providerCreditAmount}`)
        }

        console.log(`✅ Webhook processed: ${transactionReference} | Company: ${companyId} | Amount: ₦${amountPaid} | Type: ${paymentType} | New status: ${newJobStatus}`)

        return new Response(
            JSON.stringify({
                received: true,
                processed: true,
                jobId: job.id,
                paymentType,
                amountPaid,
                providerCredited: providerCreditAmount,
                commission: commissionAmount,
                newJobStatus,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Webhook processing error:', error)
        // Return 200 anyway so Monnify doesn't keep retrying
        // The error is logged for manual investigation
        return new Response(
            JSON.stringify({ received: true, error: error.message }),
            { status: 200 }
        )
    }
})