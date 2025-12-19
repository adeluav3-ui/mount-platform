// src/components/admin/DisbursementRequests.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const DisbursementRequests = () => {
    const { supabase } = useSupabase();
    const [allRequests, setAllRequests] = useState([]); // Store ALL requests
    const [displayedRequests, setDisplayedRequests] = useState([]); // Requests to display based on filter
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
    const [processingId, setProcessingId] = useState(null);

    // Fetch ALL disbursement requests
    useEffect(() => {
        fetchDisbursementRequests();
    }, []);

    // Apply filter when filter or allRequests changes
    useEffect(() => {
        if (allRequests.length > 0) {
            applyFilter();
        }
    }, [filter, allRequests]);

    const fetchDisbursementRequests = async () => {
        try {
            console.log('🔄 Fetching ALL disbursement requests...');

            // Fetch ALL requests (no status filter in query)
            let query = supabase
                .from('disbursement_requests')
                .select(`
                    *,
                    jobs (
                        id,
                        quoted_price,
                        upfront_payment,
                        status,
                        category,
                        sub_service
                    ),
                    companies!disbursement_requests_company_id_fkey (
                        company_name,
                        bank_name,
                        bank_account
                    )
                `)
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('❌ Query error:', error);
                // Try fallback
                await fetchSimpleData();
                return;
            }

            console.log('📊 Total requests fetched:', data?.length || 0);

            // Store ALL requests
            setAllRequests(data || []);

        } catch (error) {
            console.error('❌ Error fetching disbursement requests:', error);
            setAllRequests([]);
            setDisplayedRequests([]);
        } finally {
            setLoading(false);
        }
    };

    // Fallback function for simple data
    const fetchSimpleData = async () => {
        try {
            console.log('🔄 Trying simple query...');
            const { data, error } = await supabase
                .from('disbursement_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('📊 Simple query success:', data?.length, 'items');

            // For each request, fetch job and company data separately
            const enrichedData = await Promise.all(
                (data || []).map(async (request) => {
                    try {
                        // Get job details
                        const { data: jobData } = await supabase
                            .from('jobs')
                            .select('quoted_price, upfront_payment, status, category, sub_service')
                            .eq('id', request.job_id)
                            .single();

                        // Get company details
                        const { data: companyData } = await supabase
                            .from('companies')
                            .select('company_name, bank_name, bank_account')
                            .eq('id', request.company_id)
                            .single();

                        return {
                            ...request,
                            jobs: jobData || {},
                            companies: companyData || {}
                        };
                    } catch (err) {
                        console.warn('Error enriching request:', request.id, err);
                        return request;
                    }
                })
            );

            setAllRequests(enrichedData);
        } catch (error) {
            console.error('❌ Simple query also failed:', error);
            setAllRequests([]);
        }
    };

    // Apply filter to allRequests
    const applyFilter = () => {
        if (filter === 'all') {
            setDisplayedRequests(allRequests);
        } else {
            setDisplayedRequests(allRequests.filter(r => r.status === filter));
        }
    };

    // Handle filter button click
    const handleFilterClick = (newFilter) => {
        setFilter(newFilter);
    };

    const handleStatusUpdate = async (requestId, newStatus, notes = '') => {
        setProcessingId(requestId);
        try {
            const user = await supabase.auth.getUser();

            const { error } = await supabase
                .from('disbursement_requests')
                .update({
                    status: newStatus,
                    admin_notes: notes,
                    processed_at: new Date().toISOString(),
                    processed_by: user.data.user.id
                })
                .eq('id', requestId);

            if (error) throw error;

            // If approved, create financial transaction record
            if (newStatus === 'approved') {
                const request = allRequests.find(r => r.id === requestId);
                if (request) {
                    await supabase.from('financial_transactions').insert({
                        job_id: request.job_id,
                        user_id: request.company_id,
                        type: 'disbursement',
                        amount: request.amount,
                        platform_fee: request.amount * 0.05, // 5% platform fee
                        description: `Advance disbursement: ${request.reason}`,
                        reference: `DISB_${Date.now()}_${requestId.substring(0, 8)}`,
                        status: 'completed',
                        metadata: {
                            disbursement_request_id: requestId,
                            reason: request.reason
                        }
                    });
                }
            }

            // Record admin action
            await supabase.from('admin_actions').insert({
                action_type: 'disbursement_' + newStatus,
                description: `${newStatus} disbursement request ${requestId.substring(0, 8)} for ₦${allRequests.find(r => r.id === requestId)?.amount}`,
                user_id: user.data.user.id
            });

            // Refresh the list
            await fetchDisbursementRequests();
            alert(`Request ${newStatus} successfully!`);
        } catch (error) {
            console.error('Error updating disbursement status:', error);
            alert('Failed to update request status');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate statistics from ALL requests
    const pendingCount = allRequests.filter(r => r.status === 'pending').length;
    const approvedCount = allRequests.filter(r => r.status === 'approved').length;
    const rejectedCount = allRequests.filter(r => r.status === 'rejected').length;

    const pendingAmount = allRequests
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    const approvedAmount = allRequests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    // Approved today amount
    const approvedTodayAmount = allRequests
        .filter(r => r.status === 'approved' &&
            new Date(r.processed_at).toDateString() === new Date().toDateString())
        .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Disbursement Requests</h1>
                        <p className="text-gray-600 mt-1">
                            Review and process company requests for advance payments
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">₦{pendingAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Total Pending Amount</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleFilterClick('pending')}
                        className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Pending ({pendingCount})
                    </button>
                    <button
                        onClick={() => handleFilterClick('approved')}
                        className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Approved ({approvedCount})
                    </button>
                    <button
                        onClick={() => handleFilterClick('rejected')}
                        className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        Rejected ({rejectedCount})
                    </button>
                    <button
                        onClick={() => handleFilterClick('all')}
                        className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        All Requests ({allRequests.length})
                    </button>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {displayedRequests.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {displayedRequests.map((request) => (
                            <div key={request.id} className="p-6 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {request.companies?.company_name || 'Company'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    Job: #{request.job_id?.substring(0, 8)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">₦{parseFloat(request.amount || 0).toLocaleString()}</p>
                                                <span className={`inline-block px-3 py-1 text-sm rounded-full ${getStatusColor(request.status)}`}>
                                                    {request.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <p className="font-medium mb-1">Reason for Request:</p>
                                            <p className="text-gray-700">{request.reason}</p>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Bank Details</p>
                                                <p className="font-medium">
                                                    {request.companies?.bank_name} •••{request.companies?.bank_account?.slice(-4)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Job Amount</p>
                                                <p className="font-medium">₦{request.jobs?.quoted_price?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Upfront Paid</p>
                                                <p className="font-medium">₦{request.jobs?.upfront_payment?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Requested On</p>
                                                <p className="font-medium">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {request.admin_notes && (
                                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                                <p className="text-sm text-blue-700">
                                                    <span className="font-medium">Admin Note:</span> {request.admin_notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons (only for pending requests) */}
                                {request.status === 'pending' && (
                                    <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                                        <button
                                            onClick={() => {
                                                const notes = prompt('Add approval notes (optional):');
                                                if (notes !== null) {
                                                    handleStatusUpdate(request.id, 'approved', notes);
                                                }
                                            }}
                                            disabled={processingId === request.id}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {processingId === request.id ? 'Processing...' : 'Approve Disbursement'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const notes = prompt('Reason for rejection:');
                                                if (notes) {
                                                    handleStatusUpdate(request.id, 'rejected', notes);
                                                }
                                            }}
                                            disabled={processingId === request.id}
                                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                        >
                                            Reject Request
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">💰</span>
                        </div>
                        <h3 className="text-xl font-medium text-gray-700">No Disbursement Requests</h3>
                        <p className="text-gray-500 mt-2">
                            {filter === 'all'
                                ? "No disbursement requests found."
                                : `No ${filter} disbursement requests found.`}
                        </p>
                    </div>
                )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-700">Approved Today</p>
                            <p className="text-2xl font-bold text-green-800 mt-2">
                                ₦{approvedTodayAmount.toLocaleString()}
                            </p>
                        </div>
                        <span className="text-3xl">✅</span>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-yellow-700">Awaiting Review</p>
                            <p className="text-2xl font-bold text-yellow-800 mt-2">
                                {pendingCount} requests
                            </p>
                        </div>
                        <span className="text-3xl">⏳</span>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-700">Total Processed</p>
                            <p className="text-2xl font-bold text-blue-800 mt-2">
                                ₦{approvedAmount.toLocaleString()}
                            </p>
                        </div>
                        <span className="text-3xl">💸</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DisbursementRequests;