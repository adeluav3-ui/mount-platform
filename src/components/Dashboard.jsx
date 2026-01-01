// src/components/Dashboard.jsx — UPDATED WITH DEVICE REGISTRATION
import React from 'react';
import { useSupabase } from '../context/SupabaseContext'
import CustomerDashboard from './CustomerDashboard'
import CompanyDashboard from './company/CompanyDashboard'
import DeviceRegistration from './DeviceRegistration'; // ADD THIS IMPORT
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'


export default function Dashboard() {
    const { user, supabase } = useSupabase()
    const [role, setRole] = useState('customer') // Default to customer
    const [loading, setLoading] = useState(false)
    const [showDeviceCheck, setShowDeviceCheck] = useState(false); // NEW STATE

    useEffect(() => {
        if (!user) {
            setRole('customer')
            return
        }

        console.log('=== DASHBOARD DEBUG START ===')
        console.log('User ID:', user.id)
        console.log('User email:', user.email)
        console.log('🔄 Dashboard component rendering. Current path:', window.location.pathname);
        console.log('🔄 Dashboard component rendering. Current hash:', window.location.hash);

        setLoading(true)

        // SIMPLE check - first check profiles for admin
        supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()
            .then(({ data: profile, error: profileError }) => {
                console.log('Profile check result:', profile)
                console.log('Profile error:', profileError)

                if (profileError) {
                    console.error('Profile error:', profileError)
                    // Continue with company check
                    return supabase
                        .from('companies')
                        .select('id')
                        .eq('id', user.id)
                        .maybeSingle()
                }

                if (profile?.role === 'admin') {
                    console.log('✅ User is ADMIN!')
                    setRole('admin')
                    setLoading(false)
                    return null // Stop here
                }

                console.log('User is not admin, checking company...')
                // Not admin, check if company
                return supabase
                    .from('companies')
                    .select('id')
                    .eq('id', user.id)
                    .maybeSingle()
            })
            .then((companyData) => {
                if (companyData === null) {
                    // This means we already set admin role
                    console.log('Already set admin role, skipping company check')
                    return
                }

                console.log('Company check result:', companyData)

                if (companyData?.data) {
                    console.log('✅ User is COMPANY')
                    setRole('company')
                    // Show device check for companies
                    setShowDeviceCheck(true);
                } else {
                    console.log('✅ User is CUSTOMER')
                    setRole('customer')
                }
            })
            .catch((error) => {
                console.error('Error checking role:', error)
                setRole('customer') // Default fallback
            })
            .finally(() => {
                setLoading(false)
                console.log('=== DASHBOARD DEBUG END ===')
            })
    }, [user])

    console.log('Current role:', role)
    console.log('Loading:', loading)

    // Show loading only if we're actively loading
    if (loading) {
        return (
            <div className="min-h-screen bg-naijaGreen flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-3xl font-bold animate-pulse">Loading...</p>
                    <p className="mt-4 text-sm">Checking user permissions...</p>
                </div>
            </div>
        )
    }

    // Redirect admins ONLY if they're trying to access the dashboard
    if (role === 'admin' && window.location.pathname.startsWith('/dashboard')) {
        console.log('🚀 Redirecting to /admin from dashboard')
        return <Navigate to="/admin" replace />
    }

    console.log('Rendering dashboard for role:', role)

    // Render appropriate dashboard with DeviceRegistration for companies
    return (
        <>
            {/* Add DeviceRegistration for companies */}
            {role === 'company' && showDeviceCheck && <DeviceRegistration />}

            {/* Render the appropriate dashboard */}
            {role === 'company' ? <CompanyDashboard /> : <CustomerDashboard />}
        </>
    );
}