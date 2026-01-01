// src/components/Dashboard.jsx — COMPLETE VERSION WITH LOCALSTORAGE TRACKING
import React from 'react';
import { useSupabase } from '../context/SupabaseContext'
import CustomerDashboard from './CustomerDashboard'
import CompanyDashboard from './company/CompanyDashboard'
import DeviceRegistration from './DeviceRegistration';
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

export default function Dashboard() {
    const { user, supabase } = useSupabase()
    const [role, setRole] = useState('customer')
    const [loading, setLoading] = useState(false)
    const [showDeviceCheck, setShowDeviceCheck] = useState(() => {
        // Initialize from localStorage to prevent repeated prompts
        if (typeof window !== 'undefined') {
            const hasBeenShown = localStorage.getItem('deviceCheckShown');
            const userType = localStorage.getItem('lastUserType');
            const lastUserId = localStorage.getItem('lastUserId');

            // Check if we need to show based on:
            // 1. Never shown before
            // 2. Different user logged in
            // 3. User type changed (customer to company)
            if (!hasBeenShown ||
                lastUserId !== user?.id ||
                userType !== 'company') {
                return true; // Show the prompt
            }
            return false; // Don't show, already seen
        }
        return true; // Default to showing
    });

    useEffect(() => {
        if (!user) {
            setRole('customer')
            return
        }

        console.log('=== DASHBOARD DEBUG START ===')
        console.log('User ID:', user.id)
        console.log('User email:', user.email)
        console.log('Device check should show?', showDeviceCheck)
        console.log('LocalStorage deviceCheckShown:', localStorage.getItem('deviceCheckShown'))

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

                    // Store user info in localStorage
                    localStorage.setItem('lastUserType', 'company');
                    localStorage.setItem('lastUserId', user.id);

                    // Only show device check if we haven't shown it for this user
                    const hasBeenShownForUser = localStorage.getItem(`deviceCheckShown_${user.id}`);
                    if (!hasBeenShownForUser) {
                        console.log('First time for this company user, showing device check');
                        setShowDeviceCheck(true);
                    } else {
                        console.log('Device check already shown for this user');
                        setShowDeviceCheck(false);
                    }
                } else {
                    console.log('✅ User is CUSTOMER')
                    setRole('customer')
                    localStorage.setItem('lastUserType', 'customer');
                    localStorage.setItem('lastUserId', user.id);
                    setShowDeviceCheck(false);
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
    }, [user, supabase])

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

    // Handle device check completion
    const handleDeviceCheckComplete = () => {
        console.log('Device check marked as complete for user:', user?.id);
        localStorage.setItem('deviceCheckShown', 'true');
        if (user?.id) {
            localStorage.setItem(`deviceCheckShown_${user.id}`, 'true');
        }
        setShowDeviceCheck(false);
    };

    // Render appropriate dashboard with DeviceRegistration for companies
    return (
        <>
            {/* Add DeviceRegistration for companies */}
            {role === 'company' && showDeviceCheck && (
                <DeviceRegistration onComplete={handleDeviceCheckComplete} />
            )}

            {/* Render the appropriate dashboard */}
            {role === 'company' ? <CompanyDashboard /> : <CustomerDashboard />}
        </>
    );
}