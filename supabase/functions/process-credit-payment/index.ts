// supabase/functions/process-credit-payment/index.ts
// Handles fully-covered-by-credit job payments.
// Called from PaymentPage when isFullyCoveredByCredit is true.
// Runs with service role to bypass RLS on credit_wallets and provider_wallets.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const {
            jobId,
            customerId,
            companyId,
            transactionId,
            paymentAmount,   // full payment amount (= creditApplied since fully covered)
            creditApplied,
            dbPaymentType,   // deposit | intermediate | final_payment
            jobStatus,       // current job status (to determine nextStatus)
            jobDescription,
            companyName,
            quotedPrice,     // needed for commission calculation
        } = await req.json()

        if (!jobId || !customerId || !companyId || !transactionId || !paymentAmount || !dbPaymentType) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // ── 1. Deduct from credit wallet ──────────────────────────────────────
        const { data: creditWallet, error: cwError } = await supabase
            .from('credit_wallets')
            .select('id, balance')
            .eq('customer_id', customerId)
            .maybeSingle()

        if (cwError) throw new Error(`Credit wallet fetch failed: ${cwError.message}`)
        if (!creditWallet) throw new Error('Credit wallet not found for customer')

        const newCreditBalance = Math.max(0, parseFloat(creditWallet.balance) - creditApplied)
        const newMonthlyUsed = parseFloat((parseFloat(creditWallet.monthly_used || 0) + creditApplied).toFixed(2))

        const { error: cwUpdateError } = await supabase
            .from('credit_wallets')
            .update({
                balance: parseFloat(newCreditBalance.toFixed(2)),
                monthly_used: newMonthlyUsed,
                updated_at: new Date().toISOString(),
            })
            .eq('id', creditWallet.id)

        if (cwUpdateError) throw new Error(`Credit wallet deduction failed: ${cwUpdateError.message}`)

        console.log(`💳 Credit deducted: ₦${creditApplied} | New balance: ₦${newCreditBalance} | Monthly used: ₦${newMonthlyUsed}`)

        // ── 2. Calculate commission and provider credit ───────────────────────
        const isFinalPayment = dbPaymentType === 'final_payment'
        const commission = isFinalPayment ? parseFloat((quotedPrice * 0.05).toFixed(2)) : 0
        const providerCredit = parseFloat((paymentAmount - commission).toFixed(2))

        // ── 3. Credit provider wallet ─────────────────────────────────────────
        const { data: providerWallet, error: pwError } = await supabase
            .from('provider_wallets')
            .select('available_balance, total_earned, total_commission')
            .eq('company_id', companyId)
            .maybeSingle()

        if (pwError) throw new Error(`Provider wallet fetch failed: ${pwError.message}`)

        if (providerWallet) {
            const { error: pwUpdateError } = await supabase
                .from('provider_wallets')
                .update({
                    available_balance: parseFloat((parseFloat(providerWallet.available_balance) + providerCredit).toFixed(2)),
                    total_earned: parseFloat((parseFloat(providerWallet.total_earned) + providerCredit).toFixed(2)),
                    total_commission: parseFloat((parseFloat(providerWallet.total_commission || 0) + commission).toFixed(2)),
                    updated_at: new Date().toISOString(),
                })
                .eq('company_id', companyId)

            if (pwUpdateError) throw new Error(`Provider wallet update failed: ${pwUpdateError.message}`)
        } else {
            const { error: pwInsertError } = await supabase
                .from('provider_wallets')
                .insert({
                    company_id: companyId,
                    available_balance: providerCredit,
                    total_earned: providerCredit,
                    total_withdrawn: 0,
                    total_commission: commission,
                    updated_at: new Date().toISOString(),
                })

            if (pwInsertError) throw new Error(`Provider wallet creation failed: ${pwInsertError.message}`)
        }

        console.log(`💰 Provider credited: ₦${providerCredit} | Commission: ₦${commission}`)

        // ── 4. Mark transaction completed ─────────────────────────────────────
        const { error: txError } = await supabase
            .from('financial_transactions')
            .update({
                status: 'completed',
                verified_by_admin: true,
                admin_notes: 'Auto-verified: fully paid via credit wallet',
            })
            .eq('id', transactionId)

        if (txError) throw new Error(`Transaction update failed: ${txError.message}`)

        // ── 5. Advance job status ─────────────────────────────────────────────
        const nextStatusMap: Record<string, string> = {
            price_set: 'deposit_paid',
            work_ongoing: 'intermediate_paid',
            deposit_paid: 'intermediate_paid',
            work_completed: 'completed',
            work_rectified: 'completed',
        }
        const nextStatus = nextStatusMap[jobStatus] || jobStatus

        const { error: jobError } = await supabase
            .from('jobs')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', jobId)

        if (jobError) throw new Error(`Job status update failed: ${jobError.message}`)

        console.log(`✅ Job ${jobId}: ${jobStatus} → ${nextStatus}`)

        // ── 6. Notifications ──────────────────────────────────────────────────
        await supabase.from('notifications').insert([
            {
                user_id: companyId,
                job_id: jobId,
                type: 'payment_received',
                title: '💳 Payment Received',
                message: `₦${providerCredit.toLocaleString()} credited to your wallet for: ${jobDescription || `Job #${jobId.substring(0, 8)}`}.${isFinalPayment ? ` Commission of ₦${commission.toLocaleString()} deducted.` : ''}`,
                read: false,
                created_at: new Date().toISOString(),
            },
            {
                user_id: customerId,
                job_id: jobId,
                type: 'payment_confirmed',
                title: '✅ Payment Confirmed',
                message: `Your payment of ₦${paymentAmount.toLocaleString()} was covered by your credit wallet for job #${jobId.substring(0, 8).toUpperCase()}.`,
                read: false,
                created_at: new Date().toISOString(),
            },
        ])

        return new Response(
            JSON.stringify({
                success: true,
                creditDeducted: creditApplied,
                newCreditBalance,
                providerCredited: providerCredit,
                commission,
                previousStatus: jobStatus,
                newJobStatus: nextStatus,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('process-credit-payment error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})