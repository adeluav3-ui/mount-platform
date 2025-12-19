// src/components/company/CompanyReviews.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { useSettings } from '../../context/SettingsContext';

const CompanyReviews = ({ companyId, companyName = '', showHeader = true, limit = null }) => {
    const { supabase, user } = useSupabase();
    const { getSetting } = useSettings();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });
    const [filters, setFilters] = useState({
        rating: null,
        sortBy: 'newest',
        showWithPhotos: false
    });
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    // Fetch reviews and stats
    useEffect(() => {
        if (companyId) {
            fetchReviews();
            fetchReviewStats();
        }
    }, [companyId, filters]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query
            let query = supabase
                .from('reviews')
                .select(`
                    *,
                    customers:customer_id (
                        customer_name,
                        phone,
                        email
                    ),
                    jobs:job_id (
                        category,
                        sub_service,
                        created_at
                    )
                `)
                .eq('company_id', companyId)
                .eq('is_approved', true);

            // Apply rating filter
            if (filters.rating) {
                query = query.eq('rating', filters.rating);
            }

            // Apply sorting
            switch (filters.sortBy) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'oldest':
                    query = query.order('created_at', { ascending: true });
                    break;
                case 'highest':
                    query = query.order('rating', { ascending: false });
                    break;
                case 'lowest':
                    query = query.order('rating', { ascending: true });
                    break;
            }

            // Apply photo filter
            if (filters.showWithPhotos) {
                query = query.not('review_photos', 'eq', '{}');
            }

            // Apply limit if specified
            if (limit) {
                query = query.limit(limit);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            setReviews(data || []);

        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews. Please try again.');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviewStats = async () => {
        try {
            // Get company rating stats
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('average_rating, total_reviews, reviews_summary')
                .eq('id', companyId)
                .single();

            if (companyError) throw companyError;

            if (company) {
                setStats({
                    averageRating: company.average_rating || 0,
                    totalReviews: company.total_reviews || 0,
                    ratingDistribution: company.reviews_summary || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                });
            }

        } catch (err) {
            console.error('Error fetching review stats:', err);
        }
    };

    const handleReplySubmit = async (reviewId) => {
        if (!replyText.trim() || !replyingTo) return;

        setSubmittingReply(true);
        try {
            // Update review with company response
            const { error } = await supabase
                .from('reviews')
                .update({
                    company_response: replyText,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId)
                .eq('company_id', companyId);

            if (error) throw error;

            // Refresh reviews
            fetchReviews();

            // Reset reply state
            setReplyingTo(null);
            setReplyText('');

            // Notify customer
            const review = reviews.find(r => r.id === reviewId);
            if (review?.customer_id) {
                await supabase.from('notifications').insert({
                    user_id: review.customer_id,
                    job_id: review.job_id,
                    type: 'review_response',
                    title: 'Company Responded to Your Review',
                    message: `${companyName || 'The company'} has responded to your ${review.rating}-star review.`,
                    read: false
                });
            }

        } catch (err) {
            console.error('Error submitting reply:', err);
            alert('Failed to submit reply. Please try again.');
        } finally {
            setSubmittingReply(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderStars = (rating, size = 'md') => {
        const sizeClasses = {
            sm: 'w-4 h-4',
            md: 'w-5 h-5',
            lg: 'w-6 h-6',
            xl: 'w-8 h-8'
        };

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
        );
    };

    const getRatingColor = (rating) => {
        if (rating >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
        if (rating >= 4.0) return 'text-green-600 bg-green-50 border-green-200';
        if (rating >= 3.0) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        if (rating >= 2.0) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const calculatePercentage = (count) => {
        if (stats.totalReviews === 0) return 0;
        return Math.round((count / stats.totalReviews) * 100);
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse bg-gray-100 rounded-xl h-32"></div>
                <div className="animate-pulse bg-gray-100 rounded-xl h-24"></div>
                <div className="animate-pulse bg-gray-100 rounded-xl h-24"></div>
            </div>
        );
    }

    if (error && reviews.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={fetchReviews}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            {showHeader && (
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                        {companyName ? `${companyName} Reviews` : 'Customer Reviews'}
                    </h2>
                    <p className="text-green-100 text-sm mt-1">
                        What customers say about their experience
                    </p>
                </div>
            )}

            {/* Main Content */}
            <div className="p-6">
                {/* Review Stats Summary */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Average Rating */}
                        <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                            <div className="text-4xl font-bold text-gray-900 mb-2">
                                {stats.averageRating.toFixed(1)}
                            </div>
                            <div className="flex justify-center mb-2">
                                {renderStars(Math.round(stats.averageRating), 'lg')}
                            </div>
                            <p className="text-gray-600 text-sm">
                                Average Rating
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="md:col-span-2">
                            <h4 className="font-medium text-gray-800 mb-4">Rating Distribution</h4>
                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <div key={rating} className="flex items-center">
                                        <div className="w-10 text-sm font-medium text-gray-700">
                                            {rating} ★
                                        </div>
                                        <div className="flex-1 mx-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-yellow-400 h-2 rounded-full"
                                                    style={{ width: `${calculatePercentage(stats.ratingDistribution[rating] || 0)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="w-10 text-sm text-gray-600 text-right">
                                            {stats.ratingDistribution[rating] || 0}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="flex flex-wrap gap-4">
                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sort by
                            </label>
                            <select
                                value={filters.sortBy}
                                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="highest">Highest Rated</option>
                                <option value="lowest">Lowest Rated</option>
                            </select>
                        </div>

                        {/* Rating Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by rating
                            </label>
                            <select
                                value={filters.rating || ''}
                                onChange={(e) => setFilters({
                                    ...filters,
                                    rating: e.target.value ? parseInt(e.target.value) : null
                                })}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4 Stars</option>
                                <option value="3">3 Stars</option>
                                <option value="2">2 Stars</option>
                                <option value="1">1 Star</option>
                            </select>
                        </div>

                        {/* Photos Filter */}
                        <div className="flex items-end">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.showWithPhotos}
                                    onChange={(e) => setFilters({ ...filters, showWithPhotos: e.target.checked })}
                                    className="rounded text-naijaGreen focus:ring-naijaGreen"
                                />
                                <span className="text-sm text-gray-700">Show only reviews with photos</span>
                            </label>
                        </div>

                        {/* Clear Filters */}
                        {(filters.rating || filters.showWithPhotos || filters.sortBy !== 'newest') && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({
                                        rating: null,
                                        sortBy: 'newest',
                                        showWithPhotos: false
                                    })}
                                    className="text-sm text-naijaGreen hover:text-darkGreen underline"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews List */}
                {reviews.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4 text-gray-300">⭐</div>
                        <p className="text-xl text-gray-500 font-medium">No reviews yet</p>
                        <p className="text-gray-400 mt-2">
                            {filters.rating ? `No ${filters.rating}-star reviews found` : 'Be the first to review'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                                {/* Review Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            {renderStars(review.rating)}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(review.rating)}`}>
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
                                        <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
                                        {review.jobs?.created_at && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Job: {formatDate(review.jobs.created_at)}
                                            </p>
                                        )}
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
                                            {review.review_photos.map((photo, index) => (
                                                <a
                                                    key={index}
                                                    href={photo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block"
                                                >
                                                    <img
                                                        src={photo}
                                                        alt={`Review photo ${index + 1}`}
                                                        className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition"
                                                        onError={(e) => {
                                                            e.target.src = '/default-review-photo.jpg';
                                                            e.target.alt = 'Image failed to load';
                                                        }}
                                                    />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Company Response */}
                                {review.company_response ? (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-600 font-bold">C</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="font-medium text-blue-800">Company Response</p>
                                                    <span className="text-xs text-blue-600">
                                                        {formatDate(review.updated_at)}
                                                    </span>
                                                </div>
                                                <p className="text-blue-700 whitespace-pre-line">{review.company_response}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Company Reply Form (only if company user is viewing their own reviews)
                                    user?.id === companyId && getSetting('allowCompanyResponses') && (
                                        <div className="mt-4">
                                            {replyingTo === review.id ? (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <textarea
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Type your response to this review..."
                                                        rows="3"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naijaGreen focus:border-transparent mb-3"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(null);
                                                                setReplyText('');
                                                            }}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleReplySubmit(review.id)}
                                                            disabled={submittingReply || !replyText.trim()}
                                                            className="px-4 py-2 bg-naijaGreen text-white rounded-lg hover:bg-darkGreen disabled:opacity-50 text-sm"
                                                        >
                                                            {submittingReply ? 'Posting...' : 'Post Response'}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Your response will be public and visible to all customers.
                                                    </p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setReplyingTo(review.id)}
                                                    className="text-sm text-naijaGreen hover:text-darkGreen font-medium flex items-center gap-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                    </svg>
                                                    Respond to this review
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Load More / Pagination */}
                {limit && reviews.length >= limit && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => window.location.href = `/company/${companyId}/reviews`}
                            className="px-6 py-2 border-2 border-naijaGreen text-naijaGreen rounded-lg font-medium hover:bg-naijaGreen hover:text-white transition-colors"
                        >
                            View All Reviews
                        </button>
                    </div>
                )}

                {/* Review Guidelines */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3">Review Guidelines</h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Reviews are based on actual customer experiences</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Companies can respond to reviews to provide clarification or address concerns</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Inappropriate content or fake reviews are removed</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            <span>Customers can upload photos to support their review</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CompanyReviews;