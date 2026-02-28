// src/components/payment/PaymentPending.jsx - CORRECTED VERSION
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

const PaymentPending = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { supabase, user } = useSupabase();

    const [paymentDetails, setPaymentDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadedProof, setUploadedProof] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Get data passed from BankTransferPayment page
    const { reference, amount, paymentType, jobId } = location.state || {};

    useEffect(() => {
        if (!reference || !jobId) {
            navigate('/dashboard');
            return;
        }

        fetchPaymentDetails();
    }, [reference, jobId]);

    const fetchPaymentDetails = async () => {
        try {
            // FIX: Remove comments from the select string
            const { data, error } = await supabase
                .from('financial_transactions')
                .select(`
                *,
                jobs (
                    description,
                    status,
                    companies!inner(company_name)
                )
            `)
                .eq('bank_reference', reference)
                .single();

            if (error) throw error;

            setPaymentDetails(data);
            setUploadedProof(!!data.proof_of_payment_url);
        } catch (error) {
            console.error('Error fetching payment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadProof = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Prevent multiple uploads
        if (uploadedProof || uploading) {
            alert('Proof already uploaded. Please wait for admin verification.');
            return;
        }

        setUploading(true);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${reference}_proof_${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            console.log('📤 Uploading proof:', { fileName, filePath });

            const { error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('proofs')
                .getPublicUrl(filePath);

            console.log('✅ Proof uploaded:', publicUrl);

            // FIX 2: Use correct status 'pending' not 'pending_verification'
            const updateData = {
                proof_of_payment_url: publicUrl,
                updated_at: new Date().toISOString()
                // DON'T change status - keep it as 'pending'
            };

            const { error: updateError } = await supabase
                .from('financial_transactions')
                .update(updateData)
                .eq('bank_reference', reference);

            if (updateError) throw updateError;

            // FIX 3: Get admin user ID for notification
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .eq('role', 'admin')
                .limit(1);

            if (admins && admins.length > 0) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: admins[0].id,
                        job_id: jobId,
                        type: 'payment_pending',
                        title: 'New Payment Proof Uploaded',
                        message: `Customer uploaded proof for payment reference: ${reference}`,
                        read: false,
                        company_name: paymentDetails?.jobs?.companies?.company_name || 'Service Provider',
                        company_id: paymentDetails?.job_id || null,
                        created_at: new Date().toISOString()
                    });
            }

            setUploadedProof(true);
            alert('✅ Proof uploaded successfully! Admin will verify within 2-4 hours.');

            // Refresh payment details
            await fetchPaymentDetails();

        } catch (error) {
            console.error('Upload error:', error);

            let errorMessage = 'Upload failed. ';
            if (error.message.includes('row-level security')) {
                errorMessage += 'Storage permissions issue. Please contact support.';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment details...</p>
                </div>
            </div>
        );
    }

    // Get display values
    const displayAmount = amount || paymentDetails?.amount || 0;
    const displayType = paymentType || paymentDetails?.type || 'bank_transfer';
    const jobDescription = paymentDetails?.jobs?.description || 'Job Details';
    const companyName = paymentDetails?.jobs?.companies?.company_name || 'Service Provider';

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Payment Initiated</h1>
                    <p className="text-gray-600 mt-2">Your bank transfer has been recorded</p>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 mb-6">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-amber-600 text-3xl">⏰</span>
                        </div>

                        <h2 className="text-2xl font-bold text-amber-800 mb-3">
                            {uploadedProof ? 'Proof Uploaded ✓' : 'Awaiting Admin Verification'}
                        </h2>

                        <p className="text-gray-700 mb-6">
                            {uploadedProof
                                ? 'Your proof has been uploaded. Admin will verify within 2-4 hours.'
                                : 'Your payment is pending verification by our admin team. This usually takes 2-4 hours during business hours (9am-5pm).'
                            }
                        </p>

                        {/* Payment Details */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Reference Code:</span>
                                    <code className="font-mono font-bold text-lg bg-amber-100 px-3 py-1 rounded">
                                        {reference}
                                    </code>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-bold text-naijaGreen text-xl">
                                        ₦{displayAmount.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Type:</span>
                                    <span className="font-medium capitalize">
                                        {displayType.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Job:</span>
                                    <span className="font-medium">
                                        {jobDescription.substring(0, 50)}{jobDescription.length > 50 ? '...' : ''}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-gray-600">Service Provider:</span>
                                    <span className="font-medium">
                                        {companyName}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Already Uploaded Section */}
                        {uploadedProof && (
                            <div className="border-t border-gray-200 pt-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-green-600 text-2xl">✓</span>
                                        <div>
                                            <p className="font-medium text-green-800">Proof uploaded successfully!</p>
                                            <p className="text-sm text-green-700">
                                                Admin will verify your payment soon. You'll receive a notification once verified.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Next Steps */}
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <h4 className="font-medium text-gray-800 mb-3">What happens next:</h4>
                            <ul className="text-left text-gray-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 mt-1">1</span>
                                    <span>Admin checks our bank account for your transfer</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 mt-1">2</span>
                                    <span>Verifies the amount and reference code match</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 mt-1">3</span>
                                    <span>Updates your job status to "paid"</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-600 mt-1">4</span>
                                    <span>Notifies you and the service provider</span>
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 space-y-3">
                            <Link
                                to="/dashboard#myJobs"
                                className="block w-full px-6 py-3 bg-naijaGreen text-white rounded-lg font-medium hover:bg-darkGreen text-center"
                            >
                                View My Jobs
                            </Link>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(reference);
                                    alert('Reference code copied to clipboard!');
                                }}
                                className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Copy Reference Code
                            </button>

                            <Link
                                to="/dashboard"
                                className="block w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-center"
                            >
                                Return to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Support Info */}
                <div className="text-center text-sm text-gray-500">
                    <p>⏰ Verification time: 5-15 minutes </p>
                    <p>📞 Need help? Call: 08139672432 | Email: info@mountltd.com</p>
                    <p className="mt-2 font-medium">Keep your reference code: <code className="bg-gray-100 px-2 py-1 rounded">{reference}</code></p>
                </div>
            </div>
        </div>
    );
};

export default PaymentPending;