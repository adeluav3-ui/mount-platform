// supabase/functions/backfill-monnify-accounts/index.ts
// One-time backfill function to create Monnify reserved accounts
// for all existing companies that don't have one yet.
// Call this once from the Supabase dashboard or via curl.
// It is safe to call multiple times — idempotency is built in.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MONNIFY_API_KEY = Deno.env.get('MONNIFY_API_KEY')
const MONNIFY_SECRET_KEY = Deno.env.get('MONNIFY_SECRET_KEY')
const MONNIFY_CONTRACT_CODE = Deno.env.get('MONNIFY_CONTRACT_CODE')
const MONNIFY_BASE_URL = Deno.env.get('MONNIFY_BASE_URL') || 'https://sandbox.monnify.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Small delay between API calls to avoid Monnify rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

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
                accountReference: companyId,
                accountName: companyName,
                currencyCode: 'NGN',
                contractCode: MONNIFY_CONTRACT_CODE,
                customerEmail: email,
                customerName: companyName,
                getAllAvailableBanks: true,
            }),
        }
    )
    const data = await response.json()
    if (!response.ok || !data.requestSuccessful) {
        throw new Error(`Account creation failed: ${data.responseMessage || JSON.stringify(data)}`)
    }
    return data.responseBody
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

        // ── Fetch all companies without a Monnify account ──────────────────────
        const { data: companies, error: fetchError } = await supabase
            .from('companies')
            .select('id, company_name, email')
            .is('monnify_virtual_account_no', null)

        if (fetchError) throw new Error(`Failed to fetch companies: ${fetchError.message}`)

        if (!companies || companies.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: 'All companies already have Monnify accounts', processed: 0 }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Found ${companies.length} companies needing Monnify accounts`)

        // ── Get a single Monnify token for all requests ────────────────────────
        // Token is valid for 1 hour — more than enough for 10 companies
        const token = await getMonnifyToken()

        // ── Process each company ───────────────────────────────────────────────
        const results = {
            success: [] as string[],
            failed: [] as { company: string; error: string }[],
        }

        for (const company of companies) {
            try {
                console.log(`Processing: ${company.company_name} (${company.id})`)

                // Use company_name@mountltd.com as fallback if email is missing
                const email = company.email || `${company.id}@mountltd.com`

                const accountData = await createReservedAccount(
                    token,
                    company.id,
                    company.company_name,
                    email
                )

                const accounts = accountData.accounts || []
                const primaryAccount = accounts[0] || {}

                // Save to Supabase
                const { error: updateError } = await supabase
                    .from('companies')
                    .update({
                        monnify_account_reference: accountData.accountReference,
                        monnify_virtual_account_no: primaryAccount.accountNumber,
                        monnify_bank_name: primaryAccount.bankName,
                        monnify_bank_code: primaryAccount.bankCode,
                        monnify_all_accounts: JSON.stringify(accounts),
                        monnify_account_created_at: new Date().toISOString(),
                    })
                    .eq('id', company.id)

                if (updateError) {
                    throw new Error(`Supabase update failed: ${updateError.message}`)
                }

                results.success.push(company.company_name)
                console.log(`✅ ${company.company_name}: ${primaryAccount.accountNumber} (${primaryAccount.bankName})`)

            } catch (err) {
                // Don't stop the loop — log the failure and continue to next company
                results.failed.push({ company: company.company_name, error: err.message })
                console.error(`❌ ${company.company_name}: ${err.message}`)
            }

            // Wait 500ms between each request to avoid rate limiting
            await sleep(500)
        }

        // ── Return summary ─────────────────────────────────────────────────────
        return new Response(
            JSON.stringify({
                success: true,
                summary: {
                    total: companies.length,
                    succeeded: results.success.length,
                    failed: results.failed.length,
                },
                succeeded: results.success,
                failed: results.failed,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('backfill-monnify-accounts error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})