// src/components/review/ReviewSubmission.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

const ReviewSubmission = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { supabase, user } = useSupabase();

    const [job, setJob] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState([]);
    const [photoFiles, setPhotoFiles] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const photoInputRef = useRef(null);

    // Fetch job and company details
    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);

                // Fetch job details
                // Fetch job details without company relation
                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*')
                    .eq('id', jobId)
                    .eq('customer_id', user.id)
                    .single();

                if (jobError) {
                    console.error('❌ Error fetching job:', jobError);
                    throw jobError;
                }
                if (!jobData) {
                    throw new Error('Job not found or you are not authorized');
                }

                // Check if job is completed
                if (jobData.status !== 'completed') {
                    throw new Error('Only completed jobs can be reviewed');
                }

                // Check if already reviewed - UPDATE THIS CHECK
                if (jobData.review_id || jobData.reviewed === true) {
                    alert('You have already reviewed this job.');
                    navigate('/dashboard#myJobs');
                    return;
                }

                // Fetch company separately
                let companyData = null;
                if (jobData.company_id) {
                    const { data: company, error: companyError } = await supabase
                        .from('companies')
                        .select('*')
                        .eq('id', jobData.company_id)
                        .single();

                    if (companyError) {
                        console.error('⚠️ Error fetching company (continuing without):', companyError);
                    } else {
                        companyData = company;
                    }
                }

                setJob(jobData);
                setCompany(companyData);

            } catch (error) {
                console.error('Error fetching job details:', error);
                alert(`Error: ${error.message}`);
                navigate('/dashboard#myJobs');
            } finally {
                setLoading(false);
            }
        };

        if (jobId && user) {
            fetchDetails();
        }
    }, [jobId, user, supabase, navigate]);

    // Handle photo selection
    const handlePhotoSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length + photos.length > 5) {
            alert('Maximum 5 photos allowed');
            return;
        }

        setPhotoFiles(prev => [...prev, ...files]);

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
    };

    // Remove photo
    const removePhoto = (index) => {
        setPhotoFiles(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Upload photos
    const uploadPhotos = async () => {
        if (photoFiles.length === 0) return [];

        const uploadedUrls = [];

        for (const file of photoFiles) {
            try {
                const fileName = `${user.id}/reviews/${Date.now()}_${Math.random().toString(36).slice(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

                const { error } = await supabase.storage
                    .from('review-photos')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from('review-photos')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            } catch (error) {
                console.error('Photo upload failed:', error);
                // Continue with other photos even if one fails
            }
        }

        return uploadedUrls;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!comment.trim()) {
            alert('Please provide a comment for your review');
            return;
        }

        if (comment.trim().length < 10) {
            alert('Please write a more detailed review (at least 10 characters)');
            return;
        }

        setSubmitting(true);

        try {
            // Upload photos first
            const uploadedPhotos = await uploadPhotos();

            // Insert review
            const { data: review, error: reviewError } = await supabase
                .from('reviews')
                .insert({
                    job_id: jobId,
                    customer_id: user.id,
                    company_id: company.id,
                    rating,
                    comment: comment.trim(),
                    review_photos: uploadedPhotos,
                    is_approved: true // Assuming auto-approval for now
                })
                .select()
                .single();

            if (reviewError) throw reviewError;

            console.log('📝 Update payload:', {
                review_id: review.id,
                customer_rating: rating,
                customer_review: comment.trim(),
                reviewed: true,
                jobId: jobId
            });

            // Update job with review_id, customer_rating, AND reviewed flag
            const { error: jobUpdateError } = await supabase
                .from('jobs')
                .update({
                    review_id: review.id,
                    customer_rating: rating,
                    customer_review: comment.trim(),
                    reviewed: true,  // ← This should be lowercase true
                    completion_date: new Date().toISOString(),
                    payment_verified: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (jobUpdateError) {
                console.error('❌ Failed to update job:', jobUpdateError);
                throw jobUpdateError;
            }

            const { data: updatedJob } = await supabase
                .from('jobs')
                .select('reviewed, review_id, customer_rating, customer_review')
                .eq('id', jobId)
                .single();

            console.log('✅ After update verification:', updatedJob);

            console.log('✅ Review submitted and job updated:', {
                jobId,
                reviewId: review.id,
                rating,
                reviewedFlagSet: true
            });

            // Create notification for the company
            await supabase
                .from('notifications')
                .insert({
                    user_id: company.id,
                    job_id: jobId,
                    type: 'new_review',
                    title: 'New Review Received! ⭐',
                    message: `A customer left a ${rating}-star review for your "${job.sub_service || job.category}" job.`,
                    read: false
                });

            console.log('✅ Review submitted:', {
                jobId,
                reviewId: review.id,
                jobUpdateSuccess: !jobUpdateError
            });

            if (jobUpdateError) {
                console.error('❌ Failed to update job with review_id:', jobUpdateError);
            }

            // Success message
            alert('Thank you for your review! Your feedback helps improve our platform.');

            // Redirect to dashboard
            navigate('/dashboard#myJobs');

        } catch (error) {
            console.error('Failed to submit review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Clean up preview URLs
    useEffect(() => {
        return () => {
            photoPreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [photoPreviews]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading review form...</p>
                </div>
            </div>
        );
    }

    if (!job || !company) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-2xl mx-auto mt-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                        <p className="text-center text-gray-600">Job not found or you are not authorized to review it.</p>
                        <Link to="/dashboard" className="block text-center mt-4 text-naijaGreen hover:underline">
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/dashboard#myJobs" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-900">Leave a Review</h1>
                    <p className="text-gray-600 mt-2">
                        Share your experience with {company.company_name}
                    </p>
                </div>

                {/* Job Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
                    <h3 className="font-semibold mb-4">Job Details</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Service:</span>
                            <span className="font-medium">{job.category} - {job.sub_service}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Company:</span>
                            <span className="font-medium">{company.company_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-bold text-naijaGreen">₦{(job.quoted_price || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Completed:</span>
                            <span className="text-sm text-gray-500">
                                {new Date(job.updated_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Review Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Rating Selection */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-3">
                                How would you rate this service?
                            </label>
                            <div className="flex items-center space-x-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-3xl focus:outline-none transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span className="ml-4 text-lg font-bold text-gray-800">
                                    {rating}.0 out of 5
                                </span>
                            </div>
                            <div className="flex justify-between mt-2 text-sm text-gray-500">
                                <span>Poor</span>
                                <span>Excellent</span>
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-2">
                                Your Review
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Tell us about your experience. What went well? What could be improved?"
                                rows="5"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-naijaGreen focus:border-transparent resize-none"
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Minimum 10 characters. Be honest and helpful to other customers.
                            </p>
                        </div>

                        {/* Photo Upload */}
                        <div className="mb-6">
                            <div className="border-2 border-dashed border-gray-400 rounded-xl p-6 text-center hover:border-naijaGreen transition cursor-pointer relative">
                                <p className="text-gray-600 mb-1">Click to upload photos</p>
                                <p className="text-sm text-gray-500">Maximum 5 photos</p>
                                <input
                                    type="file"
                                    ref={photoInputRef}
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoSelect}
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            {/* Photo Previews */}
                            {photoPreviews.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {photoPreviews.map((src, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={src}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-24 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs px-2 py-1 hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Guidelines */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-800 mb-2">Review Guidelines</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                                <li>• Be honest about your experience</li>
                                <li>• Focus on the service quality, not personal issues</li>
                                <li>• Include specific details that would help other customers</li>
                                <li>• Avoid sharing personal or sensitive information</li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <Link
                                to="/dashboard#myJobs"
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-center"
                            >
                                Skip Review
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting || !comment.trim()}
                                className="flex-1 px-6 py-3 bg-naijaGreen text-white rounded-lg font-medium hover:bg-darkGreen disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit Review'
                                )}
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 text-center mt-4">
                            Your review will be publicly visible on the company's profile
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewSubmission;