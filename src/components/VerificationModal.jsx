import React, { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';

const VerificationModal = ({ isOpen, onClose, onVerificationSubmitted }) => {
    const { user, supabase } = useSupabase();
    const [step, setStep] = useState(1); // 1: ID type, 2: Upload, 3: Processing
    const [idType, setIdType] = useState('');
    const [idNumber, setIdNumber] = useState('');
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [selfieImage, setSelfieImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const ID_TYPES = [
        { value: 'nin', label: 'NIN (National Identification Number)' },
        { value: 'driver_license', label: 'Driver\'s License' },
        { value: 'passport', label: 'International Passport' }
    ];

    const handleImageUpload = (e, setImageFunction, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError(`${fieldName} file size must be less than 5MB`);
                return;
            }
            if (!file.type.startsWith('image/')) {
                setError(`${fieldName} must be an image file (JPEG, PNG, etc.)`);
                return;
            }
            setImageFunction(file);
            setError('');
        }
    };
    const uploadToStorage = async (file, path) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        // ADD THIS: Check if user is authenticated
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        const { error: uploadError } = await supabase.storage
            .from('verification-uploads')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false // Important: don't overwrite existing files
            });

        if (uploadError) {
            console.error('Upload error details:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('verification-uploads')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async () => {
        if (!idType) {
            setError('Please select an ID type');
            setStep(1);
            return;
        }

        if (!frontImage) {
            setError('Please upload the front of your ID');
            return;
        }

        setUploading(true);
        setStep(3);

        try {
            // Upload images to Supabase Storage
            const frontUrl = await uploadToStorage(frontImage, 'front');
            const backUrl = backImage ? await uploadToStorage(backImage, 'back') : null;
            const selfieUrl = selfieImage ? await uploadToStorage(selfieImage, 'selfie') : null;

            // Create verification request in database
            const { error: dbError } = await supabase
                .from('id_verifications')
                .insert({
                    customer_id: user.id,
                    id_type: idType,
                    id_number: idNumber || null, // Make optional
                    front_url: frontUrl,
                    back_url: backUrl,
                    selfie_url: selfieUrl,
                    status: 'pending'
                });

            if (dbError) throw dbError;

            // Update customer verification status to pending
            await supabase
                .from('customers')
                .update({ verification_level: 'pending' })
                .eq('id', user.id);

            // Callback to update parent component
            if (onVerificationSubmitted) {
                onVerificationSubmitted('pending');
            }

            // Show success message
            setTimeout(() => {
                onClose();
                alert('✅ Verification submitted successfully! Our team will review it within 24 hours.');
            }, 2000);

        } catch (err) {
            console.error('Verification submission error:', err);
            setError('Failed to submit verification. Please try again.');
            setStep(2);
        } finally {
            setUploading(false);
        }
    };

    const renderStep1 = () => (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Step 1: Select ID Type</h3>
            <div className="space-y-3 mb-6">
                {ID_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center">
                        <input
                            type="radio"
                            id={type.value}
                            name="idType"
                            value={type.value}
                            checked={idType === type.value}
                            onChange={(e) => setIdType(e.target.value)}
                            className="h-4 w-4 text-naijaGreen"
                        />
                        <label htmlFor={type.value} className="ml-3 text-gray-700">
                            {type.label}
                        </label>
                    </div>
                ))}
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                    ID Number <span className="text-gray-500 text-sm">(Optional)</span>
                </label>
                <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl"
                    placeholder="Enter your ID number (optional)"
                />
                <p className="text-sm text-gray-500 mt-1">
                    Providing your ID number helps speed up verification
                </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-xl mb-6">
                <h4 className="font-bold text-yellow-800 mb-2">📋 Required Documents:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Clear photo of ID front <span className="text-red-500">(Required)</span></li>
                    <li>• Clear photo of ID back <span className="text-gray-600">(If applicable)</span></li>
                    <li>• Optional: Selfie with ID (speeds up verification)</li>
                </ul>
                <p className="text-xs text-yellow-600 mt-2">
                    Your documents are securely stored and only visible to our admin team
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => idType ? setStep(2) : setError('Please select an ID type')}
                    className="bg-naijaGreen text-white px-6 py-3 rounded-xl font-medium hover:bg-darkGreen"
                >
                    Next: Upload Documents →
                </button>
            </div>
        </div>
    );
    const handleClose = () => {
        if (!uploading) {
            // Reset form state
            setIdType('');
            setIdNumber('');
            setFrontImage(null);
            setBackImage(null);
            setSelfieImage(null);
            setStep(1);
            setError('');
            onClose();
        }
    };
    const renderStep2 = () => (
        <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Step 2: Upload Documents</h3>

            <div className="space-y-6">
                {/* Front of ID */}
                <div>
                    <label className="block text-gray-700 mb-2">
                        Front of ID <span className="text-red-500">* Required</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                        {frontImage ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                        📷
                                    </div>
                                    <div>
                                        <p className="font-medium">{frontImage.name}</p>
                                        <p className="text-sm text-gray-500">{(frontImage.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFrontImage(null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-500 mb-2">Upload front photo of your ID</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, setFrontImage, 'Front ID')}
                                    className="hidden"
                                    id="front-upload"
                                />
                                <label
                                    htmlFor="front-upload"
                                    className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200"
                                    onClick={(e) => e.preventDefault()}  // ← ADD THIS LINE
                                >
                                    Choose File
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Back of ID (Optional) */}
                <div>
                    <label className="block text-gray-700 mb-2">Back of ID (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                        {backImage ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                        📷
                                    </div>
                                    <div>
                                        <p className="font-medium">{backImage.name}</p>
                                        <p className="text-sm text-gray-500">{(backImage.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setBackImage(null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-500 mb-2">Upload back photo of your ID</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, setBackImage)}
                                    className="hidden"
                                    id="back-upload"
                                />
                                <label
                                    htmlFor="back-upload"
                                    className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    Choose File
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Selfie with ID (Optional) */}
                <div>
                    <label className="block text-gray-700 mb-2">Selfie with ID (Optional)</label>
                    <p className="text-sm text-gray-500 mb-2">Helps speed up verification</p>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                        {selfieImage ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                        📸
                                    </div>
                                    <div>
                                        <p className="font-medium">{selfieImage.name}</p>
                                        <p className="text-sm text-gray-500">{(selfieImage.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelfieImage(null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-gray-500 mb-2">Upload selfie holding your ID</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, setSelfieImage)}
                                    className="hidden"
                                    id="selfie-upload"
                                />
                                <label
                                    htmlFor="selfie-upload"
                                    className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    Choose File
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
                >
                    ← Back
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!frontImage || uploading}
                    className="bg-naijaGreen text-white px-6 py-3 rounded-xl font-medium hover:bg-darkGreen disabled:opacity-50"
                >
                    {uploading ? 'Submitting...' : 'Submit Verification'}
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Submitting Verification</h3>
            <p className="text-gray-600">Please wait while we process your documents...</p>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">Identity Verification</h3>
                        <p className="text-gray-600">Get verified to build trust with service providers</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                        disabled={uploading}
                    >
                        ✕
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between mb-8 relative">
                    {[1, 2, 3].map((stepNum) => (
                        <div key={stepNum} className="flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= stepNum ? 'bg-naijaGreen text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {stepNum}
                            </div>
                            <span className="text-sm mt-2">
                                {stepNum === 1 ? 'ID Details' : stepNum === 2 ? 'Upload' : 'Submit'}
                            </span>
                        </div>
                    ))}
                    <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 -z-10"></div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}

                {/* Benefits Footer */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-2">✅ Benefits of Verification:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                            <p className="font-medium text-green-700">Priority Service</p>
                            <p className="text-sm text-green-600">Companies prioritize verified customers</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Higher Trust Score</p>
                            <p className="text-sm text-blue-600">Build credibility on the platform</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="font-medium text-purple-700">Faster Matching</p>
                            <p className="text-sm text-purple-600">Get matched with top-rated companies faster</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;