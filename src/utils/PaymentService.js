// src/utils/PaymentService.js - TIERED FEE VERSION
import { supabase } from '../context/SupabaseContext';

export const PaymentService = {
    // Calculate tiered service fee (5% with min ₦500, max ₦10,000)
    calculateTieredServiceFee: (jobAmount) => {
        const percentageFee = jobAmount * 0.05;
        const serviceFee = Math.max(500, Math.min(percentageFee, 10000));
        return serviceFee;
    },

    // Check if customer is in promotion period
    checkCustomerPromotionStatus: async (customerId) => {
        try {
            const { data: customer, error } = await supabase
                .from('customers')
                .select('promotion_end_date, first_job_date')
                .eq('id', customerId)
                .single();

            if (error) throw error;
            if (!customer) return null;

            const now = new Date();
            const promotionEndDate = customer.promotion_end_date
                ? new Date(customer.promotion_end_date)
                : null;

            // Check if promotion has ended
            const isInPromotion = promotionEndDate
                ? now < promotionEndDate
                : false; // Default to no promotion if no date set

            return {
                isInPromotion,
                promotionEndDate: promotionEndDate?.toISOString(),
                message: isInPromotion
                    ? `You're in promotion period until ${promotionEndDate.toLocaleDateString()}`
                    : 'Promotion period has ended'
            };
        } catch (error) {
            console.error('Error checking promotion status:', error);
            return {
                isInPromotion: false,
                promotionEndDate: null,
                message: 'Unable to verify promotion status'
            };
        }
    },

    // Get complete payment breakdown
    getPaymentBreakdown: async (jobId, customerId) => {
        try {
            // 1. Fetch job details
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select(`
                    quoted_price,
                    customer_service_fee,
                    service_fee_waived,
                    total_amount,
                    status,
                    upfront_payment,
                    final_payment
                `)
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;
            if (!job) throw new Error('Job not found');

            const jobAmount = job.quoted_price || 0;

            // 2. Check customer promotion status
            let promotionStatus = { isInPromotion: false };
            if (customerId) {
                promotionStatus = await PaymentService.checkCustomerPromotionStatus(customerId);
            }

            // 3. Calculate service fee (waived if in promotion)
            let serviceFee = 0;
            let isServiceFeeWaived = false;

            if (!promotionStatus.isInPromotion) {
                // Apply tiered fee only if not in promotion
                serviceFee = PaymentService.calculateTieredServiceFee(jobAmount);
                isServiceFeeWaived = false;
            } else {
                // Fee waived during promotion
                serviceFee = 0;
                isServiceFeeWaived = true;
            }

            // 4. Calculate platform commission (5% on total job amount)
            const platformCommissionPercentage = 5;
            const platformCommissionAmount = jobAmount * (platformCommissionPercentage / 100);

            // 5. Calculate deposit (50% of job amount)
            const depositPercentage = 50;
            const depositAmount = jobAmount * (depositPercentage / 100);

            // 6. Calculate company payout
            const companyPayoutAmount = jobAmount - platformCommissionAmount;

            // 7. Build payment schedule
            const paymentSchedule = [
                {
                    stage: 'Deposit (50%)',
                    total: depositAmount + (isServiceFeeWaived ? 0 : serviceFee),
                    items: [
                        {
                            label: 'Deposit',
                            amount: depositAmount,
                            waived: false
                        },
                        {
                            label: 'Service Fee',
                            amount: serviceFee,
                            waived: isServiceFeeWaived
                        }
                    ]
                },
                {
                    stage: 'Final Payment (50%)',
                    total: jobAmount - depositAmount,
                    items: [
                        {
                            label: 'Balance Payment',
                            amount: jobAmount - depositAmount,
                            waived: false
                        }
                    ]
                }
            ];

            // 8. Calculate totals
            const totalDueNow = depositAmount + (isServiceFeeWaived ? 0 : serviceFee);
            const finalPaymentDue = jobAmount - depositAmount;

            const breakdown = {
                jobAmount,
                deposit: {
                    percentage: depositPercentage,
                    amount: depositAmount
                },
                serviceFee: {
                    amount: serviceFee,
                    isWaived: isServiceFeeWaived,
                    description: isServiceFeeWaived
                        ? 'Service fee waived during promotion period'
                        : `Service fee (5% with min ₦500, max ₦10,000)`
                },
                platformCommission: {
                    percentage: platformCommissionPercentage,
                    amount: platformCommissionAmount
                },
                companyPayout: {
                    amount: companyPayoutAmount
                },
                paymentSchedule,
                totals: {
                    totalDueNow,
                    finalPaymentDue,
                    totalJobAmount: jobAmount
                }
            };

            return {
                success: true,
                breakdown,
                promotionStatus
            };

        } catch (error) {
            console.error('Error getting payment breakdown:', error);
            return {
                success: false,
                message: error.message || 'Failed to calculate payment breakdown',
                breakdown: null
            };
        }
    },

    // Update job with calculated fees
    updateJobWithFees: async (jobId, customerId) => {
        try {
            // Get payment breakdown
            const result = await PaymentService.getPaymentBreakdown(jobId, customerId);

            if (!result.success || !result.breakdown) {
                throw new Error(result.message || 'Failed to calculate fees');
            }

            const { breakdown, promotionStatus } = result;

            // Update job record with calculated fees
            const { data, error } = await supabase
                .from('jobs')
                .update({
                    customer_service_fee: breakdown.serviceFee.amount,
                    service_fee_waived: breakdown.serviceFee.isWaived,
                    total_amount: breakdown.totals.totalJobAmount,
                    upfront_payment: breakdown.deposit.amount + (breakdown.serviceFee.isWaived ? 0 : breakdown.serviceFee.amount),
                    final_payment: breakdown.totals.finalPaymentDue,
                    payment_metadata: {
                        fee_calculation_time: new Date().toISOString(),
                        promotion_status: promotionStatus,
                        tiered_fee_applied: !breakdown.serviceFee.isWaived
                    }
                })
                .eq('id', jobId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                job: data,
                breakdown: breakdown
            };

        } catch (error) {
            console.error('Error updating job with fees:', error);
            return {
                success: false,
                message: error.message || 'Failed to update job with fees'
            };
        }
    }
};

export default PaymentService;