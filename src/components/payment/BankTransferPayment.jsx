// src/components/payment/BankTransferPayment.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

const BankTransferPayment = () => {
    const { jobId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { supabase, user } = useSupabase();

    // Get data passed from PaymentPage
    const { reference, amount, totalAmount, paymentType, transactionId } = location.state || {};

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);
    const [companyName, setCompanyName] = useState('Service Provider');

    useEffect(() => {
        if (!reference || !jobId || !amount) {
            console.error('Missing required data:', { reference, jobId, amount });
            navigate('/dashboard');
            return;
        }

        console.log('📦 Received data:', { reference, amount, paymentType, transactionId });
        fetchJobDetails();
    }, [jobId, reference]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);

            // Fix: Use single-line select string without line breaks
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('id, customer_id, company_id, quoted_price, status, description, category, sub_service, custom_sub_description, location, created_at, total_amount')
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;

            console.log('📋 Job data loaded:', jobData);

            // Fetch company name if company_id exists
            if (jobData.company_id) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('company_name')
                    .eq('id', jobData.company_id)
                    .single();

                if (company) {
                    setCompanyName(company.company_name);
                }
            }

            setJob(jobData);
        } catch (error) {
            console.error('Error fetching job:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProofUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadingProof(true);

        try {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size must be less than 5MB');
            }

            // Create folder path
            const fileExt = file.name.split('.').pop();
            const fileName = `${reference}_proof_${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            console.log('📤 Uploading file:', { fileName, filePath, size: file.size });

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('❌ Storage upload error:', uploadError);

                if (uploadError.message.includes('row-level security')) {
                    throw new Error('Storage permissions issue. Run the SQL policies in Supabase.');
                }
                throw uploadError;
            }

            console.log('✅ File uploaded:', uploadData);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('proofs')
                .getPublicUrl(filePath);

            console.log('🔗 Public URL:', publicUrl);

            // Update transaction with ONLY proof_of_payment_url
            const updateData = {
                proof_of_payment_url: publicUrl
            };

            console.log('🔄 Updating transaction ID:', transactionId, 'with:', updateData);

            const { data: updateResult, error: updateError } = await supabase
                .from('financial_transactions')
                .update(updateData)
                .eq('id', transactionId); // Use transactionId, not reference

            if (updateError) {
                console.error('❌ Transaction update failed:', updateError);
                // Don't throw - just log and continue
            }

            // Create admin notification
            // Create notification with CORRECT columns
            await supabase
                .from('notifications')
                .insert({
                    user_id: user.id, // The admin's user ID - you'll need to get this
                    job_id: jobId,
                    type: 'payment_pending',
                    title: 'New Payment Proof Uploaded',
                    message: `Customer uploaded proof for payment reference: ${reference}`,
                    read: false,
                    company_name: companyName,
                    company_id: job?.company_id || null,
                    created_at: new Date().toISOString()
                });

            setProofUploaded(true);

            alert('✅ Proof uploaded successfully! Admin will verify within 2-4 hours.');

            // Navigate to pending page
            navigate('/payment/pending', {
                state: {
                    reference: reference,
                    amount: amount,
                    jobId: jobId,
                    paymentType: paymentType
                }
            });

        } catch (error) {
            console.error('❌ Upload error:', error);

            let errorMessage = 'Upload failed. ';
            if (error.message.includes('row-level security')) {
                errorMessage += 'Storage permissions not configured. Please contact support.';
            } else if (error.message.includes('5MB')) {
                errorMessage += 'File too large. Please use a file under 5MB.';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        } finally {
            setUploadingProof(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bank transfer details...</p>
                </div>
            </div>
        );
    }

    // Your actual bank details (replace with yours)
    const bankDetails = {
        bankName: 'MONIEPOINT MFB',
        accountName: 'MOUNT LTD',
        accountNumber: '6753109879',
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Pay via Bank Transfer</h1>
                    <p className="text-gray-600 mt-2">Secure payment to Mount's official account</p>
                </div>

                {/* Payment Summary */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Payment Summary</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-gray-600">Job Description</span>
                            <span className="font-medium">{job?.description || 'Job Details'}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-gray-600">Service</span>
                            <span className="font-medium">{job?.category} - {job?.sub_service}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-gray-600">Service Provider</span>
                            <span className="font-medium">{companyName}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-gray-600">Payment Type</span>
                            <span className="font-medium capitalize">{paymentType || 'Bank Transfer'} Payment</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-lg font-bold">Amount to Pay</span>
                            <span className="text-2xl font-bold text-naijaGreen">₦{amount?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-gradient-to-r from-naijaGreen to-darkGreen text-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-6">Our Bank Details</h2>

                    <div className="space-y-4">
                        <div className="bg-white/10 p-4 rounded-lg">
                            <p className="text-sm opacity-80">Bank Name</p>
                            <p className="text-xl font-bold">{bankDetails.bankName}</p>
                        </div>

                        <div className="bg-white/10 p-4 rounded-lg">
                            <p className="text-sm opacity-80">Account Name</p>
                            <p className="text-xl font-bold">{bankDetails.accountName}</p>
                        </div>

                        <div className="bg-white/10 p-4 rounded-lg">
                            <p className="text-sm opacity-80">Account Number</p>
                            <p className="text-3xl font-bold font-mono tracking-wider">
                                {bankDetails.accountNumber}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reference Code */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                            <span className="text-amber-600 text-xl">🔑</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800">Important: Reference Code</h3>
                            <p className="text-amber-700 text-sm">You MUST include this code in your transfer</p>
                        </div>
                    </div>

                    <div className="bg-white border-2 border-amber-300 p-4 rounded-lg">
                        <p className="text-center text-2xl font-bold font-mono text-amber-800">
                            {reference}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(reference);
                            alert('Reference code copied to clipboard!');
                        }}
                        className="w-full mt-4 bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700"
                    >
                        Copy Reference Code
                    </button>
                </div>

                {/* Upload Proof Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4">Upload Proof of Payment</h3>
                    <p className="text-gray-600 mb-6">Upload a screenshot of your successful transfer confirmation</p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <div className="text-5xl mb-4">📎</div>
                        <p className="font-medium mb-2">Drag & drop or click to upload</p>
                        <p className="text-sm text-gray-500 mb-4">PNG, JPG, or PDF (Max 5MB)</p>

                        <label className="cursor-pointer inline-block">
                            <span className="bg-naijaGreen text-white px-6 py-3 rounded-lg font-medium hover:bg-darkGreen">
                                {uploadingProof ? 'Uploading...' : proofUploaded ? '✓ Proof Uploaded' : 'Choose File'}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={handleProofUpload}
                                disabled={uploadingProof || proofUploaded}
                            />
                        </label>
                    </div>
                </div>

                {/* Support Info */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Need help? Contact support: info@mountltd.com | 08139672432</p>
                    <p className="mt-2">Verification usually takes 5-15 minutes </p>
                </div>
            </div>
        </div>
    );
};

export default BankTransferPayment;