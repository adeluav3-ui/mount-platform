// src/components/company/CompanyReviewsPage.jsx — REFINED VERSION
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import CompanyReviews from '../review/CompanyReviews'
import { useSupabase } from '../../context/SupabaseContext'

export default function CompanyReviewsPage() {
    const { companyId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { user, supabase } = useSupabase() // BUG FIX: import supabase directly from context
    // Original did a broken dynamic import:
    // `const { supabase } = await import('../../context/SupabaseContext')`
    // then called `supabase.supabase.from(...)` — double .supabase

    const [companyName, setCompanyName] = useState('')
    const [loading, setLoading] = useState(true)
    const [backButtonText, setBackButtonText] = useState('Back')
    const [backDestination, setBackDestination] = useState(null)

    // ── Determine context and back button ────────────────────────────────────
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search)
        const fromStep2 = queryParams.get('from') === 'step2'
        const context = queryParams.get('context')
        const hasOpener = window.opener && !window.opener.closed

        if (fromStep2 || context === 'customer') {
            setBackButtonText('Back to Companies')
            setBackDestination(hasOpener ? 'close' : '/post-job/step2')
        } else if (user?.role === 'company') {
            setBackButtonText('Back to Company Dashboard')
            setBackDestination('/company-dashboard')
        } else {
            setBackButtonText('Back to Dashboard')
            setBackDestination('/dashboard')
        }
    }, [location.search, user?.role])

    // ── Fetch company name ────────────────────────────────────────────────────
    useEffect(() => {
        if (!companyId || !supabase) return

        const fetchCompanyName = async () => {
            setLoading(true)
            try {
                // BUG FIX: original called supabase.supabase.from(...) — double accessor
                const { data } = await supabase
                    .from('companies')
                    .select('company_name')
                    .eq('id', companyId)
                    .single()

                if (data) setCompanyName(data.company_name)
            } catch (error) {
                console.error('Failed to fetch company name:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCompanyName()
    }, [companyId, supabase])

    const handleBackClick = () => {
        if (backDestination === 'close') {
            // Close tab if opened from another window
            if (window.opener && !window.opener.closed) {
                window.close()
            } else {
                navigate('/post-job/step2')
            }
        } else if (backDestination) {
            navigate(backDestination)
        } else {
            navigate(-1) // Browser back as final fallback
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <button
                        onClick={handleBackClick}
                        className="flex items-center gap-2 text-naijaGreen font-semibold hover:underline text-sm shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline">{backButtonText}</span>
                        <span className="sm:hidden">Back</span>
                    </button>

                    <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate text-center">
                        {loading ? (
                            <span className="inline-block w-32 h-4 bg-gray-200 rounded animate-pulse" />
                        ) : companyName ? (
                            `${companyName} — Reviews`
                        ) : (
                            'Company Reviews'
                        )}
                    </h1>

                    {/* Spacer to keep title centred */}
                    <div className="w-20 shrink-0" />
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                <CompanyReviews
                    companyId={companyId}
                    showHeader={false}
                    companyName={companyName}
                />
            </div>
        </div>
    )
}