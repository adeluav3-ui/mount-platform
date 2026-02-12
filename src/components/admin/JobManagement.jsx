// src/components/admin/JobManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const JobManagement = () => {
    const { supabase } = useSupabase();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [customerNames, setCustomerNames] = useState({});
    const [companyNames, setCompanyNames] = useState({});

    useEffect(() => {
        fetchJobs();
    }, []);

    // Fetch all jobs and enrich with names
    const fetchJobs = async () => {
        try {
            setLoading(true);

            // Fetch all jobs
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (jobsError) throw jobsError;

            // Get unique customer and company IDs
            const customerIds = [...new Set(jobsData.map(j => j.customer_id).filter(Boolean))];
            // In fetchJobs function, update the companyIds collection:
            const companyIds = [...new Set(
                jobsData.map(j => {
                    // Include both current company and declined company
                    if (j.company_id) return j.company_id;
                    if (j.declined_by_company_id) return j.declined_by_company_id;
                    return null;
                }).filter(Boolean)
            )];

            // Fetch customer names
            let customersMap = {};
            if (customerIds.length > 0) {
                const { data: customersData } = await supabase
                    .from('customers')
                    .select('id, customer_name, phone, email')
                    .in('id', customerIds);

                if (customersData) {
                    customersData.forEach(customer => {
                        customersMap[customer.id] = customer;
                    });
                }
            }

            // Fetch company names
            let companiesMap = {};
            if (companyIds.length > 0) {
                const { data: companiesData } = await supabase
                    .from('companies')
                    .select('id, company_name, phone, email, approved')
                    .in('id', companyIds);

                if (companiesData) {
                    companiesData.forEach(company => {
                        companiesMap[company.id] = company;
                    });
                }
            }

            // Enrich jobs with names
            // After fetching companiesMap, enrich jobs with both current and declined company info:
            const enrichedJobs = jobsData.map(job => ({
                ...job,
                customer: customersMap[job.customer_id] || {
                    customer_name: 'Unknown Customer',
                    phone: 'N/A',
                    email: 'N/A'
                },
                company: companiesMap[job.company_id] || {
                    company_name: job.company_id ? 'Unknown Company' : 'Unassigned',
                    phone: 'N/A',
                    email: 'N/A',
                    approved: false
                },
                declined_by_company: companiesMap[job.declined_by_company_id] || null // Add this line
            }));
            setJobs(enrichedJobs);
            setCustomerNames(customersMap);
            setCompanyNames(companiesMap);

        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate counts from ALL jobs
    const statusCounts = useMemo(() => ({
        all: jobs.length,
        pending: jobs.filter(j => j.status === 'pending').length,
        onsite_fee_requested: jobs.filter(j => j.status === 'onsite_fee_requested').length,
        onsite_fee_pending_confirmation: jobs.filter(j => j.status === 'onsite_fee_pending_confirmation').length,
        onsite_fee_paid: jobs.filter(j => j.status === 'onsite_fee_paid').length,
        price_set: jobs.filter(j => j.status === 'price_set').length,
        deposit_paid: jobs.filter(j => j.status === 'deposit_paid').length,
        work_ongoing: jobs.filter(j => j.status === 'work_ongoing').length,
        intermediate_paid: jobs.filter(j => j.status === 'intermediate_paid').length,
        work_completed: jobs.filter(j => j.status === 'work_completed').length,
        work_disputed: jobs.filter(j => j.status === 'work_disputed').length,
        work_rectified: jobs.filter(j => j.status === 'work_rectified').length,
        ready_for_final_payment: jobs.filter(j => j.status === 'ready_for_final_payment').length,
        awaiting_final_payment: jobs.filter(j => j.status === 'awaiting_final_payment').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        declined_by_company: jobs.filter(j => j.status === 'declined_by_company').length,
        declined_by_customer: jobs.filter(j => j.status === 'declined_by_customer').length,
    }), [jobs]);

    // Filter jobs based on filter and search
    const filteredJobs = useMemo(() => {
        let result = [...jobs];

        // Apply status filter
        if (filter !== 'all') {
            result = result.filter(job => job.status === filter);
        }

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(job =>
                job.id?.toLowerCase().includes(searchLower) ||
                job.category?.toLowerCase().includes(searchLower) ||
                job.sub_service?.toLowerCase().includes(searchLower) ||
                job.description?.toLowerCase().includes(searchLower) ||
                job.customer?.customer_name?.toLowerCase().includes(searchLower) ||
                job.company?.company_name?.toLowerCase().includes(searchLower) ||
                job.declined_by_company?.company_name?.toLowerCase().includes(searchLower) ||
                job.decline_reason?.toLowerCase().includes(searchLower)
            );
        }

        return result;
    }, [jobs, filter, search]);

    const updateJobStatus = async (jobId, newStatus) => {
        try {
            // Determine if we need to clear onsite fee data
            const job = jobs.find(j => j.id === jobId);
            const isOnsiteFeeStatus = [
                'onsite_fee_requested',
                'onsite_fee_pending_confirmation',
                'onsite_fee_paid'
            ].includes(job?.status);

            const isMovingAwayFromOnsiteFee = isOnsiteFeeStatus && ![
                'onsite_fee_requested',
                'onsite_fee_pending_confirmation',
                'onsite_fee_paid'
            ].includes(newStatus);

            // Prepare update data
            const updateData = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            // Clear onsite fee data if moving away from onsite fee status
            if (isMovingAwayFromOnsiteFee) {
                updateData.onsite_fee_requested = false;
                updateData.onsite_fee_amount = null;
                updateData.onsite_fee_bank_details = null;
                updateData.onsite_fee_paid = false;
                updateData.onsite_fee_paid_at = null;
            }

            // Also clear decline reason if moving away from declined status
            if (job?.status === 'declined_by_company' && newStatus !== 'declined_by_company') {
                updateData.decline_reason = null;
            }

            const { error } = await supabase
                .from('jobs')
                .update(updateData)
                .eq('id', jobId);

            if (error) throw error;

            // Update local state with ALL changes
            setJobs(prev => prev.map(j =>
                j.id === jobId
                    ? {
                        ...j,
                        ...updateData,  // Spread all update data
                        updated_at: new Date().toISOString()
                    }
                    : j
            ));

            alert('Job status updated successfully!');

        } catch (error) {
            console.error('Error updating job:', error);
            alert('Failed to update job status');
        }
    };

    const updateOnsiteFee = async (jobId, newAmount) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({
                    onsite_fee_amount: newAmount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId);

            if (error) throw error;

            // Update local state
            setJobs(prev => prev.map(job =>
                job.id === jobId
                    ? { ...job, onsite_fee_amount: newAmount, updated_at: new Date().toISOString() }
                    : job
            ));

            alert(`Onsite fee updated to ₦${Number(newAmount).toLocaleString()}!`);
        } catch (error) {
            console.error('Error updating onsite fee:', error);
            alert('Failed to update onsite fee');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            // Basic states
            pending: 'bg-yellow-100 text-yellow-800',

            // Onsite fee flow
            onsite_fee_requested: 'bg-orange-100 text-orange-800',
            onsite_fee_pending_confirmation: 'bg-blue-100 text-blue-800',
            onsite_fee_paid: 'bg-green-100 text-green-800',

            // Quote and payment flow
            price_set: 'bg-blue-100 text-blue-800',
            deposit_paid: 'bg-purple-100 text-purple-800',

            // Work progress with intermediate payments
            work_ongoing: 'bg-indigo-100 text-indigo-800',
            intermediate_paid: 'bg-purple-100 text-purple-800',
            work_completed: 'bg-orange-100 text-orange-800',

            // Dispute flow
            work_disputed: 'bg-red-100 text-red-800',
            work_rectified: 'bg-yellow-100 text-yellow-800',

            // Final payment flow
            ready_for_final_payment: 'bg-purple-100 text-purple-800',
            awaiting_final_payment: 'bg-purple-100 text-purple-800',

            // Completion
            completed: 'bg-green-100 text-green-800',

            // Declined
            declined_by_company: 'bg-red-100 text-red-800',
            declined_by_customer: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

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
                        <h1 className="text-2xl font-bold text-gray-800">Job Management</h1>
                        <p className="text-gray-600 mt-1">View and manage all platform jobs</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">{jobs.length}</p>
                        <p className="text-sm text-gray-500">Total Jobs</p>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(statusCounts).map(([status, count]) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg capitalize transition-colors ${filter === status
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <span className="capitalize">{status.replace('_', ' ')}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${filter === status ? 'bg-white/30' : 'bg-gray-200'}`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by job ID, customer name, company name, category, or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <div className="absolute left-4 top-3.5 text-gray-400">
                        🔍
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500">Total Job Value</div>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(jobs.reduce((sum, job) => sum + (job.quoted_price || 0), 0))}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500">Avg. Job Value</div>
                    <div className="text-2xl font-bold">
                        {formatCurrency(jobs.length > 0
                            ? Math.round(jobs.reduce((sum, job) => sum + (job.quoted_price || 0), 0) / jobs.length)
                            : 0)}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500">Currently Viewing</div>
                    <div className="text-2xl font-bold">{filteredJobs.length} jobs</div>
                </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredJobs.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredJobs.map((job) => (
                            <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        {/* Job Header */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                                {job.id.substring(0, 8)}...
                                            </code>
                                            <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(job.status)}`}>
                                                {job.status.replace(/_/g, ' ')}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {formatDate(job.created_at)}
                                            </span>
                                        </div>

                                        {/* Job Details */}
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-800">
                                                    {job.category} - {job.sub_service}
                                                </h3>
                                                {job.description && (
                                                    <p className="text-gray-600 mt-1 line-clamp-2">
                                                        {job.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Customer & Company Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                            <span className="text-green-600 font-bold">C</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Customer</p>
                                                            <p className="font-medium">{job.customer.customer_name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400">📞</span>
                                                            <span>{job.customer.phone}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400">✉️</span>
                                                            <span>{job.customer.email}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 p-3 rounded-lg">
                                                    {/* Current/Assigned Company */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${job.company.approved ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                                                            <span className={`font-bold ${job.company.approved ? 'text-blue-600' : 'text-yellow-600'}`}>B</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-500">Assigned Company</p>
                                                            <p className="font-medium">
                                                                {job.company_id ? job.company.company_name : 'Not Assigned'}
                                                                {!job.company_id && job.status === 'declined_by_company' && (
                                                                    <span className="ml-2 text-xs text-red-600">(Declined)</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Declined Company Info - Show if job was declined */}
                                                    {job.status === 'declined_by_company' && job.declined_by_company && (
                                                        <div className="mt-3 pt-3 border-t border-red-200">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-red-600 font-bold">⚠️</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm text-red-600 font-medium">Declined By</p>
                                                                    <p className="font-medium text-red-700">
                                                                        {job.declined_by_company.company_name || 'Unknown Company'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Show Decline Reason */}
                                                            {job.decline_reason && (
                                                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                                    <p className="text-xs text-red-500 font-medium mb-1">Reason for declining:</p>
                                                                    <p className="text-sm text-red-700 whitespace-pre-wrap">{job.decline_reason}</p>
                                                                </div>
                                                            )}

                                                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-400">📞</span>
                                                                    <span>{job.declined_by_company.phone || 'N/A'}</span>
                                                                </div>
                                                                {job.declined_by_company.approved && (
                                                                    <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                                                                        <span>✓</span>
                                                                        <span>Verified</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Company Contact Info - Only show if company is assigned */}
                                                    {job.company_id && (
                                                        <div className="text-sm text-gray-600 mt-2 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-400">📞</span>
                                                                <span>{job.company.phone}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-400">✉️</span>
                                                                <span className="truncate">{job.company.email}</span>
                                                            </div>
                                                            {job.company.approved && (
                                                                <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                                                                    <span>✓</span>
                                                                    <span>Verified</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Financial Info */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-200">
                                                <div>
                                                    <p className="text-sm text-gray-500">Customer Budget</p>
                                                    <p className="font-medium text-lg">{formatCurrency(job.budget)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Quoted Price</p>
                                                    <p className="font-bold text-lg text-green-600">{formatCurrency(job.quoted_price)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Location</p>
                                                    <p className="font-medium">{job.location || 'Not specified'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Last Updated</p>
                                                    <p className="font-medium">{formatDate(job.updated_at || job.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Onsite Fee Information - Show if applicable */}
                                    {(job.onsite_fee_requested || job.onsite_fee_amount) && (
                                        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                            <h4 className="font-medium text-orange-800 mb-2">Onsite Fee Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <p className="text-sm text-orange-600">Fee Amount</p>
                                                    <p className="font-bold text-lg">{formatCurrency(job.onsite_fee_amount || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-orange-600">Fee Status</p>
                                                    <p className="font-medium">
                                                        {job.onsite_fee_paid ? '✅ Paid' : '⏳ Pending'}
                                                        {job.onsite_fee_paid_at && (
                                                            <span className="text-xs text-gray-500 block">
                                                                Paid on: {formatDate(job.onsite_fee_paid_at)}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-orange-600">Requested</p>
                                                    <p className="font-medium">{job.onsite_fee_requested ? 'Yes' : 'No'}</p>
                                                </div>
                                            </div>

                                            {/* Bank Details if available */}
                                            {job.onsite_fee_bank_details && (
                                                <div className="mt-3 pt-3 border-t border-orange-300">
                                                    <p className="text-sm text-orange-600 mb-1">Bank Details Provided:</p>
                                                    <div className="text-sm bg-white p-2 rounded border">
                                                        {(() => {
                                                            try {
                                                                const bankDetails = typeof job.onsite_fee_bank_details === 'string'
                                                                    ? JSON.parse(job.onsite_fee_bank_details)
                                                                    : job.onsite_fee_bank_details;

                                                                return (
                                                                    <div className="space-y-1">
                                                                        <p><span className="font-medium">Bank:</span> {bankDetails.bank_name}</p>
                                                                        <p><span className="font-medium">Account:</span> {bankDetails.account_number}</p>
                                                                        <p><span className="font-medium">Name:</span> {bankDetails.account_name}</p>
                                                                    </div>
                                                                );
                                                            } catch (e) {
                                                                return <p className="text-gray-500">Unable to parse bank details</p>;
                                                            }
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* Action Buttons */}
                                    <div className="lg:w-48 flex flex-col space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Update Status
                                            </label>
                                            <select
                                                value={job.status}
                                                onChange={(e) => updateJobStatus(job.id, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="pending">Pending</option>

                                                {/* Onsite fee flow */}
                                                <option value="onsite_fee_requested">Onsite Fee Requested</option>
                                                <option value="onsite_fee_pending_confirmation">Onsite Fee Pending Confirmation</option>
                                                <option value="onsite_fee_paid">Onsite Fee Paid</option>

                                                {/* Quote and payment flow */}
                                                <option value="price_set">Price Set</option>
                                                <option value="deposit_paid">Deposit Paid</option>

                                                {/* Work progress with intermediate payments */}
                                                <option value="work_ongoing">Work Ongoing</option>
                                                <option value="intermediate_paid">Intermediate Paid</option>
                                                <option value="work_completed">Work Completed</option>

                                                {/* Dispute flow */}
                                                <option value="work_disputed">Work Disputed</option>
                                                <option value="work_rectified">Work Rectified</option>

                                                {/* Final payment flow */}
                                                <option value="ready_for_final_payment">Ready for Final Payment</option>
                                                <option value="awaiting_final_payment">Awaiting Final Payment</option>

                                                {/* Completion */}
                                                <option value="completed">Completed</option>

                                                {/* Declined */}
                                                <option value="declined_by_company">Declined by Company</option>
                                                <option value="declined_by_customer">Declined by Customer</option>
                                            </select>
                                        </div>

                                        <button
                                            onClick={() => {
                                                // Show detailed modal or navigate to job details
                                                const details = `
Job Details:
────────────
ID: ${job.id}
Status: ${job.status}
Category: ${job.category}
Sub-service: ${job.sub_service}
${job.description ? `Description: ${job.description}` : ''}

Customer Information:
────────────────────
Name: ${job.customer.customer_name}
Phone: ${job.customer.phone}
Email: ${job.customer.email}

Company Information:
────────────────────
Name: ${job.company.company_name}
Phone: ${job.company.phone}
Status: ${job.company.approved ? 'Verified ✓' : 'Not Verified'}

Financial Information:
────────────────────
Customer Budget: ${formatCurrency(job.budget)}
Quoted Price: ${formatCurrency(job.quoted_price)}
Location: ${job.location || 'Not specified'}

Timestamps:
──────────
Created: ${new Date(job.created_at).toLocaleString()}
Updated: ${new Date(job.updated_at || job.created_at).toLocaleString()}
                                                `.trim();

                                                alert(details);
                                            }}
                                            className="w-full px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                        >
                                            View Full Details
                                        </button>

                                        <button
                                            onClick={() => {
                                                // Quick actions menu
                                                const actions = [
                                                    'Send reminder to company',
                                                    'Contact customer',
                                                    'View photos',
                                                    'Export job details'
                                                ];

                                                const selected = prompt(
                                                    `Quick Actions for Job ${job.id.substring(0, 8)}...\n\n` +
                                                    actions.map((action, i) => `${i + 1}. ${action}`).join('\n') +
                                                    '\n\nEnter action number:'
                                                );

                                                if (selected && actions[parseInt(selected) - 1]) {
                                                    alert(`Action selected: ${actions[parseInt(selected) - 1]}`);
                                                }
                                            }}
                                            className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Quick Actions
                                        </button>
                                        {(job.onsite_fee_requested || job.onsite_fee_amount) && (
                                            <button
                                                onClick={() => {
                                                    const newAmount = prompt(
                                                        `Edit Onsite Fee Amount for ${job.id.substring(0, 8)}...\n\n` +
                                                        `Current amount: ₦${Number(job.onsite_fee_amount || 0).toLocaleString()}\n\n` +
                                                        `Enter new amount (in Naira):`,
                                                        job.onsite_fee_amount || ''
                                                    );

                                                    if (newAmount !== null) {
                                                        const amount = parseFloat(newAmount);
                                                        if (!isNaN(amount) && amount >= 0) {
                                                            if (confirm(`Update onsite fee to ₦${amount.toLocaleString()}?`)) {
                                                                updateOnsiteFee(job.id, amount);
                                                            }
                                                        } else {
                                                            alert('Please enter a valid amount.');
                                                        }
                                                    }
                                                }}
                                                className="w-full px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors"
                                            >
                                                ✏️ Edit Onsite Fee
                                            </button>
                                        )}

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">🔧</span>
                        </div>
                        <h3 className="text-xl font-medium text-gray-700">No Jobs Found</h3>
                        <p className="text-gray-500 mt-2">
                            {search
                                ? `No jobs match your search "${search}"`
                                : filter === 'all'
                                    ? 'No jobs on the platform yet.'
                                    : `No jobs with status "${filter.replace('_', ' ')}" found.`}
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                        {filter !== 'all' && (
                            <button
                                onClick={() => setFilter('all')}
                                className="mt-4 ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Show All Jobs
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobManagement;