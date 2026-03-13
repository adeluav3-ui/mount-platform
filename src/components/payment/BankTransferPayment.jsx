// src/components/payment/BankTransferPayment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSupabase } from '../../context/SupabaseContext';

const BANK_DETAILS = {
    bankName: 'MONIEPOINT MFB',
    accountName: 'MOUNT LTD',
    accountNumber: '6753109879',
};

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString()}`;

const PAYMENT_TYPE_LABELS = {
    deposit: 'Deposit (50%)',
    intermediate: 'Intermediate (30%)',
    final_payment: 'Final Payment',
};

const BankTransferPayment = () => {
    const { jobId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { supabase } = useSupabase();

    const stateData = location.state;
    const {
        reference,
        amount,           // cash amount to transfer (after credit)
        fullAmount,       // original payment amount before credit
        creditUsed = 0,   // credit portion applied
        totalAmount,
        paymentType,
        transactionId,
        paymentDescription,
    } = stateData || {};

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadingProof, setUploadingProof] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);
    const [companyName, setCompanyName] = useState('Service Provider');
    const [selectedFile, setSelectedFile] = useState(null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!reference || !jobId || !amount) {
            navigate('/dashboard', { replace: true });
            return;
        }
        fetchJobDetails();
    }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            setLoading(true);
            const { data: jobData, error: jobError } = await supabase
                .from('jobs')
                .select('id, customer_id, company_id, quoted_price, status, description, category, sub_service, custom_sub_description, location, created_at, total_amount')
                .eq('id', jobId)
                .single();

            if (jobError) throw jobError;

            if (jobData.company_id) {
                const { data: company } = await supabase
                    .from('companies').select('company_name').eq('id', jobData.company_id).single();
                if (company) setCompanyName(company.company_name);
            }

            setJob(jobData);
        } catch (error) {
            console.error('Error fetching job:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyReference = async () => {
        try {
            await navigator.clipboard.writeText(reference);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            const el = document.createElement('textarea');
            el.value = reference;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('File too large. Please use a file under 5MB.'); return; }
        setSelectedFile(file);
    };

    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('File too large. Use a file under 5MB.'); return; }
        setSelectedFile(file);
    };

    const handleProofUpload = async () => {
        if (!selectedFile || uploadingProof) return;
        setUploadingProof(true);

        try {
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${reference}_proof_${Date.now()}.${fileExt}`;
            const filePath = `payment-proofs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                if (uploadError.message.includes('row-level security'))
                    throw new Error('Storage permissions issue. Please contact support.');
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('financial_transactions')
                .update({ proof_of_payment_url: publicUrl })
                .eq('id', transactionId);

            if (updateError) console.warn('Transaction update warning:', updateError);

            if (job) {
                await supabase.from('notifications').insert({
                    user_id: job.company_id,
                    job_id: jobId,
                    type: 'payment_pending_verification',
                    title: 'Payment Proof Uploaded',
                    message: `Customer uploaded payment proof for reference: ${reference}`,
                    read: false,
                    company_id: job.company_id || null,
                    created_at: new Date().toISOString(),
                });
            }

            setProofUploaded(true);

            navigate('/payment/pending', {
                state: {
                    reference,
                    amount,
                    jobId,
                    paymentType,
                    companyName,
                    jobDescription: job?.description || '',
                    proofUploaded: true,
                    creditUsed,
                    fullAmount,
                }
            });

        } catch (error) {
            let msg = 'Upload failed. ';
            if (error.message.includes('row-level security')) msg += 'Storage permissions not configured. Please contact support.';
            else if (error.message.includes('5MB')) msg += 'File too large. Please use a file under 5MB.';
            else msg += error.message;
            alert(msg);
        } finally {
            setUploadingProof(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-[3px] border-naijaGreen border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Loading bank transfer details…</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Sticky Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <span className="text-sm font-bold text-gray-900">Bank Transfer</span>
                    <div className="w-12" />
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4">

                {/* Amount Hero */}
                <div className="bg-naijaGreen rounded-2xl p-6 text-white text-center">
                    <p className="text-sm text-white/70 mb-1 font-medium">
                        {PAYMENT_TYPE_LABELS[paymentType] || 'Payment'} · {companyName}
                    </p>
                    <p className="text-4xl font-bold">{fmt(amount)}</p>
                    {creditUsed > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                            <span className="text-xs text-white/80">💳 {fmt(creditUsed)} credit applied</span>
                        </div>
                    )}
                    <p className="text-xs text-white/50 mt-2 font-mono">Job #{jobId.substring(0, 8)}</p>
                </div>

                {/* Payment Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="font-bold text-gray-900 text-sm">Payment Details</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {[
                            { label: 'Job', value: job?.description || 'Service job' },
                            { label: 'Category', value: [job?.category, job?.sub_service].filter(Boolean).join(' · ') || '—' },
                            { label: 'Provider', value: companyName },
                            { label: 'Payment type', value: PAYMENT_TYPE_LABELS[paymentType] || paymentType },
                            ...(creditUsed > 0 ? [
                                { label: 'Original amount', value: fmt(fullAmount || amount), purple: false },
                                { label: 'Credit applied', value: `− ${fmt(creditUsed)}`, purple: true },
                                { label: 'You transfer', value: fmt(amount), bold: true },
                            ] : []),
                        ].map(({ label, value, purple, bold }) => (
                            <div key={label} className="flex justify-between items-center px-5 py-3 text-sm">
                                <span className="text-gray-500">{label}</span>
                                <span className={`font-medium text-right max-w-[60%] ${purple ? 'text-purple-600' : bold ? 'text-naijaGreen font-bold' : 'text-gray-900'}`}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-gray-900 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/10">
                        <p className="text-white font-bold text-sm">Our Bank Details</p>
                        <p className="text-white/50 text-xs mt-0.5">Transfer to this account</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { label: 'Bank', value: BANK_DETAILS.bankName },
                            { label: 'Account Name', value: BANK_DETAILS.accountName },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-white/40 text-xs mb-0.5">{label}</p>
                                <p className="text-white font-semibold">{value}</p>
                            </div>
                        ))}
                        <div>
                            <p className="text-white/40 text-xs mb-1">Account Number</p>
                            <p className="text-white text-3xl font-bold font-mono tracking-widest">{BANK_DETAILS.accountNumber}</p>
                        </div>
                    </div>
                </div>

                {/* Reference Code */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-base">🔑</div>
                        <div>
                            <p className="font-bold text-amber-900 text-sm">Payment Reference</p>
                            <p className="text-amber-700 text-xs">Include this in your transfer narration</p>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="bg-white border-2 border-amber-200 rounded-xl p-4 text-center mb-3">
                            <p className="text-2xl font-bold font-mono text-amber-900 tracking-wider">{reference}</p>
                        </div>
                        <button
                            onClick={copyReference}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                        >
                            {copied ? (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
                            ) : (
                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Reference Code</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Upload Proof */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <p className="font-bold text-gray-900 text-sm">Upload Proof of Payment</p>
                        <p className="text-xs text-gray-500 mt-0.5">Screenshot or photo of your transfer confirmation</p>
                    </div>
                    <div className="p-5">
                        {!selectedFile ? (
                            <div
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 hover:border-naijaGreen rounded-xl p-8 text-center cursor-pointer transition-colors group"
                            >
                                <div className="text-4xl mb-3">📎</div>
                                <p className="font-semibold text-gray-700 text-sm group-hover:text-naijaGreen transition-colors">Drag & drop or click to upload</p>
                                <p className="text-xs text-gray-400 mt-1">PNG, JPG, or PDF · Max 5MB</p>
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                                        {selectedFile.type.includes('pdf') ? '📄' : '🖼️'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                        className="text-gray-400 hover:text-red-500 transition text-xl"
                                    >×</button>
                                </div>
                                <button
                                    onClick={handleProofUpload}
                                    disabled={uploadingProof || proofUploaded}
                                    className="w-full bg-naijaGreen text-white py-3.5 rounded-xl font-bold text-sm hover:bg-darkGreen transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploadingProof ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading…</>
                                    ) : proofUploaded ? '✓ Proof Uploaded' : 'Submit Proof of Payment'}
                                </button>
                                <button
                                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition"
                                >
                                    Choose a different file
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Support */}
                <div className="text-center text-xs text-gray-400 pb-6 space-y-1">
                    <p>Need help? <a href="mailto:info@mountltd.com" className="text-naijaGreen hover:underline">info@mountltd.com</a> · 08139672432</p>
                    <p>Verification usually takes 5–15 minutes after upload</p>
                </div>
            </div>
        </div>
    );
};

export default BankTransferPayment;