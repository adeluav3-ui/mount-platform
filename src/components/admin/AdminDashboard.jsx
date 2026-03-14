// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { Link, Navigate, useLocation, Outlet } from 'react-router-dom';
import ChatModal from '../chat/ChatModal';

const AdminDashboard = () => {
    const { user, supabase, signOut } = useSupabase();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const [showChat, setShowChat] = useState(false);
    const [showRedDot, setShowRedDot] = useState(false);
    const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

    const navItems = [
        { path: '/admin', label: 'Overview', icon: '📊' },
        { path: '/admin/approvals', label: 'Approvals', icon: '✅' },
        { path: '/admin/verifications', label: 'ID Verifications', icon: '🆔' },
        { path: '/admin/messages', label: 'Messages', icon: '💬' },
        { path: '/admin/subscriptions', label: 'Subscriptions', icon: '💳' },
        { path: '/admin/provider-wallets', label: 'Provider Wallets', icon: '💰' },
        { path: '/admin/jobs', label: 'Jobs', icon: '🔧' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    const checkForUnread = useCallback(async () => {
        if (!user || !supabase) { setShowRedDot(false); return; }
        try {
            const { data: conversations } = await supabase
                .from('conversations')
                .select('id')
                .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`);

            if (!conversations || conversations.length === 0) { setShowRedDot(false); return; }

            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .in('conversation_id', conversations.map(c => c.id))
                .eq('is_read', false)
                .neq('sender_id', user.id);

            setShowRedDot(count > 0);
        } catch (error) {
            setShowRedDot(false);
        }
    }, [user, supabase]);

    useEffect(() => { checkForUnread(); }, [checkForUnread]);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) { setIsAdmin(false); setLoading(false); return; }
            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (error) throw error;
                setIsAdmin(profile?.role === 'admin');
            } catch {
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };
        checkAdminStatus();
    }, [user, supabase]);

    useEffect(() => {
        if (!isAdmin || !supabase) return;
        const fetchPendingCount = async () => {
            const { count, error } = await supabase
                .from('id_verifications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            if (!error && count) setPendingVerificationsCount(count);
        };
        fetchPendingCount();
        const channel = supabase
            .channel('admin-verification-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'id_verifications' }, fetchPendingCount)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [isAdmin, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Verifying admin access…</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return <Navigate to="/dashboard" replace />;

    const isActive = (path) =>
        location.pathname === path ||
        (path !== '/admin' && location.pathname.startsWith(path));

    const ChatButton = () => (
        <button
            onClick={() => setShowChat(true)}
            className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {showRedDot && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    {/* Top bar */}
                    <div className="flex justify-between items-center py-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-naijaGreen rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-lg">👑</span>
                            </div>
                            <div>
                                <h1 className="text-base sm:text-lg font-bold leading-tight">Admin Dashboard</h1>
                                <p className="text-xs text-gray-400 hidden sm:block">Mount Platform Management</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ChatButton />
                            {/* Desktop user + logout */}
                            <div className="hidden sm:flex items-center gap-3 ml-2">
                                <div className="text-right">
                                    <p className="text-sm font-medium leading-tight">{user?.email?.split('@')[0] || 'Admin'}</p>
                                    <p className="text-xs text-gray-400 truncate max-w-[180px]">{user?.email}</p>
                                </div>
                                <button
                                    onClick={signOut}
                                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
                                >
                                    Logout
                                </button>
                            </div>
                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileMenuOpen(v => !v)}
                                className="sm:hidden p-2 hover:bg-gray-700 rounded-lg transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden sm:flex gap-0.5 overflow-x-auto pb-1 scrollbar-none">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${isActive(item.path)
                                    ? 'bg-naijaGreen text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                                {item.path === '/admin/verifications' && pendingVerificationsCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                                        {pendingVerificationsCount}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Mobile dropdown */}
                    {mobileMenuOpen && (
                        <div className="sm:hidden bg-gray-800 rounded-xl mt-1 mb-3 p-2 shadow-xl">
                            <div className="grid grid-cols-2 gap-1">
                                {navItems.map(item => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${isActive(item.path)
                                            ? 'bg-naijaGreen text-white'
                                            : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        <span>{item.icon}</span>
                                        <span className="truncate">{item.label}</span>
                                        {item.path === '/admin/verifications' && pendingVerificationsCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                                {pendingVerificationsCount}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-700 flex items-center justify-between px-2">
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                <button
                                    onClick={signOut}
                                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition shrink-0 ml-2"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Breadcrumb (mobile) */}
            <div className="sm:hidden max-w-7xl mx-auto px-4 pt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Link to="/admin" className="hover:text-gray-800">Admin</Link>
                    <span>/</span>
                    <span className="font-semibold text-gray-800">
                        {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
                    </span>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[60vh]">
                    <Outlet />
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-white py-4 mt-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:justify-between gap-1 text-xs text-gray-400">
                    <p>© {new Date().getFullYear()} Mount Admin Dashboard</p>
                    <p>Secure Admin Access · v1.0.0</p>
                </div>
            </div>

            <ChatModal
                isOpen={showChat}
                onClose={() => { setShowChat(false); setShowRedDot(false); }}
                currentUserId={user?.id}
                userRole="admin"
            />
        </div>
    );
};

export default AdminDashboard;