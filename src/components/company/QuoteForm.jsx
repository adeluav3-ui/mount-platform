import React, { useState, useEffect } from 'react'; // Added useEffect
import { useSupabase } from '../../context/SupabaseContext';

const QuoteForm = ({ jobId, companyId, onQuoteSubmitted, onCancel }) => {
    const { supabase, user } = useSupabase(); // Added user

    const [price, setPrice] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Debug logging
    useEffect(() => {
        console.log('QuoteForm props:', { jobId, companyId });
        console.log('Current user:', user?.id);
    }, [jobId, companyId, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate IDs before proceeding
        const actualJobId = jobId;
        const actualCompanyId = companyId || user?.id; // Fallback to logged-in user ID

        if (!actualJobId || !actualCompanyId) {
            setError(`Missing IDs: Job ID = ${actualJobId}, Company ID = ${actualCompanyId}. Please refresh and try again.`);
            setLoading(false);
            return;
        }

        console.log('Submitting quote for:', {
            jobId: actualJobId,
            companyId: actualCompanyId,
            user: user?.id
        });

        try {
            const quotedPrice = parseFloat(price);
            if (isNaN(quotedPrice) || quotedPrice <= 0) {
                throw new Error('Please enter a valid price');
            }

            const upfrontPayment = quotedPrice * 0.5;
            const platformFee = quotedPrice * 0.05;

            const { error: updateError } = await supabase
                .from('jobs')
                .update({
                    quoted_price: quotedPrice,
                    upfront_payment: upfrontPayment,
                    final_payment: quotedPrice - upfrontPayment,
                    platform_fee: platformFee,
                    company_notes: notes || null,
                    status: 'price_set',
                    updated_at: new Date().toISOString()
                })
                .eq('id', actualJobId)
                .eq('company_id', actualCompanyId);

            if (updateError) {
                console.error('Supabase update error:', updateError);
                throw updateError;
            }

            console.log('Quote updated successfully for job:', actualJobId);

            // Get complete job details for notification - FIXED: Include all needed fields
            const { data: job, error: jobError } = await supabase
                .from('jobs')
                .select('customer_id, sub_service, category, custom_sub_description, quoted_price, id')
                .eq('id', actualJobId)
                .single();

            if (jobError) {
                console.error('Error fetching job:', jobError);
                throw jobError;
            }

            console.log('Fetched job for notification:', {
                jobId: job.id,
                sub_service: job.sub_service,
                category: job.category,
                description: job.description,
                customer_id: job.customer_id
            });

            // Get company name for the message
            const { data: company } = await supabase
                .from('companies')
                .select('company_name')
                .eq('id', actualCompanyId)
                .single();

            // Create a descriptive job title with multiple fallbacks - IMPROVED LOGIC
            let jobTitle = '';
            if (job.sub_service && job.sub_service.trim() !== '') {
                jobTitle = job.sub_service;
            } else if (job.custom_sub_description && job.custom_sub_description.trim() !== '') {
                jobTitle = job.custom_sub_description;
            } else if (job.category && job.category.trim() !== '') {
                jobTitle = job.category;
            } else {
                jobTitle = 'your service request';
            }

            // If jobTitle is too long, truncate it
            if (jobTitle.length > 30) {
                jobTitle = jobTitle.substring(0, 30) + '...';
            }

            console.log('Fetched job data for notification:', {
                jobId: job.id,
                sub_service: job.sub_service,
                custom_sub_description: job.custom_sub_description,
                category: job.category,
                customer_id: job.customer_id,
                // Check what we actually got
                hasSubService: !!job.sub_service,
                hasCustomSubDescription: !!job.custom_sub_description,
                hasCategory: !!job.category
            });

            console.log('Generated jobTitle:', jobTitle);

            const companyName = company?.company_name || 'A company';
            const formattedPrice = quotedPrice.toLocaleString();

            // Create notification with proper job title - FIXED MESSAGE
            const notificationResult = await supabase
                .from('notifications')
                .insert({
                    user_id: job.customer_id,
                    job_id: actualJobId,
                    type: 'quote_received',
                    title: 'New Quote Received!',
                    message: `${companyName} has quoted ₦${formattedPrice} for your "${jobTitle}" job.`,
                    read: false,
                    created_at: new Date().toISOString()
                    // REMOVED: metadata field
                });

            if (notificationResult.error) {
                console.error('Notification creation error:', notificationResult.error);
                // Don't throw error - just log it, quote submission should still succeed
            } else {
                console.log('Notification created successfully:', {
                    message: `${companyName} has quoted ₦${formattedPrice} for your "${jobTitle}" job.`,
                    customerId: job.customer_id,
                    jobTitle: jobTitle
                });
            }

            console.log('Quote submitted successfully!');
            onQuoteSubmitted();

        } catch (err) {
            console.error('Full quote submission error:', err);
            setError(err.message || 'Failed to submit quote. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const calculateBreakdown = () => {
        const total = parseFloat(price) || 0;
        const upfront = total * 0.5;
        const platformFee = total * 0.05;
        const companyReceives = total - platformFee;

        return { total, upfront, platformFee, companyReceives };
    };

    const breakdown = calculateBreakdown();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
                {/* Sticky Header */}
                <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 rounded-t-2xl">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-gray-800">Submit Quote</h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-gray-600 p-1"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-gray-600 text-sm">Enter your price and any notes for the customer</p>
                </div>

                {/* Scrollable Content */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2 font-medium">
                                Total Price (₦)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="100"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-naijaGreen focus:ring-2 focus:ring-naijaGreen/20 transition-all duration-200"
                                placeholder="e.g., 50000"
                                required
                            />

                            {/* Compact Price Breakdown */}
                            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-600 mb-1 text-xs">Upfront (50%)</p>
                                    <p className="font-bold text-naijaGreen text-lg">₦{breakdown.upfront.toLocaleString()}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-600 mb-1 text-xs">Platform Fee (5%)</p>
                                    <p className="font-bold text-blue-600 text-lg">₦{breakdown.platformFee.toLocaleString()}</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-lg text-center">
                                    <p className="text-gray-600 mb-1 text-xs">You Receive</p>
                                    <p className="font-bold text-purple-600 text-lg">₦{breakdown.companyReceives.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Simple Summary */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">Total Job Value:</span>
                                    <span className="font-bold text-xl text-gray-800">₦{breakdown.total.toLocaleString()}</span>
                                </div>
                                <div className="mt-2 flex items-center text-xs text-gray-500">
                                    <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>5% platform fee • Payment protection</span>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Sticky Footer with Submit Button */}
                <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 rounded-b-2xl">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors duration-200"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading || !price || parseFloat(price) <= 0}
                            className="flex-1 px-4 py-3 bg-naijaGreen text-white font-medium rounded-xl hover:bg-darkGreen transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                </span>
                            ) : (
                                'Submit Quote'
                            )}
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-3">
                        50% deposit required to start work
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QuoteForm;