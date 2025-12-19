// src/components/payment/PaymentProofUpload.jsx
import React, { useState } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

export default function PaymentProofUpload({ reference, amount, jobId, bankDetails }) {
    const { supabase } = useSupabase();
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${reference}_${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('proofs')
                .getPublicUrl(filePath);

            // Update transaction with proof URL
            await supabase
                .from('financial_transactions')
                .update({ proof_of_payment_url: publicUrl })
                .eq('bank_reference', reference);

            setUploaded(true);

            // Show success message
            alert('Proof uploaded successfully! Admin will verify within 2-4 hours.');

        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="text-center">
            <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <span className="text-2xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment Reference Generated</h2>
                <p className="text-gray-600">Complete your bank transfer with the details below</p>
            </div>

            {/* Reference Code - Prominent Display */}
            <div className="bg-naijaGreen text-white p-6 rounded-xl mb-8">
                <p className="text-sm mb-2">REFERENCE CODE (MUST INCLUDE)</p>
                <p className="text-3xl font-bold font-mono tracking-wider">{reference}</p>
                <p className="text-sm mt-2 opacity-90">Include this code in your transfer description</p>
            </div>

            {/* Bank Details Again */}
            <div className="bg-gray-50 p-6 rounded-xl mb-8 text-left">
                <h3 className="font-bold mb-4">Transfer to:</h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-600">Bank</p>
                        <p className="font-semibold">{bankDetails.bank}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Account Name</p>
                        <p className="font-semibold">{bankDetails.accountName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Account Number</p>
                        <p className="font-semibold text-2xl">{bankDetails.accountNumber}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-semibold text-xl">₦{amount.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Upload Proof Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-6">
                <h3 className="font-bold mb-4">Upload Proof of Payment</h3>
                <p className="text-gray-600 mb-6">Upload screenshot of your transfer confirmation</p>

                <label className="cursor-pointer inline-flex items-center px-6 py-3 bg-naijaGreen text-white rounded-lg hover:bg-darkGreen">
                    {uploading ? 'Uploading...' : uploaded ? '✓ Proof Uploaded' : 'Choose File'}
                    <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        disabled={uploading || uploaded}
                    />
                </label>

                {uploaded && (
                    <p className="text-green-600 mt-4">
                        Thank you! We'll notify you once admin verifies your payment.
                    </p>
                )}
            </div>

            <div className="text-sm text-gray-500">
                <p>⏰ Verification time: 2-4 business hours</p>
                <p>📞 Need help? Call: 0800-MOUNT-NG</p>
            </div>
        </div>
    );
}