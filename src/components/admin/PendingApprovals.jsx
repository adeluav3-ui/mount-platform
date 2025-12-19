// src/components/admin/PendingApprovals.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const PendingApprovals = () => {
    const { supabase } = useSupabase();
    const [pendingCompanies, setPendingCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [verificationCodes, setVerificationCodes] = useState([]);
    const [newCode, setNewCode] = useState('');

    useEffect(() => {
        fetchPendingCompanies();
        fetchVerificationCodes();
    }, []);

    const fetchPendingCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select(`
          *,
          profiles(full_name, email, phone)
        `)
                .eq('approved', false)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setPendingCompanies(data || []);
        } catch (error) {
            console.error('Error fetching pending companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVerificationCodes = async () => {
        try {
            const { data } = await supabase
                .from('verification_codes')
                .select('*')
                .order('created_at', { ascending: false });
            setVerificationCodes(data || []);
        } catch (error) {
            console.error('Error fetching verification codes:', error);
        }
    };

    const handleApproveCompany = async (companyId) => {
        try {
            const { error } = await supabase
                .from('companies')
                .update({ approved: true })
                .eq('id', companyId);

            if (error) throw error;

            // Record admin action
            await supabase.from('admin_actions').insert({
                action_type: 'company_approval',
                description: `Approved company ${companyId}`,
                user_id: (await supabase.auth.getUser()).data.user.id
            });

            // Refresh the list
            fetchPendingCompanies();
        } catch (error) {
            console.error('Error approving company:', error);
            alert('Failed to approve company');
        }
    };

    const handleRejectCompany = async (companyId) => {
        const reason = prompt('Enter reason for rejection:');
        if (!reason) return;

        try {
            // You might want to send an email or notification here
            await supabase
                .from('companies')
                .delete()
                .eq('id', companyId);

            // Record admin action
            await supabase.from('admin_actions').insert({
                action_type: 'company_rejection',
                description: `Rejected company ${companyId}: ${reason}`,
                user_id: (await supabase.auth.getUser()).data.user.id
            });

            fetchPendingCompanies();
        } catch (error) {
            console.error('Error rejecting company:', error);
            alert('Failed to reject company');
        }
    };

    const generateVerificationCode = async () => {
        if (!newCode.trim()) {
            alert('Please enter a code');
            return;
        }

        try {
            const { error } = await supabase
                .from('verification_codes')
                .insert([{ code: newCode.toUpperCase() }]);

            if (error) throw error;

            setNewCode('');
            fetchVerificationCodes();
            alert('Verification code created!');
        } catch (error) {
            console.error('Error generating code:', error);
            alert('Failed to create code');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Company Approvals</h1>
                        <p className="text-gray-600 mt-1">
                            Review and approve companies waiting for verification
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">{pendingCompanies.length}</p>
                        <p className="text-sm text-gray-500">Pending Approvals</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Companies List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Companies Awaiting Approval</h2>
                            <p className="text-sm text-gray-500">Verify company details before approving</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {pendingCompanies.length > 0 ? (
                                pendingCompanies.map((company) => (
                                    <div key={company.id} className="p-6 hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">{company.company_name}</h3>
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Services:</span>{' '}
                                                        {company.services?.join(', ') || 'Not specified'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Address:</span> {company.address}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Contact:</span>{' '}
                                                        {company.profiles?.phone || company.phone}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Email:</span> {company.email}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Bank:</span>{' '}
                                                        {company.bank_name} - {company.bank_account}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-2 ml-4">
                                                <button
                                                    onClick={() => handleApproveCompany(company.id)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectCompany(company.id)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                        <div className="mt-4 text-xs text-gray-500">
                                            Registered: {new Date(company.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">✅</span>
                                    </div>
                                    <h3 className="font-medium text-gray-700">All caught up!</h3>
                                    <p className="text-gray-500 mt-1">No pending company approvals</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Verification Codes Panel */}
                <div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Verification Codes</h2>
                            <p className="text-sm text-gray-500">Generate codes for company registration</p>
                        </div>

                        {/* Generate New Code */}
                        <div className="p-6 border-b border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Create New Code
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    placeholder="e.g., Mount2024"
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                                <button
                                    onClick={generateVerificationCode}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Generate
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Companies will need this code during registration
                            </p>
                        </div>

                        {/* Recent Codes */}
                        <div className="max-h-96 overflow-y-auto">
                            <div className="px-6 py-4 bg-gray-50">
                                <h3 className="font-medium text-gray-700">Recent Codes</h3>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {verificationCodes.map((code) => (
                                    <div key={code.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <code className="font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {code.code}
                                                </code>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Created: {new Date(code.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${code.used ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {code.used ? 'Used' : 'Available'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApprovals;