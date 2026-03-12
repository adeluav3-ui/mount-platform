// supabase/functions/process-withdrawal/index.ts
// Called directly from WalletSection.jsx when provider submits withdrawal request
// Calls Monnify Single Transfer API to disburse funds immediately

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MONNIFY_BASE_URL = Deno.env.get('MONNIFY_BASE_URL') ?? 'https://sandbox.monnify.com'
const MONNIFY_API_KEY = Deno.env.get('MONNIFY_API_KEY') ?? ''
const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY') ?? ''
const MONNIFY_WALLET_ACCOUNT = Deno.env.get('MONNIFY_WALLET_ACCOUNT') ?? '' // Mount's main wallet account number

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get Monnify OAuth token
async function getMonnifyToken(): Promise<string> {
    const credentials = btoa(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`)
    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
    })

    const data = await response.json()
    if (!data.requestSuccessful) {
        throw new Error(`Monnify auth failed: ${data.responseMessage}`)
    }

    return data.responseBody.accessToken
}

// Get bank code from bank name using Monnify banks list
// Replace the getBankCode function with this:
async function getBankCode(token: string, bankName: string): Promise<string | null> {
    const response = await fetch(`${MONNIFY_BASE_URL}/api/v1/banks`, {
        headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await response.json()
    if (!data.requestSuccessful) return null

    const banks: Array<{ name: string; code: string }> = data.responseBody

    // Log all banks for debugging
    console.log('Available banks:', banks.map(b => b.name).join(', '))

    const match = banks.find(b =>
        b.name.toLowerCase().includes(bankName.toLowerCase()) ||
        bankName.toLowerCase().includes(b.name.toLowerCase())
    )
    return match?.code ?? null
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Auth: require valid Supabase JWT
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get calling user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { withdrawal_request_id } = await req.json()
        if (!withdrawal_request_id) {
            return new Response(JSON.stringify({ error: 'withdrawal_request_id required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Fetch withdrawal request — must belong to calling user
        const { data: withdrawal, error: wError } = await supabaseAdmin
            .from('withdrawal_requests')
            .select('*')
            .eq('id', withdrawal_request_id)
            .eq('company_id', user.id)
            .eq('status', 'pending')
            .single()

        if (wError || !withdrawal) {
            return new Response(JSON.stringify({ error: 'Withdrawal request not found or already processed' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Fetch provider wallet — confirm sufficient balance
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('provider_wallets')
            .select('available_balance')
            .eq('company_id', user.id)
            .single()

        if (walletError || !wallet) {
            return new Response(JSON.stringify({ error: 'Wallet not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const available = parseFloat(wallet.available_balance)
        const amount = parseFloat(withdrawal.amount)

        if (amount > available) {
            // Mark as failed — balance insufficient at processing time
            await supabaseAdmin
                .from('withdrawal_requests')
                .update({ status: 'failed', failure_reason: 'Insufficient wallet balance' })
                .eq('id', withdrawal_request_id)

            return new Response(JSON.stringify({ error: 'Insufficient wallet balance' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Mark as processing immediately to prevent double-processing
        await supabaseAdmin
            .from('withdrawal_requests')
            .update({ status: 'processing' })
            .eq('id', withdrawal_request_id)

        // Deduct from wallet immediately (will restore if transfer fails)
        await supabaseAdmin
            .from('provider_wallets')
            .update({
                available_balance: (available - amount).toFixed(2),
                total_withdrawn: supabaseAdmin.rpc('increment', { x: amount }), // handled below
                updated_at: new Date().toISOString(),
            })
            .eq('company_id', user.id)

        // Simpler wallet deduction without rpc
        const { data: currentWallet } = await supabaseAdmin
            .from('provider_wallets')
            .select('total_withdrawn')
            .eq('company_id', user.id)
            .single()

        await supabaseAdmin
            .from('provider_wallets')
            .update({
                available_balance: (available - amount).toFixed(2),
                total_withdrawn: (parseFloat(currentWallet?.total_withdrawn || 0) + amount).toFixed(2),
                updated_at: new Date().toISOString(),
            })
            .eq('company_id', user.id)

        // Generate unique reference
        const reference = `MOUNT-WD-${withdrawal_request_id.replace(/-/g, '').slice(0, 16).toUpperCase()}`

        let monnifySuccess = false
        let monnifyReference = null
        let failureReason = null

        try {
            // Get Monnify token
            const token = await getMonnifyToken()

            // Resolve bank code from bank name
            const bankCode = await getBankCode(token, withdrawal.bank_name)
            if (!bankCode) {
                throw new Error(`Could not resolve bank code for: ${withdrawal.bank_name}`)
            }

            // Call Monnify Single Transfer API
            const transferPayload = {
                amount,
                reference,
                narration: `Mount withdrawal - ${withdrawal.account_name}`,
                destinationBankCode: bankCode,
                destinationAccountNumber: withdrawal.bank_account,
                currency: 'NGN',
                sourceAccountNumber: MONNIFY_WALLET_ACCOUNT,
                destinationAccountName: withdrawal.account_name,
                destinationBankName: withdrawal.bank_name,
                async: false,
            }

            console.log(`💸 Initiating transfer: ${reference} | ₦${amount} → ${withdrawal.bank_account} (${withdrawal.bank_name})`)

            const transferResponse = await fetch(`${MONNIFY_BASE_URL}/api/v2/disbursements/single`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transferPayload),
            })

            const transferData = await transferResponse.json()
            console.log(`📊 Transfer response:`, JSON.stringify(transferData))

            const status = transferData.responseBody?.status
            monnifyReference = transferData.responseBody?.reference ?? reference

            if (
                transferData.requestSuccessful &&
                (status === 'SUCCESS' || status === 'COMPLETED' || status === 'PENDING' ||
                    status === 'AWAITING_PROCESSING' || status === 'IN_PROGRESS')
            ) {
                monnifySuccess = true
            } else {
                failureReason = transferData.responseBody?.responseMessage ??
                    transferData.responseMessage ?? 'Transfer failed'

                // Handle 2FA/OTP required case
                if (status === 'PENDING_AUTHORIZATION') {
                    failureReason = 'OTP authorization required. Please contact support to disable 2FA for automated withdrawals.'
                }
            }

        } catch (monnifyError) {
            console.error('Monnify transfer error:', monnifyError)
            failureReason = monnifyError.message ?? 'Monnify API error'
        }

        if (monnifySuccess) {
            // Update withdrawal request as completed
            await supabaseAdmin
                .from('withdrawal_requests')
                .update({
                    status: 'completed',
                    monnify_reference: monnifyReference,
                    completed_at: new Date().toISOString(),
                })
                .eq('id', withdrawal_request_id)

            // Record financial transaction
            await supabaseAdmin
                .from('financial_transactions')
                .insert({
                    company_id: user.id,
                    type: 'payout',
                    amount,
                    status: 'completed',
                    reference: monnifyReference,
                    verified_by_admin: true,
                    description: `Withdrawal to ${withdrawal.bank_name} ${withdrawal.bank_account}`,
                })

            // Notify provider
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: user.id,
                    type: 'withdrawal_completed',
                    title: '💰 Withdrawal Successful',
                    message: `Your withdrawal of ₦${amount.toLocaleString()} to ${withdrawal.bank_name} ····${withdrawal.bank_account.slice(-4)} has been processed successfully.`,
                    read: false,
                })

            console.log(`✅ Withdrawal complete: ${reference} | ₦${amount} → ${withdrawal.bank_account}`)

            return new Response(JSON.stringify({ success: true, reference: monnifyReference }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })

        } else {
            // Restore wallet balance on failure
            await supabaseAdmin
                .from('provider_wallets')
                .update({
                    available_balance: available.toFixed(2),
                    total_withdrawn: (parseFloat(currentWallet?.total_withdrawn || 0)).toFixed(2),
                    updated_at: new Date().toISOString(),
                })
                .eq('company_id', user.id)

            // Mark withdrawal as failed
            await supabaseAdmin
                .from('withdrawal_requests')
                .update({ status: 'failed', failure_reason: failureReason })
                .eq('id', withdrawal_request_id)

            // Notify provider of failure
            await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: user.id,
                    type: 'withdrawal_failed',
                    title: '❌ Withdrawal Failed',
                    message: `Your withdrawal of ₦${amount.toLocaleString()} could not be processed. Reason: ${failureReason}. Your balance has been restored.`,
                    read: false,
                })

            console.log(`❌ Withdrawal failed: ${reference} | ${failureReason}`)

            return new Response(JSON.stringify({ success: false, error: failureReason }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

    } catch (error) {
        console.error('process-withdrawal error:', error)
        return new Response(JSON.stringify({ error: error.message ?? 'Internal server error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})