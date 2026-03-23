// supabase/functions/paystack-webhook/index.ts
// Handles Paystack webhook events for subscription activation
// Events handled:
//   - charge.success → activate subscription, credit wallet
//   - subscription.create → store subscription code
//   - subscription.disable → deactivate subscription
//   - invoice.payment_failed → mark subscription past_due

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''

// Monthly credit amounts per plan (90% of monthly fee)
const PLAN_CREDITS: Record<string, number> = {
    logistics: 4500,
    basic: 13500,
    standard: 22500,
    premium: 45000,
}

// Mount fee per plan per month (10% of monthly fee)
const PLAN_MOUNT_FEE: Record<string, number> = {
    logistics: 500,
    basic: 1500,
    standard: 2500,
    premium: 5000,
}

// Map Paystack plan IDs to plan keys
const PLAN_ID_MAP: Record<string, string> = {
    'PLN_3tdtvb132thk1hr': 'logistics',
    'PLN_2iwog9z6h8jgbzt': 'basic',
    'PLN_746nl7acl3cs1sy': 'standard',
    'PLN_5l5rozwz1c2zour': 'premium',
}

// Verify Paystack webhook signature
async function verifySignature(body: string, signature: string): Promise<boolean> {
    try {
        const encoder = new TextEncoder()
        const keyData = encoder.encode(PAYSTACK_SECRET_KEY)
        const messageData = encoder.encode(body)

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['sign']
        )

        const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
        const hashArray = Array.from(new Uint8Array(signatureBuffer))
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        return computedHash === signature
    } catch (err) {
        console.error('Signature verification error:', err)
        return false
    }
}

// Determine plan key from metadata or plan code
function getPlanKey(data: Record<string, unknown>): string | null {
    // From metadata custom fields
    const customFields = (data.metadata as Record<string, unknown>)?.custom_fields as Array<Record<string, string>> ?? []
    const planField = customFields.find((f) => f.variable_name === 'plan')
    if (planField?.value) {
        return planField.value.toLowerCase()
    }

    // From plan object
    const planCode = (data.plan as Record<string, unknown>)?.plan_code as string
    if (planCode && PLAN_ID_MAP[planCode]) {
        return PLAN_ID_MAP[planCode]
    }

    // From plan_code directly
    if (data.plan_code && PLAN_ID_MAP[data.plan_code as string]) {
        return PLAN_ID_MAP[data.plan_code as string]
    }

    return null
}

// Get billing cycle from metadata
function getBillingCycle(data: Record<string, unknown>): string {
    const customFields = (data.metadata as Record<string, unknown>)?.custom_fields as Array<Record<string, string>> ?? []
    const cycleField = customFields.find((f) => f.variable_name === 'billing_cycle')
    return cycleField?.value ?? 'monthly'
}

// Get customer_id from metadata
function getCustomerId(data: Record<string, unknown>): string | null {
    const customFields = (data.metadata as Record<string, unknown>)?.custom_fields as Array<Record<string, string>> ?? []
    const customerField = customFields.find((f) => f.variable_name === 'customer_id')
    return customerField?.value ?? null
}

