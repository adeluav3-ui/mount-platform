import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const VerificationReview = () => {
    const { supabase } = useSupabase();
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVerification, setSelectedVerification] = useState(null);
    const [reviewNote, setReviewNote] = useState('');

    // Fetch pending verifications
    const fetchVerifications = async () => {
        try {
            const { data, error } = await supabase
                .from('id_verifications')
                .select(`
                    *,
                    customers:customer_id (
                        customer_name,
                        email,
                        phone
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setVerifications(data || []);
        } catch (error) {
            console.error('Error fetching verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifications();
    }, []);

    const handleApprove = async (verificationId) => {
        if (!reviewNote.trim()) {
            alert('Please add a review note (e.g., "Documents verified")');
            return;
        }

        try {
            const { error } = await supabase
                .from('id_verifications')
                .update({
                    status: 'approved',
                    reviewed_by: (await supabase.auth.getUser()).data.user.id,
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: null
                })
                .eq('id', verificationId);

            if (error) throw error;

            // Update customer verification level (trigger should handle this)
            const verification = verifications.find(v => v.id === verificationId);
            await supabase
                .from('customers')
                .update({
                    verification_level: 'verified',
                    id_verified_at: new Date().toISOString()
                })
                .eq('id', verification.customer_id);

            alert('Verification approved!');
            fetchVerifications();
            setSelectedVerification(null);
            setReviewNote('');
        } catch (error) {
            console.error('Error approving verification:', error);
            alert('Failed to approve verification');
        }
    };

    const handleReject = async (verificationId) => {
        if (!reviewNote.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            const { error } = await supabase
                .from('id_verifications')
                .update({
                    status: 'rejected',
                    reviewed_by: (await supabase.auth.getUser()).data.user.id,
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: reviewNote
                })
                .eq('id', verificationId);

            if (error) throw error;

            // Reset customer verification level
            const verification = verifications.find(v => v.id === verificationId);
            await supabase
                .from('customers')
                .update({ verification_level: 'basic' })
                .eq('id', verification.customer_id);

            alert('Verification rejected');
            fetchVerifications();
            setSelectedVerification(null);
            setReviewNote('');
        } catch (error) {
            console.error('Error rejecting verification:', error);
            alert('Failed to reject verification');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-NG', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    const getIDTypeLabel = (type) => {
        const labels = {
            'nin': 'NIN',
            'driver_license': "Driver's License",
            'passport': 'Passport'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-naijaGreen"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">ID Verification Queue</h1>
                    <p className="text-gray-600">
                        {verifications.length} pending verification{verifications.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={fetchVerifications}
                    className="bg-naijaGreen text-white px-4 py-2 rounded-lg hover:bg-darkGreen"
                >
                    Refresh
                </button>
            </div>

            {verifications.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">All Clear!</h3>
                    <p className="text-green-600">No pending verification requests</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Verification List */}
                    <div className="lg:col-span-1 space-y-4">
                        {verifications.map((verification) => (
                            <div
                                key={verification.id}
                                className={`bg-white rounded-xl shadow p-4 cursor-pointer border-2 transition-all ${selectedVerification?.id === verification.id ? 'border-naijaGreen' : 'border-transparent'}`}
                                onClick={() => setSelectedVerification(verification)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-800">
                                            {verification.customers?.customer_name || 'Unknown Customer'}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {getIDTypeLabel(verification.id_type)}
                                            {verification.id_number && ` • ${verification.id_number}`}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Submitted: {formatDate(verification.created_at)}
                                        </p>
                                    </div>
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                        Pending
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Review Panel */}
                    <div className="lg:col-span-2">
                        {selectedVerification ? (
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800">
                                            {selectedVerification.customers?.customer_name || 'Unknown Customer'}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                                                {getIDTypeLabel(selectedVerification.id_type)}
                                            </span>
                                            <span className="text-gray-600">
                                                {selectedVerification.customers?.email}
                                            </span>
                                            <span className="text-gray-600">
                                                📞 {selectedVerification.customers?.phone}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedVerification(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Document Viewer */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-2">Front of ID</h4>
                                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                                            <img
                                                src={selectedVerification.front_url}
                                                alt="ID Front"
                                                className="w-full h-64 object-contain bg-gray-50"
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'}
                                            />
                                        </div>
                                    </div>

                                    {selectedVerification.back_url && (
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2">Back of ID</h4>
                                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                                <img
                                                    src={selectedVerification.back_url}
                                                    alt="ID Back"
                                                    className="w-full h-64 object-contain bg-gray-50"
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {selectedVerification.selfie_url && (
                                        <div className="md:col-span-2">
                                            <h4 className="font-bold text-gray-700 mb-2">Selfie with ID</h4>
                                            <div className="border border-gray-300 rounded-lg overflow-hidden max-w-md">
                                                <img
                                                    src={selectedVerification.selfie_url}
                                                    alt="Selfie with ID"
                                                    className="w-full h-64 object-contain bg-gray-50"
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Review Actions */}
                                <div className="border-t pt-6">
                                    <h4 className="font-bold text-gray-700 mb-3">Review Decision</h4>
                                    <textarea
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                        placeholder="Enter review notes (required)..."
                                        className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                                        rows="3"
                                    />

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleApprove(selectedVerification.id)}
                                            className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600"
                                        >
                                            ✅ Approve Verification
                                        </button>
                                        <button
                                            onClick={() => handleReject(selectedVerification.id)}
                                            className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600"
                                        >
                                            ❌ Reject Verification
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl h-full flex items-center justify-center p-8">
                                <div className="text-center">
                                    <div className="text-5xl mb-4">📋</div>
                                    <h3 className="text-xl font-bold text-gray-700 mb-2">Select a Verification</h3>
                                    <p className="text-gray-600">Choose a pending verification from the list to review</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerificationReview;