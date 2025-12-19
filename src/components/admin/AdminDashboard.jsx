// src/components/admin/AdminDashboard.jsx - MOBILE-FRIENDLY VERSION
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { Link, Navigate, useLocation, Outlet } from 'react-router-dom';

const AdminDashboard = () => {
    const { user, supabase, signOut } = useSupabase();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Navigation items
    const navItems = [
        { path: '/admin', label: 'Overview', icon: '📊' },
        { path: '/admin/approvals', label: 'Approvals', icon: '✅' },
        { path: '/admin/payouts', label: 'Payouts', icon: '💸' },
        { path: '/admin/payments', label: 'Payments', icon: '💰' },
        { path: '/admin/jobs', label: 'Jobs', icon: '🔧' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    useEffect(() => {
        checkAdminStatus();
    }, [user]);

    const checkAdminStatus = async () => {
        if (!user) {
            setIsAdmin(false);
            setLoading(false);
            return;
        }

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            setIsAdmin(profile?.role === 'admin');
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header - Mobile & Desktop */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    {/* Top Bar */}
                    <div className="flex justify-between items-center py-4">
                        {/* Logo/Brand */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                <span className="text-xl">👑</span>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                                <p className="text-sm text-gray-300">Mount Platform Management</p>
                            </div>
                            <div className="sm:hidden">
                                <h1 className="text-xl font-bold">Admin</h1>
                                <p className="text-xs text-gray-300">Mount</p>
                            </div>
                        </div>

                        {/* User Info & Actions */}
                        <div className="flex items-center space-x-4">
                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="sm:hidden p-2 hover:bg-gray-700 rounded-lg"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                </svg>
                            </button>

                            {/* Desktop User Info */}
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'Admin'}</p>
                                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{user?.email}</p>
                                </div>
                                <button
                                    onClick={signOut}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden sm:flex space-x-1 overflow-x-auto py-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== '/admin' && location.pathname.startsWith(item.path));

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive
                                        ? 'bg-green-600 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                        }`}
                                >
                                    <span>{item.icon}</span>
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Navigation Dropdown */}
                    {mobileMenuOpen && (
                        <div className="sm:hidden bg-gray-800 rounded-lg mt-2 mb-4 p-2">
                            <div className="space-y-1">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path ||
                                        (item.path !== '/admin' && location.pathname.startsWith(item.path));

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                                ? 'bg-green-600 text-white'
                                                : 'text-gray-300 hover:bg-gray-700'
                                                }`}
                                        >
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}

                                {/* Mobile Logout Button */}
                                <div className="pt-3 border-t border-gray-700">
                                    <div className="px-4 py-2">
                                        <p className="text-sm font-medium text-gray-300">{user?.email?.split('@')[0] || 'Admin'}</p>
                                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={signOut}
                                        className="w-full mt-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Mobile Breadcrumb */}
                <div className="sm:hidden mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Link to="/admin" className="hover:text-gray-900">Admin</Link>
                        <span>/</span>
                        <span className="font-medium text-gray-900">
                            {navItems.find(item =>
                                location.pathname === item.path ||
                                (item.path !== '/admin' && location.pathname.startsWith(item.path))
                            )?.label || 'Dashboard'}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[60vh]">
                    <Outlet />
                </div>
            </div>

            {/* Admin Footer - Mobile Optimized */}
            <div className="border-t border-gray-200 bg-white py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center sm:text-left text-sm text-gray-500">
                        <p>© {new Date().getFullYear()} Mount Admin Dashboard</p>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="text-xs">Secure Admin Access • v1.0.0</p>
                            <p className="text-xs">Last login: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;