// Credit the customer wallet
async function creditWallet(
    supabase: ReturnType<typeof createClient>,
    customerId: string,
    planKey: string,
    billingCycle: string
): Promise<void> {
    const monthlyCredit = PLAN_CREDITS[planKey] ?? 0
    const mountFee = PLAN_MOUNT_FEE[planKey] ?? 0

    // For yearly: same monthly credit allocation (not 12x)
    // Yearly subscribers get the same monthly credit cap, just pre-paid for the year
    const creditToAdd = monthlyCredit

    // Check if wallet exists
    const { data: existing } = await supabase
        .from('credit_wallets')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle()

    if (existing) {
        await supabase
            .from('credit_wallets')
            .update({
                balance: parseFloat(existing.balance) + creditToAdd,
                monthly_credited: parseFloat(existing.monthly_credited || 0) + creditToAdd, // ← accumulate
                monthly_used: 0,
                mount_fee_collected: parseFloat(existing.mount_fee_collected || 0) + mountFee,
                last_credited_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('customer_id', customerId)
    } else {
        // Create new wallet
        await supabase
            .from('credit_wallets')
            .insert({
                customer_id: customerId,
                balance: creditToAdd,
                monthly_credited: creditToAdd,
                monthly_used: 0,
                mount_fee_collected: mountFee,
                last_credited_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
    }

    console.log(`💳 Credited ₦${creditToAdd} to wallet for customer ${customerId} (${planKey} ${billingCycle})`)
}

// Activate or update subscription in DB
async function activateSubscription(
    supabase: ReturnType<typeof createClient>,
    customerId: string,
    planKey: string,
    billingCycle: string,
    paystackData: Record<string, unknown>
): Promise<void> {
    const now = new Date()
    const periodEnd = billingCycle === 'yearly'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

    const paystackCustomerCode = (paystackData.customer as Record<string, string>)?.customer_code ?? null
    const paystackSubscriptionCode = (paystackData.subscription as Record<string, string>)?.subscription_code ?? null

    const { data: existing } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle()

    if (existing) {
        await supabase
            .from('subscriptions')
            .update({
                plan: planKey,
                billing_cycle: billingCycle,
                status: 'active',
                paystack_customer_code: paystackCustomerCode ?? existing.paystack_customer_code,
                paystack_subscription_code: paystackSubscriptionCode ?? existing.paystack_subscription_code,
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                months_credited: 1,
                updated_at: now.toISOString(),
            })
            .eq('customer_id', customerId)
    } else {
        await supabase
            .from('subscriptions')
            .insert({
                customer_id: customerId,
                plan: planKey,
                billing_cycle: billingCycle,
                status: 'active',
                months_credited: 1,
                paystack_customer_code: paystackCustomerCode,
                paystack_subscription_code: paystackSubscriptionCode,
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
            })
    }

    console.log(`✅ Subscription activated: ${planKey} (${billingCycle}) for customer ${customerId}`)
}

serve(async (req) => {
    // Only accept POST
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature') ?? ''

    // Verify signature
    const isValid = await verifySignature(body, signature)
    if (!isValid) {
        console.error('❌ Invalid Paystack signature')
        return new Response('Invalid signature', { status: 401 })
    }

    let event: Record<string, unknown>
    try {
        event = JSON.parse(body)
    } catch {
        return new Response('Invalid JSON', { status: 400 })
    }

    const eventType = event.event as string
    const data = event.data as Record<string, unknown>

    console.log(`📩 Paystack event: ${eventType}`)

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
        switch (eventType) {

            // ── Successful charge ────────────────────────────────────────────────
            case 'charge.success': {
                const customerId = getCustomerId(data)
                const planKey = getPlanKey(data)
                const billingCycle = getBillingCycle(data)
                const reference = data.reference as string

                if (!customerId || !planKey) {
                    console.log(`⚠️ charge.success ignored — missing customerId or planKey`, {
                        customerId,
                        planKey,
                        metadata: data.metadata
                    })
                    break
                }

                // Idempotency check — don't double-credit
                const { data: existing } = await supabase
                    .from('subscriptions')
                    .select('id, current_period_start')
                    .eq('customer_id', customerId)
                    .eq('status', 'active')
                    .maybeSingle()

                // If already credited this period, skip
                if (existing?.current_period_start) {
                    const lastCredit = new Date(existing.current_period_start)
                    const hoursSince = (Date.now() - lastCredit.getTime()) / 1000 / 60 / 60
                    if (hoursSince < 1) {
                        console.log(`⚠️ Duplicate charge.success within 1 hour — skipping`)
                        break
                    }
                }

                await activateSubscription(supabase, customerId, planKey, billingCycle, data)
                await creditWallet(supabase, customerId, planKey, billingCycle)

                // Notify customer
                await supabase.from('notifications').insert({
                    user_id: customerId,
                    type: 'subscription_activated',
                    title: '🎉 Subscription Activated!',
                    message: `Your ${planKey.charAt(0).toUpperCase() + planKey.slice(1)} plan is now active. ₦${PLAN_CREDITS[planKey]?.toLocaleString()} has been credited to your wallet.`,
                    read: false,
                })

                console.log(`✅ charge.success processed: ${reference} | ${planKey} | ${billingCycle}`)
                break
            }

            // ── Subscription created (monthly recurring setup) ───────────────────
            case 'subscription.create': {
                const subscriptionCode = data.subscription_code as string
                const planCode = (data.plan as Record<string, string>)?.plan_code
                const planKey = planCode ? PLAN_ID_MAP[planCode] : null
                const customerCode = (data.customer as Record<string, string>)?.customer_code

                if (!planKey || !customerCode) {
                    console.log(`⚠️ subscription.create ignored — missing planKey or customerCode`)
                    break
                }

                // Store subscription code for future management
                await supabase
                    .from('subscriptions')
                    .update({
                        paystack_subscription_code: subscriptionCode,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('paystack_customer_code', customerCode)

                console.log(`✅ subscription.create: stored code ${subscriptionCode}`)
                break
            }

            // ── Subscription disabled/cancelled ─────────────────────────────────
            case 'subscription.disable': {
                const subscriptionCode = data.subscription_code as string

                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'cancelled',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('paystack_subscription_code', subscriptionCode)

                console.log(`⚠️ Subscription cancelled: ${subscriptionCode}`)
                break
            }

            // ── Invoice payment failed ───────────────────────────────────────────
            case 'invoice.payment_failed': {
                const subscriptionCode = (data.subscription as Record<string, string>)?.subscription_code

                if (subscriptionCode) {
                    await supabase
                        .from('subscriptions')
                        .update({
                            status: 'past_due',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('paystack_subscription_code', subscriptionCode)

                    // Get customer_id to notify
                    const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('customer_id')
                        .eq('paystack_subscription_code', subscriptionCode)
                        .single()

                    if (sub?.customer_id) {
                        await supabase.from('notifications').insert({
                            user_id: sub.customer_id,
                            type: 'subscription_payment_failed',
                            title: '⚠️ Subscription Payment Failed',
                            message: 'Your subscription renewal payment failed. Please update your payment method to continue enjoying your plan.',
                            read: false,
                        })
                    }

                    console.log(`❌ Invoice payment failed: ${subscriptionCode}`)
                }
                break
            }

            default:
                console.log(`ℹ️ Unhandled event: ${eventType}`)
        }

    } catch (err) {
        console.error(`❌ Error processing ${eventType}:`, err)
        // Return 200 anyway — Paystack retries on non-200 responses
        // We don't want infinite retries for processing errors
    }

    // Always return 200 to Paystack
    return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
})