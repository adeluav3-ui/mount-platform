// src/components/admin/AdminMessagingPage.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { useMessaging } from '../../context/MessagingContext.jsx';
import ChatModal from '../chat/ChatModal';

export default function AdminMessagingPage() {
    const { supabase, user } = useSupabase();
    const { createConversation, setActiveConversation } = useMessaging();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [showChat, setShowChat] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching customers...');

            // Get all customers from the customers table
            const { data: customers, error: customersError } = await supabase
                .from('customers')
                .select('id, customer_name, email, phone, created_at, verification_level')
                .order('created_at', { ascending: false });

            if (customersError) {
                console.error('Customers error:', customersError);
                throw customersError;
            }

            console.log(`Found ${customers?.length || 0} customers`);

            // Get all companies from the companies table
            const { data: companies, error: companiesError } = await supabase
                .from('companies')
                .select('id, company_name, email, phone, created_at, approved')
                .order('created_at', { ascending: false });

            if (companiesError) {
                console.error('Companies error:', companiesError);
                throw companiesError;
            }

            console.log(`Found ${companies?.length || 0} companies`);

            // Format customers
            const formattedCustomers = (customers || []).map(c => ({
                id: c.id,
                name: c.customer_name || 'Unknown Customer',
                email: c.email || 'No email',
                phone: c.phone || 'No phone',
                type: 'customer',
                verified: c.verification_level === 'verified',
                created_at: c.created_at
            }));

            // Format companies - removed verification_status
            const formattedCompanies = (companies || []).map(c => ({
                id: c.id,
                name: c.company_name || 'Unknown Company',
                email: c.email || 'No email',
                phone: c.phone || 'No phone',
                type: 'company',
                verified: false, // or based on some other column if you have one
                approved: c.approved || false,
                created_at: c.created_at
            }));
            const allUsers = [...formattedCustomers, ...formattedCompanies];
            console.log('Total users loaded:', allUsers.length);

            setUsers(allUsers);

            if (allUsers.length === 0) {
                setError('No users found in the database.');
            }

        } catch (error) {
            console.error('Error loading users:', error);
            setError('Failed to load users. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const startConversation = async (user) => {
        try {
            console.log('Starting conversation with:', user);
            const conversation = await createConversation(user.id);
            setSelectedUser(user);
            setActiveConversation(conversation);
            setShowChat(true);
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Failed to start conversation. Please try again.');
        }
    };

    // Filter users based on search and type
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (user.phone || '').includes(searchTerm);

        const matchesType = selectedType === 'all' || user.type === selectedType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="p-4 sm:p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-naijaGreen mb-2">Message Users</h2>
                <p className="text-gray-600">Send messages to customers and service providers</p>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-naijaGreen"
                    />
                </div>
                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-naijaGreen bg-white"
                >
                    <option value="all">All Users</option>
                    <option value="customer">Customers Only</option>
                    <option value="company">Companies Only</option>
                </select>

                {/* Refresh button */}
                <button
                    onClick={loadUsers}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {/* Users count */}
            {!loading && !error && (
                <p className="mb-4 text-sm text-gray-500">
                    Showing {filteredUsers.length} of {users.length} total users
                </p>
            )}

            {/* Users List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naijaGreen"></div>
                    <p className="mt-4 text-gray-500">Loading users...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-4">👥</div>
                    <p className="text-xl text-gray-500 font-bold">No users found</p>
                    <p className="text-gray-400 mt-2">
                        {users.length === 0
                            ? 'No users in the database yet.'
                            : 'Try adjusting your search or filters'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.type === 'customer'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {user.type === 'customer' ? '👤 Customer' : '🏢 Company'}
                                        </span>
                                        {user.verified && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                                ✅ Verified
                                            </span>
                                        )}
                                        {user.type === 'company' && !user.approved && (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                                                ⏳ Pending Approval
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800">{user.name}</h3>
                                    <div className="mt-1 space-y-1">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Email:</span> {user.email}
                                        </p>
                                        {user.phone && user.phone !== 'No phone' && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Phone:</span> {user.phone}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Joined: {user.created_at
                                            ? new Date(user.created_at).toLocaleDateString('en-NG', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })
                                            : 'Unknown date'
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={() => startConversation(user)}
                                    className="bg-naijaGreen text-white px-6 py-3 rounded-lg font-bold hover:bg-darkGreen transition flex items-center justify-center gap-2 sm:w-auto w-full"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Message
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Chat Modal */}
            <ChatModal
                isOpen={showChat}
                onClose={() => setShowChat(false)}
                currentUserId={user?.id}
                userRole="admin"
            />
        </div>
    );
}