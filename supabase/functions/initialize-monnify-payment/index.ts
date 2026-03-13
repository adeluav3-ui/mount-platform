// supabase/functions/initialize-monnify-payment/index.ts
// Initializes a Monnify payment transaction for a job.
// Called from PaymentPage when customer clicks "Pay".
// Returns a checkout URL that opens Monnify's payment modal.
// Reference format: MT-{jobId8}-{typeCode}-{companyId8}-{timestamp6}
// typeCode: D=deposit, I=intermediate, F=final_payment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MONNIFY_API_KEY = Deno.env.get('MONNIFY_API_KEY')!
const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY')!
const MONNIFY_CONTRACT_CODE = Deno.env.get('MONNIFY_CONTRACT_CODE')!
const MONNIFY_BASE_URL = Deno.env.get('MONNIFY_BASE_URL') || 'https://api.monnify.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const TYPE_CODES: Record<string, string> = {
    deposit: 'D',
    intermediate: 'I',
    final_payment: 'F',
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getMonnifyToken(): Promise<string> {
    const credentials = btoa(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`)
    const res = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!data.requestSuccessful) throw new Error(`Monnify auth failed: ${data.responseMessage}`)
    return data.responseBody.accessToken
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const {
            jobId,
            paymentType,  // deposit | intermediate | final_payment
            amount,       // cash amount (after credit deduction)
            fullAmount,   // original amount before credit
            creditUsed,   // credit portion
            customerEmail,
            customerName,
            companyId,
            companyName,
            jobDescription,
            redirectUrl,  // where to send customer after payment
        } = await req.json()

        if (!jobId || !paymentType || !amount || !customerEmail || !companyId) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // ── Build structured reference ─────────────────────────────────────────
        // Format: MT-{jobId8}-{typeCode}-{companyId8}-{timestamp6}
        // Webhook decodes this to know job, payment type, and company
        const typeCode = TYPE_CODES[paymentType] || 'F'
        const timestamp = Date.now().toString().slice(-6)
        const reference = `MT-${jobId.slice(0, 8)}-${typeCode}-${companyId.slice(0, 8)}-${timestamp}`

        // ── Create financial_transaction record (pending) ──────────────────────
        const { data: txn, error: txnError } = await supabase
            .from('financial_transactions')
            .insert({
                job_id: jobId,
                user_id: null, // will be set by webhook via job lookup
                type: paymentType,
                amount: fullAmount || amount,
                platform_fee: 0,
                description: `${paymentType} payment for: ${jobDescription || `Job #${jobId.substring(0, 8)}`}`,
                reference,
                status: 'pending',
                payment_method: 'monnify_gateway',
                bank_reference: reference,
                verified_by_admin: false,
                metadata: {
                    job_id: jobId,
                    company_id: companyId,
                    company_name: companyName,
                    payment_type: paymentType,
                    full_amount: fullAmount || amount,
                    credit_used: creditUsed || 0,
                    cash_amount: amount,
                    created_via: 'monnify_gateway',
                },
                created_at: new Date().toISOString(),
            })
            .select()
            .single()

        if (txnError) throw new Error(`Failed to create transaction: ${txnError.message}`)

        // ── Initialize Monnify transaction ─────────────────────────────────────
        const token = await getMonnifyToken()

        const paymentTypeLabels: Record<string, string> = {
            deposit: '50% Deposit',
            intermediate: '30% Intermediate Payment',
            final_payment: 'Final Payment',
        }

        const initRes = await fetch(`${MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount,
                customerName: customerName || 'Customer',
                customerEmail: customerEmail,
                paymentReference: reference,
                paymentDescription: `${paymentTypeLabels[paymentType] || 'Payment'} — ${jobDescription || `Job #${jobId.substring(0, 8)}`} (${companyName})`,
                currencyCode: 'NGN',
                contractCode: MONNIFY_CONTRACT_CODE,
                redirectUrl: redirectUrl || 'https://mountltd.com/payment/success',
                paymentMethods: ['CARD', 'ACCOUNT_TRANSFER', 'USSD', 'PHONE_NUMBER'],
            }),
        })

        const initData = await initRes.json()

        if (!initData.requestSuccessful) {
            // Clean up the pending transaction if Monnify init failed
            await supabase.from('financial_transactions').delete().eq('id', txn.id)
            throw new Error(`Monnify init failed: ${initData.responseMessage}`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                checkoutUrl: initData.responseBody.checkoutUrl,
                reference,
                transactionId: txn.id,
                accessCode: initData.responseBody.transactionReference,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('initialize-monnify-payment error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})