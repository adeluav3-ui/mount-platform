// supabase/functions/create-monnify-account/index.ts
// Creates a Monnify reserved virtual account for a provider company.
// Called at company signup AND when admin manually approves a company.
// Each provider gets one persistent virtual account tied to their company_id.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MONNIFY_API_KEY = Deno.env.get('MONNIFY_API_KEY')
const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY')
const MONNIFY_CONTRACT_CODE = Deno.env.get('MONNIFY_CONTRACT_CODE')
const MONNIFY_BASE_URL = Deno.env.get('MONNIFY_BASE_URL') // https://sandbox.monnify.com or https://api.monnify.com
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Get Monnify auth token ────────────────────────────────────────────────────
// Monnify uses Basic Auth (base64 of apiKey:secretKey) to get a bearer token.
// Token is valid for 1 hour. We get a fresh one per request for simplicity.
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

    if (!response.ok || !data.requestSuccessful) {
        throw new Error(`Monnify auth failed: ${data.responseMessage || 'Unknown error'}`)
    }

    return data.responseBody.accessToken
}

// ── Create reserved account ───────────────────────────────────────────────────
async function createReservedAccount(
    token: string,
    companyId: string,
    companyName: string,
    email: string
) {
    const response = await fetch(
        `${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accountReference: companyId,         // our company UUID — maps back to Supabase
                accountName: companyName,
                currencyCode: 'NGN',
                contractCode: MONNIFY_CONTRACT_CODE,
                customerEmail: email,
                customerName: companyName,
                // Allow both bank transfer and USSD payments
                preferredBanks: ['035', '057'],       // Wema Bank (035) and Zenith Bank (057)
                // Income split will be configured separately via the Monnify dashboard
                // or via the split config endpoint once sub-accounts are set up
            }),
        }
    )

    const data = await response.json()

    if (!response.ok || !data.requestSuccessful) {
        throw new Error(`Reserved account creation failed: ${data.responseMessage || 'Unknown error'}`)
    }

    return data.responseBody
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
    }

    try {
        const { company_id, company_name, email } = await req.json()

        // Validate required fields
        if (!company_id || !company_name || !email) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: company_id, company_name, email' }),
                { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            )
        }

        // Use service role client — this runs server-side, needs to write to companies table
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // ── Check if account already exists ──────────────────────────────────────
        // Idempotency guard — if called twice (e.g. signup + manual approval),
        // don't create a second account. Just return the existing one.
        const { data: existingCompany } = await supabase
            .from('companies')
            .select('monnify_virtual_account_no, monnify_bank_name, monnify_account_reference')
            .eq('id', company_id)
            .single()

        if (existingCompany?.monnify_virtual_account_no) {
            return new Response(
                JSON.stringify({
                    success: true,
                    already_existed: true,
                    account: {
                        accountNumber: existingCompany.monnify_virtual_account_no,
                        bankName: existingCompany.monnify_bank_name,
                        accountReference: existingCompany.monnify_account_reference,
                    }
                }),
                { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
            )
        }

        // ── Get Monnify token ─────────────────────────────────────────────────────
        const token = await getMonnifyToken()

        // ── Create reserved account on Monnify ───────────────────────────────────
        const accountData = await createReservedAccount(token, company_id, company_name, email)

        // Monnify returns an array of accounts (one per bank)
        // We store all accounts but use the first one as primary
        const accounts = accountData.accounts || []
        const primaryAccount = accounts[0] || {}

        // ── Store account details in Supabase ────────────────────────────────────
        const { error: updateError } = await supabase
            .from('companies')
            .update({
                monnify_account_reference: accountData.accountReference,
                monnify_virtual_account_no: primaryAccount.accountNumber,
                monnify_bank_name: primaryAccount.bankName,
                monnify_bank_code: primaryAccount.bankCode,
                // Store all accounts as JSON in case we need the secondary bank option
                monnify_all_accounts: JSON.stringify(accounts),
                monnify_account_created_at: new Date().toISOString(),
            })
            .eq('id', company_id)

        if (updateError) {
            // Account was created on Monnify but we failed to save it
            // Log the account details so we can recover manually
            console.error('CRITICAL: Monnify account created but Supabase update failed', {
                company_id,
                accountData,
                updateError,
            })
            throw new Error(`Failed to save account details: ${updateError.message}`)
        }

        // ── Return success ────────────────────────────────────────────────────────
        return new Response(
            JSON.stringify({
                success: true,
                already_existed: false,
                account: {
                    accountNumber: primaryAccount.accountNumber,
                    bankName: primaryAccount.bankName,
                    accountReference: accountData.accountReference,
                    allAccounts: accounts,
                }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )

    } catch (error) {
        console.error('create-monnify-account error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        )
    }
})