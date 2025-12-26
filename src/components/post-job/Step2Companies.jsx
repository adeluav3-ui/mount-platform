// src/components/post-job/Step2Companies.jsx — UPDATED WITH MODAL REVIEWS
import React from 'react';
import { useState, useEffect } from 'react'
import { useSupabase } from '../../context/SupabaseContext'
import NotificationService from '../../services/NotificationService';

export default function Step2Companies({
    companies,
    job,
    setSelectedCompany,
    setStep,
    user,
    supabase,
    photoFilesRef,
    setShowLoader,
    setLoaderCompanyName,
    setTempSelectedCompany
}) {
    // Add state for loading and reviews
    const [isSending, setIsSending] = useState(false)
    const [companyReviews, setCompanyReviews] = useState({})
    const [loadingReviews, setLoadingReviews] = useState(true)

    // Modal state
    const [showReviewsModal, setShowReviewsModal] = useState(false)
    const [selectedCompanyForReviews, setSelectedCompanyForReviews] = useState(null)
    const [modalReviews, setModalReviews] = useState([])
    const [loadingModalReviews, setLoadingModalReviews] = useState(false)

    // Fetch recent reviews for each company
    useEffect(() => {
        const fetchReviewsForCompanies = async () => {
            if (!companies.length || !supabase) return

            setLoadingReviews(true)
            try {
                const reviewsMap = {}

                // Fetch recent reviews for each company
                for (const company of companies) {
                    const { data: reviews } = await supabase
                        .from('reviews')
                        .select(`
                            rating,
                            comment,
                            created_at,
                            customers:customer_id (
                                customer_name
                            )
                        `)
                        .eq('company_id', company.id)
                        .eq('is_approved', true)
                        .order('created_at', { ascending: false })
                        .limit(2) // Show 2 most recent reviews

                    reviewsMap[company.id] = reviews || []
                }

                setCompanyReviews(reviewsMap)
            } catch (error) {
                console.error('Error fetching company reviews:', error)
            } finally {
                setLoadingReviews(false)
            }
        }

        fetchReviewsForCompanies()
    }, [companies, supabase])

    // Function to open reviews modal
    const handleViewAllReviews = async (company) => {
        setSelectedCompanyForReviews(company)
        setShowReviewsModal(true)
        setLoadingModalReviews(true)

        try {
            // Fetch all reviews for this company
            const { data: reviews } = await supabase
                .from('reviews')
                .select(`
                    rating,
                    comment,
                    created_at,
                    review_photos,
                    customers:customer_id (
                        customer_name
                    ),
                    jobs:job_id (
                        category,
                        sub_service
                    )
                `)
                .eq('company_id', company.id)
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .limit(20) // Limit to 20 reviews for modal

            setModalReviews(reviews || [])
        } catch (error) {
            console.error('Error fetching modal reviews:', error)
            setModalReviews([])
        } finally {
            setLoadingModalReviews(false)
        }
    }

    // Function to render stars
    const renderStars = (rating, size = 'md') => {
        const sizeClasses = {
            sm: 'w-3 h-3',
            md: 'w-4 h-4',
            lg: 'w-5 h-5',
            xl: 'w-6 h-6'
        }

        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`${sizeClasses[size]} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        )
    }
    const sendJobNotification = async (companyId, jobId, jobDetails) => {
        try {
            // 1. Database notification
            await supabase.from('notifications').insert({
                user_id: companyId,
                title: '🔧 New Job Assignment',
                message: `New ${jobDetails.category} job: ${jobDetails.sub_service}`,
                type: 'job_assigned',
                read: false
            });

            // 2. Browser push notification
            if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('🔧 Mount: New Job!', {
                        body: `${jobDetails.category} - ${jobDetails.sub_service}`,
                        icon: '/icons/logo192.png',
                        tag: `job-${jobId}`,
                        data: { url: `/company/jobs/${jobId}` }
                    });
                });
            }

            return true;
        } catch (error) {
            console.error('Notification error:', error);
            return false;
        }
    };
    const sendJobToCompany = async (company) => {
        console.log('📝 Sending job to company:', {
            companyId: company.id,
            companyName: company.company_name,
            customerId: user.id,
            customerName: user.email,
            timestamp: new Date().toISOString()
        });

        if (isSending) return // Prevent multiple clicks

        setIsSending(true)
        setLoaderCompanyName(company.company_name)
        setTempSelectedCompany(company)
        setShowLoader(true)

        try {
            let photoUrls = []

            // Upload photos with better error handling
            if (photoFilesRef.current.length > 0) {
                const uploadPromises = photoFilesRef.current.map(async (file, index) => {
                    try {
                        const fileName = `${user.id}/jobs/${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`

                        const { error } = await supabase.storage
                            .from('job-photos')
                            .upload(fileName, file, {
                                cacheControl: '3600',
                                upsert: false
                            })

                        if (error) {
                            console.warn(`Failed to upload photo ${index + 1}:`, error)
                            return null // Skip failed uploads
                        }

                        const { data: { publicUrl } } = supabase.storage
                            .from('job-photos')
                            .getPublicUrl(fileName)

                        return publicUrl
                    } catch (err) {
                        console.warn(`Photo ${index + 1} upload error:`, err)
                        return null
                    }
                })

                const results = await Promise.allSettled(uploadPromises)
                photoUrls = results
                    .filter(result => result.status === 'fulfilled' && result.value)
                    .map(result => result.value)
            }

            // 1. FIRST: Save the job to get job ID
            const { error: jobError, data: jobData } = await supabase.from('jobs').insert({
                customer_id: user.id,
                company_id: company.id,
                category: job.category,
                sub_service: job.sub_service,
                custom_sub_description: job.sub_service === 'Other' ? job.custom_sub : null,
                location: job.location,
                description: job.description,
                budget: Number(job.price) || 0,
                photos: photoUrls,
                status: 'pending',
                created_at: new Date().toISOString()
            }).select('id').single();

            if (jobError) throw jobError

            const newJobId = jobData.id;

            // 2. SECOND: Send all notifications (now we have jobId)
            try {
                // Create database notification
                const { error: notificationError } = await supabase.from('notifications').insert({
                    user_id: company.id,
                    job_id: newJobId,
                    title: '🔧 New Job Assignment',
                    message: `New ${job.category} job: ${job.sub_service} in ${job.location}`,
                    type: 'job_assigned',
                    read: false,
                    created_at: new Date().toISOString()
                });

                if (notificationError) console.error('Notification DB error:', notificationError);

                // Send hybrid notifications (Push + Email)
                const notificationResult = await NotificationService.notifyCompanyNewJob(
                    company, // Pass the FULL company object, not just ID
                    {
                        id: newJobId,
                        category: job.category,
                        sub_service: job.sub_service,
                        location: job.location,
                        budget: Number(job.price) || 0,
                        description: job.description
                    }
                );

                console.log('📢 Notification result:', notificationResult);

            } catch (notifError) {
                console.error('Notification sending failed:', notifError);
            }

            // Success — go to step 3
            setSelectedCompany(company)
            setStep(3)

        } catch (err) {
            console.error('Send job error:', err)
            setShowLoader(false)
            setIsSending(false)

            let errorMessage = 'Failed to send job: '
            if (err.message?.includes('storage')) {
                errorMessage += 'Photo upload failed. Please try again with smaller images.'
            } else if (err.message?.includes('network')) {
                errorMessage += 'Network error. Check your connection and try again.'
            } else {
                errorMessage += err.message || 'Unknown error'
            }

            alert(errorMessage)
        }
    }



    // Star rating display function for company cards
    const renderCompanyStars = (rating) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        )
    }

    return (
        <div className="mt-8 space-y-8 w-full">

            {/* BACK BUTTON */}
            <button
                onClick={() => setStep(1)}
                className="mb-6 text-naijaGreen font-semibold flex items-center gap-2 hover:underline"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Job Details
            </button>

            <h2 className="text-xl font-bold text-center mb-8">Choose a Company</h2>


            {companies.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl shadow-lg">
                    <p className="text-lg text-gray-600">No companies found for this service.</p>
                    <button
                        onClick={() => setStep(1)}
                        className="mt-4 text-naijaGreen font-semibold hover:underline"
                    >
                        ← Try a different service
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {companies.map(c => {
                        const getPriceDisplay = () => {
                            // NEW LOGIC: Always check if company has price for this specific sub-service
                            const prices = c.subcategory_prices || {}
                            const price = prices[job.sub_service]

                            // If company doesn't have price for this specific sub-service
                            if (!price) {
                                return "Contact for price"
                            }

                            // If price is "TBD"
                            if (price === "TBD") {
                                return "TBD (To Be Determined)"
                            }

                            // If price has min and max
                            if (price?.min && price?.max) {
                                return `₦${Number(price.min).toLocaleString()} - ₦${Number(price.max).toLocaleString()}`
                            }

                            // Fallback
                            return "Contact for price"
                        }

                        return (
                            <div
                                key={c.id}
                                onClick={() => sendJobToCompany(c)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && sendJobToCompany(c)}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl border-2 border-gray-100 hover:border-naijaGreen w-full"
                                style={{ touchAction: 'manipulation' }}
                            >
                                <div className="p-6">
                                    {/* Company Header Row */}
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src={c.picture_url ? `${c.picture_url}?t=${Date.now()}` : '/default-company.jpg'}
                                                alt={c.company_name}
                                                className="w-20 h-20 rounded-full object-cover border-2 border-naijaGreen"
                                                onError={(e) => {
                                                    e.target.src = '/default-company.jpg'
                                                }}
                                            />
                                        </div>

                                        {/* Company Info */}
                                        <div className="flex-1 min-w-0">
                                            {/* Company Name */}
                                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{c.company_name}</h3>

                                            {/* Address - NOW UNDER COMPANY NAME */}
                                            <p className="text-gray-600 text-xs sm:text-sm mt-2">{c.address}</p>

                                            {/* Rating - STARS ONLY */}
                                            <div className="flex items-center mt-3">
                                                {renderCompanyStars(c.average_rating || 0)}
                                                <span className="ml-2 text-xs sm:text-sm font-bold text-gray-800">
                                                    {c.average_rating ? c.average_rating.toFixed(1) : 'N/A'}
                                                </span>
                                            </div>

                                            {/* Review Count - NOW UNDER STARS */}
                                            <div className="mt-1">
                                                <span className="text-gray-600 text-xs sm:text-sm">
                                                    {c.total_reviews || 0} review{c.total_reviews !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Price Section */}
                                    <div className="mt-6 bg-gradient-to-r from-naijaGreen/10 to-green-50 rounded-xl p-4">
                                        <p className="text-sm font-medium text-gray-700">
                                            {job.sub_service ? `Price for ${job.sub_service}` : 'Service Price'}
                                        </p>
                                        <p className="text-xl font-bold text-naijaGreen mt-1">
                                            {getPriceDisplay()}
                                        </p>
                                    </div>

                                    {/* Recent Reviews Preview */}
                                    {loadingReviews ? (
                                        <div className="mt-6 text-center py-3">
                                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-naijaGreen mr-2"></div>
                                            <span className="text-sm text-gray-500">Loading reviews...</span>
                                        </div>
                                    ) : companyReviews[c.id] && companyReviews[c.id].length > 0 ? (
                                        <div className="mt-6">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="text-sm font-semibold text-gray-800">Recent Reviews</h4>
                                                {c.total_reviews > 2 && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleViewAllReviews(c)
                                                        }}
                                                        className="text-xs text-naijaGreen hover:text-darkGreen underline"
                                                    >
                                                        View all {c.total_reviews} reviews
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {companyReviews[c.id].slice(0, 2).map((review, index) => (
                                                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center">
                                                                <div className="flex">
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <svg
                                                                            key={star}
                                                                            className={`w-3 h-3 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                    ))}
                                                                </div>
                                                                <span className="ml-2 text-xs font-medium text-gray-800">
                                                                    {review.rating}.0
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(review.created_at).toLocaleDateString('en-NG', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                                            "{review.comment.substring(0, 80)}{review.comment.length > 80 ? '...' : ''}"
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            — {review.customers?.customer_name || 'Customer'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : c.total_reviews > 0 ? (
                                        <div className="mt-6 text-center py-3">
                                            <p className="text-sm text-gray-500">No recent reviews to display</p>
                                        </div>
                                    ) : null}

                                    {/* Call to Action */}
                                    <div className="mt-6 text-center">
                                        <button className="w-full bg-naijaGreen text-white py-3 rounded-xl font-bold text-lg hover:bg-darkGreen transition">
                                            Select This Company
                                        </button>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Tap to send your job request
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* REVIEWS MODAL */}
            {showReviewsModal && selectedCompanyForReviews && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="bg-naijaGreen text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">
                                    {selectedCompanyForReviews.company_name} Reviews
                                </h3>
                                <p className="text-green-100 text-sm">
                                    {selectedCompanyForReviews.total_reviews || 0} review{selectedCompanyForReviews.total_reviews !== 1 ? 's' : ''} •
                                    Average: {selectedCompanyForReviews.average_rating?.toFixed(1) || 'N/A'} ⭐
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowReviewsModal(false)
                                    setSelectedCompanyForReviews(null)
                                    setModalReviews([])
                                }}
                                className="text-white hover:text-gray-200 text-2xl bg-white/20 rounded-full w-8 h-8 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingModalReviews ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-naijaGreen mb-4"></div>
                                    <p className="text-gray-600">Loading reviews...</p>
                                </div>
                            ) : modalReviews.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4 text-gray-300">⭐</div>
                                    <p className="text-xl text-gray-500 font-medium">No reviews yet</p>
                                    <p className="text-gray-400 mt-2">Be the first to review this company</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {modalReviews.map((review, index) => (
                                        <div key={index} className="border border-gray-200 rounded-xl p-5">
                                            {/* Review Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {renderStars(review.rating, 'md')}
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            {review.rating}.0 ★
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-gray-900">
                                                        {review.customers?.customer_name || 'Anonymous Customer'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {review.jobs?.category && `${review.jobs.category} - `}{review.jobs?.sub_service}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(review.created_at).toLocaleDateString('en-NG', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Review Content */}
                                            <div className="mb-4">
                                                <p className="text-gray-700 whitespace-pre-line">{review.comment}</p>
                                            </div>

                                            {/* Review Photos */}
                                            {review.review_photos && review.review_photos.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-600 mb-2">Review Photos:</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                        {review.review_photos.map((photo, photoIndex) => (
                                                            <a
                                                                key={photoIndex}
                                                                href={photo}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block"
                                                            >
                                                                <img
                                                                    src={photo}
                                                                    alt={`Review photo ${photoIndex + 1}`}
                                                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition"
                                                                    onError={(e) => {
                                                                        e.target.src = '/default-review-photo.jpg'
                                                                        e.target.alt = 'Image failed to load'
                                                                    }}
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 px-6 py-4">
                            <button
                                onClick={() => {
                                    setShowReviewsModal(false)
                                    setSelectedCompanyForReviews(null)
                                    setModalReviews([])
                                }}
                                className="w-full bg-naijaGreen text-white py-3 rounded-lg font-bold hover:bg-darkGreen transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}