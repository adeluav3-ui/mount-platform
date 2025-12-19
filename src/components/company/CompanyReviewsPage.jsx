// src/components/company/CompanyReviewsPage.jsx - UPDATED WITH CONTEXT-AWARE BACK BUTTON
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import CompanyReviews from "../review/CompanyReviews";
import { useSupabase } from '../../context/SupabaseContext';

export default function CompanyReviewsPage() {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSupabase();

    const [companyName, setCompanyName] = useState('');
    const [backButtonText, setBackButtonText] = useState('Back to Dashboard');
    const [backDestination, setBackDestination] = useState(-1); // Default: browser back

    // Determine context and set appropriate back button
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const fromStep2 = queryParams.get('from') === 'step2';
        const context = queryParams.get('context');
        const jobId = queryParams.get('jobId');

        // Check if we have window.opener (opened from another window/tab)
        const hasOpener = window.opener && !window.opener.closed;

        console.log('Context check:', { fromStep2, context, hasOpener });

        if (fromStep2 || context === 'customer') {
            setBackButtonText('← Back to Companies');

            // If opened from another tab/window
            if (hasOpener) {
                // Close this tab and go back to original
                setBackDestination('close');
            } else {
                // Navigate to Step2Companies in same tab
                setBackDestination('/post-job/step2');
            }
        } else if (user?.role === 'company') {
            setBackButtonText('← Back to Company Dashboard');
            setBackDestination('/company-dashboard');
        } else {
            setBackButtonText('← Back to Dashboard');
            setBackDestination('/dashboard');
        }

        // Fetch company name for the title
        const fetchCompanyName = async () => {
            const { supabase } = await import('../../context/SupabaseContext');
            const { data } = await supabase.supabase
                .from('companies')
                .select('company_name')
                .eq('id', companyId)
                .single();

            if (data) {
                setCompanyName(data.company_name);
            }
        };

        fetchCompanyName();
    }, [companyId, location.search, user?.role]);

    const handleBackClick = () => {
        if (backDestination === 'close' && window.opener && !window.opener.closed) {
            window.close(); // Close this tab
        } else if (typeof backDestination === 'string') {
            navigate(backDestination);
        } else {
            navigate(backDestination);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBackClick}
                        className="flex items-center gap-2 text-naijaGreen font-bold hover:underline"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        {backButtonText}
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">
                        {companyName ? `${companyName} Reviews` : 'Company Reviews'}
                    </h1>
                    <div className="w-20"></div> {/* Spacer for alignment */}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <CompanyReviews
                    companyId={companyId}
                    showHeader={false}
                    companyName={companyName}
                />
            </div>
        </div>
    );
}