// supabase/functions/monnify-webhook/index.ts
// Handles incoming Monnify payment notifications for Mount.
//
// ACTUAL JOB STATUS FLOW (from JobsSection.jsx + MyJobs.jsx):
//
//   price_set
//     → customer accepts quote, pays deposit via Monnify
//     → webhook fires → status becomes: deposit_paid
//
//   deposit_paid
//     → company requests intermediate → status: work_ongoing
//     → OR company marks complete → status: work_completed
//
//   work_ongoing
//     → customer pays intermediate via Monnify
//     → webhook fires → status becomes: intermediate_paid
//
//   intermediate_paid
//     → company marks complete → status: work_completed
//
//   work_completed / work_rectified
//     → customer approves and pays final via Monnify
//     → webhook fires → status becomes: completed
//
// COMMISSION:
//   5% of quoted_price deducted from FINAL payment only.
//   Deposit and intermediate: full amount credited to provider wallet.

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
    const amountPaid = parseFloat(eventData.amountPaid)

    if (!transactionReference || !companyId || !amountPaid) {
        console.error('Missing required fields', { transactionReference, companyId, amountPaid })
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    try {
        // Duplicate guard
        const { data: existingTx } = await supabase
            .from('financial_transactions')
            .select('id')
            .eq('reference', transactionReference)
            .maybeSingle()

        if (existingTx) {
            console.log(`Duplicate transaction ignored: ${transactionReference}`)
            return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 })
        }

        // Find the active payable job for this company
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('id, status, quoted_price, customer_id, company_id')
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

        // Commission: 5% of quoted_price on final payment only
        let commissionAmount = 0
        let providerCreditAmount = amountPaid

        if (paymentType === 'final_payment') {
            commissionAmount = parseFloat((job.quoted_price * 0.05).toFixed(2))
            providerCreditAmount = parseFloat((amountPaid - commissionAmount).toFixed(2))
        }

        // Update job status
        const { error: jobUpdateError } = await supabase
            .from('jobs')
            .update({
                status: nextStatus,
                payment_verified: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', job.id)

        if (jobUpdateError) throw new Error(`Job update failed: ${jobUpdateError.message}`)

        // Record financial transaction
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

        if (txError) throw new Error(`Financial transaction insert failed: ${txError.message}`)

        // Credit provider wallet immediately
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

        // Notify provider
        const paymentLabels: Record<string, string> = {
            deposit: 'Deposit payment',
            intermediate: 'Intermediate payment',
            final_payment: 'Final payment',
        }

        await supabase.from('notifications').insert({
            user_id: companyId,
            job_id: job.id,
            type: 'payment_received',
            title: `${paymentLabels[paymentType]} received`,
            message: `₦${providerCreditAmount.toLocaleString()} has been credited to your Mount wallet for job #${job.id.slice(0, 8).toUpperCase()}.${paymentType === 'final_payment'
                ? ` Platform commission of ₦${commissionAmount.toLocaleString()} has been deducted.`
                : ''
                }`,
            read: false,
            created_at: new Date().toISOString(),
        })

        // Notify customer
        await supabase.from('notifications').insert({
            user_id: job.customer_id,
            job_id: job.id,
            type: 'payment_confirmed',
            title: `${paymentLabels[paymentType]} confirmed`,
            message: `Your ${paymentLabels[paymentType].toLowerCase()} of ₦${amountPaid.toLocaleString()} has been confirmed for job #${job.id.slice(0, 8).toUpperCase()}.`,
            read: false,
            created_at: new Date().toISOString(),
        })

        if (paymentType === 'final_payment' && commissionAmount > 0) {
            console.log(`COMMISSION: Job ${job.id} | Quoted: ₦${job.quoted_price} | Commission: ₦${commissionAmount} | Provider receives: ₦${providerCreditAmount}`)
        }

        console.log(`✅ Webhook: ${transactionReference} | Company: ${companyId} | ₦${amountPaid} | ${job.status} → ${nextStatus}`)

        return new Response(
            JSON.stringify({
                received: true,
                processed: true,
                jobId: job.id,
                paymentType,
                amountPaid,
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