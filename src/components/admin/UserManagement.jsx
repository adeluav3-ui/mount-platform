// src/components/admin/UserManagement.jsx - MOBILE-FRIENDLY VERSION
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const UserManagement = () => {
    const { supabase } = useSupabase();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('all'); // all, customers, companies
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCustomers: 0,
        totalCompanies: 0,
        activeCompanies: 0,
        pendingCompanies: 0
    });
    const [jobCounts, setJobCounts] = useState({});
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null); // For mobile detail view

    useEffect(() => {
        fetchUsers();
        fetchStats();
    }, [view]);

    const fetchStats = async () => {
        try {
            // Get customer count
            const { count: customerCount } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            // Get company stats
            const { count: totalCompanies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            const { count: activeCompanies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('approved', true);

            const { count: pendingCompanies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('approved', false);

            setStats({
                totalUsers: (customerCount || 0) + (totalCompanies || 0),
                totalCustomers: customerCount || 0,
                totalCompanies: totalCompanies || 0,
                activeCompanies: activeCompanies || 0,
                pendingCompanies: pendingCompanies || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);

            let userData = [];

            if (view === 'customers') {
                const { data: customers } = await supabase
                    .from('customers')
                    .select(`
            *,
            profiles(full_name, email, phone, created_at)
          `)
                    .order('created_at', { ascending: false });

                userData = (customers || []).map(c => ({
                    ...c,
                    type: 'customer',
                    displayName: c.customer_name,
                    email: c.email,
                    phone: c.phone,
                    profile: c.profiles
                }));
            }
            else if (view === 'companies') {
                const { data: companies } = await supabase
                    .from('companies')
                    .select(`
            *,
            profiles(full_name, email, phone, created_at)
          `)
                    .order('created_at', { ascending: false });

                userData = (companies || []).map(c => ({
                    ...c,
                    type: 'company',
                    displayName: c.company_name,
                    email: c.email,
                    phone: c.phone,
                    profile: c.profiles
                }));
            }
            else {
                // Fetch both customers and companies
                const [customersRes, companiesRes] = await Promise.all([
                    supabase.from('customers').select(`
            *,
            profiles(full_name, email, phone, created_at)
          `),
                    supabase.from('companies').select(`
            *,
            profiles(full_name, email, phone, created_at)
          `)
                ]);

                userData = [
                    ...(customersRes.data || []).map(c => ({
                        ...c,
                        type: 'customer',
                        displayName: c.customer_name,
                        email: c.email,
                        phone: c.phone,
                        profile: c.profiles
                    })),
                    ...(companiesRes.data || []).map(c => ({
                        ...c,
                        type: 'company',
                        displayName: c.company_name,
                        email: c.email,
                        phone: c.phone,
                        profile: c.profiles
                    }))
                ];

                // Sort by creation date
                userData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }

            setUsers(userData);
            fetchJobCounts(userData);

        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchJobCounts = async (userList) => {
        const counts = {};

        for (const user of userList) {
            try {
                if (user.type === 'customer') {
                    const { count } = await supabase
                        .from('jobs')
                        .select('*', { count: 'exact', head: true })
                        .eq('customer_id', user.id);
                    counts[user.id] = count || 0;
                } else {
                    const { count } = await supabase
                        .from('jobs')
                        .select('*', { count: 'exact', head: true })
                        .eq('company_id', user.id);
                    counts[user.id] = count || 0;
                }
            } catch (error) {
                console.error(`Error getting job count for ${user.id}:`, error);
                counts[user.id] = 0;
            }
        }

        setJobCounts(counts);
    };

    const toggleCompanyApproval = async (companyId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            const { error } = await supabase
                .from('companies')
                .update({ approved: newStatus })
                .eq('id', companyId);

            if (error) throw error;

            await supabase.from('admin_actions').insert({
                action_type: newStatus ? 'company_approval' : 'company_revocation',
                description: `${newStatus ? 'Approved' : 'Revoked approval for'} company ${companyId}`,
                user_id: (await supabase.auth.getUser()).data.user.id
            });

            fetchUsers();
            fetchStats();
            alert(`Company ${newStatus ? 'approved' : 'approval revoked'} successfully!`);
        } catch (error) {
            console.error('Error updating company approval:', error);
            alert('Failed to update company status');
        }
    };

    const suspendUser = async (userId, userType, currentStatus) => {
        const confirmMessage = currentStatus
            ? `Are you sure you want to suspend this ${userType}? They will not be able to access the platform.`
            : `Are you sure you want to reactivate this ${userType}?`;

        if (!window.confirm(confirmMessage)) return;

        try {
            alert(`User ${currentStatus ? 'suspended' : 'reactivated'}. (Note: In production, this would update a 'suspended' flag in the database)`);

            await supabase.from('admin_actions').insert({
                action_type: currentStatus ? 'user_suspension' : 'user_reactivation',
                description: `${currentStatus ? 'Suspended' : 'Reactivated'} ${userType} ${userId}`,
                user_id: (await supabase.auth.getUser()).data.user.id
            });

            fetchUsers();
        } catch (error) {
            console.error('Error suspending user:', error);
            alert('Failed to update user status');
        }
    };

    const startEditUser = (user) => {
        setEditingUser(user.id);
        setEditForm({
            name: user.displayName,
            email: user.email,
            phone: user.phone,
            address: user.address || '',
            bankName: user.bank_name || '',
            bankAccount: user.bank_account || ''
        });
    };

    const saveEditUser = async (userId, userType) => {
        try {
            if (userType === 'customer') {
                const { error } = await supabase
                    .from('customers')
                    .update({
                        customer_name: editForm.name,
                        email: editForm.email,
                        phone: editForm.phone
                    })
                    .eq('id', userId);

                if (error) throw error;
            } else if (userType === 'company') {
                const { error } = await supabase
                    .from('companies')
                    .update({
                        company_name: editForm.name,
                        email: editForm.email,
                        phone: editForm.phone,
                        address: editForm.address,
                        bank_name: editForm.bankName,
                        bank_account: editForm.bankAccount
                    })
                    .eq('id', userId);

                if (error) throw error;
            }

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: editForm.name,
                    email: editForm.email,
                    phone: editForm.phone
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            await supabase.from('admin_actions').insert({
                action_type: 'user_edit',
                description: `Edited ${userType} ${userId}`,
                user_id: (await supabase.auth.getUser()).data.user.id
            });

            setEditingUser(null);
            setSelectedUser(null);
            fetchUsers();
            alert('User updated successfully!');
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Failed to update user');
        }
    };

    // Filter users based on search
    const filteredUsers = users.filter(user =>
        search === '' ||
        user.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.toLowerCase().includes(search.toLowerCase()) ||
        (user.type === 'company' && user.services?.some(s =>
            s.toLowerCase().includes(search.toLowerCase())
        ))
    );

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">User Management</h1>
                        <p className="text-gray-600 text-sm sm:text-base mt-1">Manage customers and companies on the platform</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:space-x-4 sm:text-right">
                        <div className="text-center sm:text-right">
                            <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.totalCustomers}</p>
                            <p className="text-xs sm:text-sm text-gray-500">Customers</p>
                        </div>
                        <div className="text-center sm:text-right">
                            <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.activeCompanies}</p>
                            <p className="text-xs sm:text-sm text-gray-500">Active Companies</p>
                        </div>
                        <div className="text-center sm:text-right">
                            <p className="text-lg sm:text-2xl font-bold text-purple-600">{stats.totalCompanies}</p>
                            <p className="text-xs sm:text-sm text-gray-500">Total Companies</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search - Mobile Optimized */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                {/* Mobile Filter Toggle */}
                <div className="sm:hidden mb-4">
                    <button
                        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                        className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-between"
                    >
                        <span>Filter Users ({view === 'all' ? 'All' : view})</span>
                        <span>{mobileFiltersOpen ? '▲' : '▼'}</span>
                    </button>
                </div>

                {/* Mobile Filters Dropdown */}
                {mobileFiltersOpen && (
                    <div className="sm:hidden mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => { setView('all'); setMobileFiltersOpen(false); }}
                                className={`px-4 py-2 rounded-lg text-left ${view === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                All Users ({stats.totalUsers})
                            </button>
                            <button
                                onClick={() => { setView('customers'); setMobileFiltersOpen(false); }}
                                className={`px-4 py-2 rounded-lg text-left ${view === 'customers' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Customers ({stats.totalCustomers})
                            </button>
                            <button
                                onClick={() => { setView('companies'); setMobileFiltersOpen(false); }}
                                className={`px-4 py-2 rounded-lg text-left ${view === 'companies' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                Companies ({stats.totalCompanies})
                            </button>
                        </div>
                    </div>
                )}

                {/* Desktop Filters */}
                <div className="hidden sm:flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setView('all')}
                        className={`px-4 py-2 rounded-lg ${view === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        All Users ({stats.totalUsers})
                    </button>
                    <button
                        onClick={() => setView('customers')}
                        className={`px-4 py-2 rounded-lg ${view === 'customers' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Customers ({stats.totalCustomers})
                    </button>
                    <button
                        onClick={() => setView('companies')}
                        className={`px-4 py-2 rounded-lg ${view === 'companies' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Companies ({stats.totalCompanies})
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users by name, email, phone, or services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    />
                    <div className="absolute left-4 top-3.5 text-gray-400">
                        🔍
                    </div>
                </div>
            </div>

            {/* Users Grid/List - Mobile Optimized */}
            {filteredUsers.length > 0 ? (
                <>
                    {/* Mobile List View */}
                    <div className="sm:hidden space-y-4">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                {/* Mobile User Card Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.type === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            <span className="text-lg">
                                                {user.type === 'customer' ? '👤' : '🏢'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 truncate max-w-[150px]">{user.displayName}</h3>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${user.type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {user.type === 'customer' ? 'Customer' : 'Company'}
                                                </span>
                                                {user.type === 'company' && (
                                                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {user.approved ? '✅' : '⏳'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                                        className="p-2 text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                d={selectedUser?.id === user.id ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                                        </svg>
                                    </button>
                                </div>

                                {/* Quick Info */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-500">Jobs</p>
                                        <p className="font-bold">{jobCounts[user.id] || 0}</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-500">Joined</p>
                                        <p className="font-bold text-sm">{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Mobile Detail View */}
                                {selectedUser?.id === user.id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Contact</p>
                                            <p className="text-sm font-medium truncate">{user.email}</p>
                                            <p className="text-sm text-gray-600">{user.phone}</p>
                                        </div>

                                        {user.type === 'company' && (
                                            <>
                                                <div>
                                                    <p className="text-xs text-gray-500">Services</p>
                                                    <p className="text-sm font-medium">
                                                        {user.services?.slice(0, 2).join(', ')}
                                                        {user.services?.length > 2 && '...'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Address</p>
                                                    <p className="text-sm font-medium truncate">{user.address || 'Not provided'}</p>
                                                </div>
                                            </>
                                        )}

                                        {/* Mobile Action Buttons */}
                                        <div className="grid grid-cols-2 gap-2 pt-3">
                                            {user.type === 'company' && (
                                                <button
                                                    onClick={() => toggleCompanyApproval(user.id, user.approved)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium ${user.approved
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-green-100 text-green-700'
                                                        }`}
                                                >
                                                    {user.approved ? 'Revoke' : 'Approve'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => startEditUser(user)}
                                                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => suspendUser(user.id, user.type, true)}
                                                className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium"
                                            >
                                                Suspend
                                            </button>
                                            <button
                                                onClick={() => alert(`Viewing details for ${user.type} ${user.id}`)}
                                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                                            >
                                                View Jobs
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Desktop Grid View */}
                    <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user) => (
                            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                {/* User Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.type === 'customer' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            <span className="text-xl">
                                                {user.type === 'customer' ? '👤' : '🏢'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{user.displayName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-block px-2 py-1 text-xs rounded-full ${user.type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                    {user.type === 'customer' ? 'Customer' : 'Company'}
                                                </span>
                                                {user.type === 'company' && (
                                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {user.approved ? '✅ Approved' : '⏳ Pending'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Joined</p>
                                        <p className="text-sm font-medium">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* User Details */}
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Contact Info</p>
                                        <p className="text-sm font-medium">{user.email}</p>
                                        <p className="text-sm text-gray-600">{user.phone}</p>
                                    </div>

                                    {user.type === 'company' && (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500">Services</p>
                                                <p className="text-sm font-medium">
                                                    {user.services?.slice(0, 3).join(', ')}
                                                    {user.services?.length > 3 && '...'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Address</p>
                                                <p className="text-sm font-medium truncate">{user.address || 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Bank Details</p>
                                                <p className="text-sm font-medium">
                                                    {user.bank_name || 'Not set'} •••{user.bank_account?.slice(-4) || ''}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <p className="text-xs text-gray-500">Job History</p>
                                        <p className="text-sm font-medium">{jobCounts[user.id] || 0} jobs completed</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                                    {user.type === 'company' && (
                                        <button
                                            onClick={() => toggleCompanyApproval(user.id, user.approved)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${user.approved
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                }`}
                                        >
                                            {user.approved ? 'Revoke Approval' : 'Approve Company'}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => startEditUser(user)}
                                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200"
                                    >
                                        Edit Details
                                    </button>

                                    <button
                                        onClick={() => suspendUser(user.id, user.type, true)}
                                        className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200"
                                    >
                                        Suspend
                                    </button>

                                    <button
                                        onClick={() => alert(`Viewing details for ${user.type} ${user.id}`)}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
                                    >
                                        View Jobs
                                    </button>
                                </div>

                                {/* Edit Form Modal */}
                                {editingUser === user.id && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h4 className="font-medium mb-2">Edit {user.type === 'customer' ? 'Customer' : 'Company'}</h4>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                                placeholder="Name"
                                            />
                                            <input
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                                placeholder="Email"
                                            />
                                            <input
                                                type="tel"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                                placeholder="Phone"
                                            />

                                            {user.type === 'company' && (
                                                <>
                                                    <input
                                                        type="text"
                                                        value={editForm.address}
                                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                                        placeholder="Address"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editForm.bankName}
                                                        onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                                        placeholder="Bank Name"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editForm.bankAccount}
                                                        onChange={(e) => setEditForm({ ...editForm, bankAccount: e.target.value })}
                                                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                                                        placeholder="Bank Account"
                                                    />
                                                </>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => saveEditUser(user.id, user.type)}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingUser(null)}
                                                    className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-2xl sm:text-3xl">👥</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-medium text-gray-700">No Users Found</h3>
                    <p className="text-gray-500 text-sm sm:text-base mt-2">
                        {search ? 'No users match your search.' : `No ${view === 'all' ? 'users' : view} found.`}
                    </p>
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                        >
                            Clear Search
                        </button>
                    )}
                </div>
            )}

            {/* Quick Stats - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-200">
                    <p className="text-xs sm:text-sm font-medium text-blue-700">Pending Approvals</p>
                    <p className="text-lg sm:text-2xl font-bold text-blue-800 mt-1 sm:mt-2">{stats.pendingCompanies}</p>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-xl border border-green-200">
                    <p className="text-xs sm:text-sm font-medium text-green-700">Active Companies</p>
                    <p className="text-lg sm:text-2xl font-bold text-green-800 mt-1 sm:mt-2">{stats.activeCompanies}</p>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-200">
                    <p className="text-xs sm:text-sm font-medium text-purple-700">Total Users</p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-800 mt-1 sm:mt-2">{stats.totalUsers}</p>
                </div>
                <div className="bg-orange-50 p-3 sm:p-4 rounded-xl border border-orange-200">
                    <p className="text-xs sm:text-sm font-medium text-orange-700">Recent Signups</p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-800 mt-1 sm:mt-2">
                        {users.filter(u => {
                            const signupDate = new Date(u.created_at);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return signupDate > weekAgo;
                        }).length}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;