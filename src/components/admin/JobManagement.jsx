// src/components/admin/JobManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

// ─── Status config ───────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: { label: 'Pending', color: 'amber' },
    onsite_fee_requested: { label: 'Onsite Fee Requested', color: 'orange' },
    onsite_fee_pending_confirmation: { label: 'Onsite Fee Pending', color: 'blue' },
    onsite_fee_paid: { label: 'Onsite Fee Paid', color: 'teal' },
    price_set: { label: 'Price Set', color: 'blue' },
    deposit_paid: { label: 'Deposit Paid', color: 'violet' },
    work_ongoing: { label: 'Work Ongoing', color: 'indigo' },
    intermediate_paid: { label: 'Intermediate Paid', color: 'violet' },
    work_completed: { label: 'Work Completed', color: 'orange' },
    work_disputed: { label: 'Work Disputed', color: 'red' },
    work_rectified: { label: 'Work Rectified', color: 'amber' },
    ready_for_final_payment: { label: 'Ready for Final Payment', color: 'violet' },
    awaiting_final_payment: { label: 'Awaiting Final Payment', color: 'violet' },
    completed: { label: 'Completed', color: 'green' },
    declined_by_company: { label: 'Declined by Company', color: 'red' },
    declined_by_customer: { label: 'Declined by Customer', color: 'red' },
};

const COLOR_MAP = {
    amber: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
    orange: { bg: '#ffedd5', text: '#9a3412', dot: '#f97316' },
    blue: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
    teal: { bg: '#ccfbf1', text: '#0f766e', dot: '#14b8a6' },
    violet: { bg: '#ede9fe', text: '#5b21b6', dot: '#7c3aed' },
    indigo: { bg: '#e0e7ff', text: '#3730a3', dot: '#6366f1' },
    red: { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
    green: { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
    gray: { bg: '#f3f4f6', text: '#374151', dot: '#9ca3af' },
};

const ACTIVE_STATUSES = new Set([
    'pending', 'onsite_fee_requested', 'onsite_fee_pending_confirmation',
    'onsite_fee_paid', 'price_set', 'deposit_paid', 'work_ongoing',
    'intermediate_paid', 'work_completed', 'work_disputed', 'work_rectified',
    'ready_for_final_payment', 'awaiting_final_payment',
]);

const MAIN_TABS = [
    { key: 'active', label: 'Active Jobs', icon: '⚡' },
    { key: 'completed', label: 'Completed', icon: '✅' },
    { key: 'declined', label: 'Declined', icon: '✕' },
];

// ─── Helpers ─────────────────────────────────────────────────────
const getJobMainTab = (status) => {
    if (status === 'completed') return 'completed';
    if (status === 'declined_by_company' || status === 'declined_by_customer') return 'declined';
    return 'active';
};

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Pill badge ───────────────────────────────────────────────────
const StatusPill = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'gray' };
    const col = COLOR_MAP[cfg.color] || COLOR_MAP.gray;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: col.bg, color: col.text,
            padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
            whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
};

// ─── Job Card ─────────────────────────────────────────────────────
const JobCard = ({ job, formatCurrency, formatDate, updateJobStatus, updateOnsiteFee }) => {
    const [expanded, setExpanded] = useState(false);

    const handleStatusChange = (e) => {
        if (window.confirm(`Change status to "${e.target.options[e.target.selectedIndex].text}"?`)) {
            updateJobStatus(job.id, e.target.value);
        }
    };

    return (
        <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb',
            overflow: 'hidden', transition: 'box-shadow 0.2s',
            boxShadow: expanded ? '0 8px 32px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        }}>
            {/* ── Card Header (always visible) ── */}
            <div
                onClick={() => setExpanded(v => !v)}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                    {/* Category badge */}
                    <span style={{ background: '#f0fdf4', color: '#166534', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                        {job.category}
                    </span>
                    <span style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                        {job.sub_service}
                    </span>
                    <StatusPill status={job.status} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#16a34a' }}>{formatCurrency(job.quoted_price || job.budget)}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(job.created_at)}</div>
                    </div>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, transform: expanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s', flexShrink: 0,
                    }}>▼</div>
                </div>
            </div>

            {/* ── Collapsed summary strip ── */}
            {!expanded && (
                <div style={{ borderTop: '1px solid #f3f4f6', padding: '8px 20px', display: 'flex', gap: 16, flexWrap: 'wrap', background: '#fafafa' }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                        👤 <strong style={{ color: '#374151' }}>{job.customer?.customer_name || '—'}</strong>
                    </span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                        🏢 <strong style={{ color: '#374151' }}>{job.company_id ? job.company?.company_name : 'Unassigned'}</strong>
                    </span>
                    {job.location && (
                        <span style={{ fontSize: 12, color: '#6b7280' }}>📍 {job.location}</span>
                    )}
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>
                        ID: {job.id.substring(0, 8)}…
                    </span>
                </div>
            )}

            {/* ── Expanded Detail Panel ── */}
            {expanded && (
                <div style={{ borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>

                        {/* Customer Info */}
                        <InfoBlock title="Customer" icon="👤" color="#dcfce7" iconColor="#16a34a">
                            <InfoRow label="Name" value={job.customer?.customer_name} />
                            <InfoRow label="Phone" value={job.customer?.phone} />
                            <InfoRow label="Email" value={job.customer?.email} />
                        </InfoBlock>

                        {/* Company Info */}
                        <InfoBlock title={job.company_id ? 'Assigned Company' : 'Company'} icon="🏢" color="#dbeafe" iconColor="#1d4ed8">
                            <InfoRow label="Name" value={job.company_id ? job.company?.company_name : 'Not Assigned'} />
                            {job.company_id && <>
                                <InfoRow label="Phone" value={job.company?.phone} />
                                <InfoRow label="Email" value={job.company?.email} />
                                <InfoRow label="Status" value={job.company?.approved ? '✅ Verified' : '⚠️ Unverified'} />
                            </>}
                        </InfoBlock>

                        {/* Financials */}
                        <InfoBlock title="Financials" icon="₦" color="#fef3c7" iconColor="#b45309">
                            <InfoRow label="Budget" value={formatCurrency(job.budget)} />
                            <InfoRow label="Quoted" value={formatCurrency(job.quoted_price)} bold green />
                            <InfoRow label="Location" value={job.location || 'Not specified'} />
                        </InfoBlock>

                        {/* Admin Actions */}
                        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Actions</div>
                            <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 6 }}>Update Status</label>
                            <select
                                value={job.status}
                                onChange={handleStatusChange}
                                style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, marginBottom: 10, background: '#fff', color: '#111827' }}
                            >
                                <optgroup label="Active">
                                    <option value="pending">Pending</option>
                                    <option value="onsite_fee_requested">Onsite Fee Requested</option>
                                    <option value="onsite_fee_pending_confirmation">Onsite Fee Pending Confirmation</option>
                                    <option value="onsite_fee_paid">Onsite Fee Paid</option>
                                    <option value="price_set">Price Set</option>
                                    <option value="deposit_paid">Deposit Paid</option>
                                    <option value="work_ongoing">Work Ongoing</option>
                                    <option value="intermediate_paid">Intermediate Paid</option>
                                    <option value="work_completed">Work Completed</option>
                                    <option value="work_disputed">Work Disputed</option>
                                    <option value="work_rectified">Work Rectified</option>
                                    <option value="ready_for_final_payment">Ready for Final Payment</option>
                                    <option value="awaiting_final_payment">Awaiting Final Payment</option>
                                </optgroup>
                                <optgroup label="Terminal">
                                    <option value="completed">Completed</option>
                                    <option value="declined_by_company">Declined by Company</option>
                                    <option value="declined_by_customer">Declined by Customer</option>
                                </optgroup>
                            </select>

                            {(job.onsite_fee_requested || job.onsite_fee_amount) && (
                                <button
                                    onClick={() => {
                                        const newAmt = prompt(
                                            `Edit Onsite Fee\nCurrent: ₦${Number(job.onsite_fee_amount || 0).toLocaleString()}\n\nEnter new amount:`,
                                            job.onsite_fee_amount || ''
                                        );
                                        if (newAmt !== null) {
                                            const amt = parseFloat(newAmt);
                                            if (!isNaN(amt) && amt >= 0) {
                                                if (window.confirm(`Set onsite fee to ₦${amt.toLocaleString()}?`)) updateOnsiteFee(job.id, amt);
                                            } else {
                                                alert('Please enter a valid amount.');
                                            }
                                        }
                                    }}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #fed7aa', borderRadius: 8, background: '#fff7ed', color: '#c2410c', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
                                >
                                    ✏️ Edit Onsite Fee
                                </button>
                            )}

                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                ID: <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: 4 }}>{job.id.substring(0, 8)}…</code>
                            </div>
                            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                                Updated: {formatDate(job.updated_at || job.created_at)}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {job.description && (
                        <div style={{ margin: '0 20px 20px', background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #e5e7eb' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Description</div>
                            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{job.description}</p>
                        </div>
                    )}

                    {/* Onsite Fee Block */}
                    {(job.onsite_fee_requested || job.onsite_fee_amount) && (
                        <div style={{ margin: '0 20px 20px', background: '#fff7ed', borderRadius: 10, padding: '14px 16px', border: '1px solid #fed7aa' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', marginBottom: 10 }}>🏠 Onsite Fee Details</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                                <InfoRow label="Amount" value={formatCurrency(job.onsite_fee_amount)} />
                                <InfoRow label="Requested" value={job.onsite_fee_requested ? 'Yes' : 'No'} />
                                <InfoRow label="Paid" value={job.onsite_fee_paid ? `✅ Yes${job.onsite_fee_paid_at ? ` (${formatDate(job.onsite_fee_paid_at)})` : ''}` : '⏳ No'} />
                            </div>
                            {job.onsite_fee_bank_details && (() => {
                                try {
                                    const bd = typeof job.onsite_fee_bank_details === 'string'
                                        ? JSON.parse(job.onsite_fee_bank_details)
                                        : job.onsite_fee_bank_details;
                                    return (
                                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #fed7aa' }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', marginBottom: 6 }}>Bank Details</div>
                                            <InfoRow label="Bank" value={bd.bank_name} />
                                            <InfoRow label="Account" value={bd.account_number} />
                                            <InfoRow label="Name" value={bd.account_name} />
                                        </div>
                                    );
                                } catch { return null; }
                            })()}
                        </div>
                    )}

                    {/* Declined info */}
                    {job.status === 'declined_by_company' && job.declined_by_company && (
                        <div style={{ margin: '0 20px 20px', background: '#fef2f2', borderRadius: 10, padding: '14px 16px', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>⚠️ Declined By: {job.declined_by_company.company_name}</div>
                            {job.decline_reason && (
                                <p style={{ fontSize: 13, color: '#7f1d1d', margin: 0, lineHeight: 1.6 }}><strong>Reason:</strong> {job.decline_reason}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const InfoBlock = ({ title, icon, color, iconColor, children }) => (
    <div style={{ background: '#f9fafb', borderRadius: 12, padding: 14, border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</div>
    </div>
);

const InfoRow = ({ label, value, bold, green }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{label}</span>
        <span style={{ fontSize: 12, color: green ? '#16a34a' : '#111827', fontWeight: bold ? 700 : 500, textAlign: 'right', wordBreak: 'break-all' }}>{value || '—'}</span>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────
const JobManagement = () => {
    const { supabase } = useSupabase();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState('active');
    const [subFilter, setSubFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => { fetchJobs(); }, []);

    // Reset sub-filter when main tab changes
    useEffect(() => { setSubFilter('all'); setSearch(''); }, [mainTab]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const { data: jobsData, error: jobsError } = await supabase
                .from('jobs').select('*').order('created_at', { ascending: false });
            if (jobsError) throw jobsError;

            const customerIds = [...new Set(jobsData.map(j => j.customer_id).filter(Boolean))];
            const companyIds = [...new Set(jobsData.flatMap(j => [j.company_id, j.declined_by_company_id]).filter(Boolean))];

            let customersMap = {};
            if (customerIds.length > 0) {
                const { data } = await supabase.from('customers').select('id, customer_name, phone, email').in('id', customerIds);
                data?.forEach(c => { customersMap[c.id] = c; });
            }

            let companiesMap = {};
            if (companyIds.length > 0) {
                const { data } = await supabase.from('companies').select('id, company_name, phone, email, approved').in('id', companyIds);
                data?.forEach(c => { companiesMap[c.id] = c; });
            }

            const enriched = jobsData.map(job => ({
                ...job,
                customer: customersMap[job.customer_id] || { customer_name: 'Unknown Customer', phone: 'N/A', email: 'N/A' },
                company: companiesMap[job.company_id] || { company_name: job.company_id ? 'Unknown Company' : 'Unassigned', phone: 'N/A', email: 'N/A', approved: false },
                declined_by_company: companiesMap[job.declined_by_company_id] || null,
            }));

            setJobs(enriched);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateJobStatus = async (jobId, newStatus) => {
        try {
            const job = jobs.find(j => j.id === jobId);
            const onsiteStatuses = ['onsite_fee_requested', 'onsite_fee_pending_confirmation', 'onsite_fee_paid'];
            const leavingOnsite = onsiteStatuses.includes(job?.status) && !onsiteStatuses.includes(newStatus);

            const updateData = { status: newStatus, updated_at: new Date().toISOString() };
            if (leavingOnsite) Object.assign(updateData, { onsite_fee_requested: false, onsite_fee_amount: null, onsite_fee_bank_details: null, onsite_fee_paid: false, onsite_fee_paid_at: null });
            if (job?.status === 'declined_by_company' && newStatus !== 'declined_by_company') updateData.decline_reason = null;

            const { error } = await supabase.from('jobs').update(updateData).eq('id', jobId);
            if (error) throw error;

            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updateData } : j));
            alert('Job status updated successfully!');
        } catch (err) {
            console.error('Error updating job:', err);
            alert('Failed to update job status');
        }
    };

    const updateOnsiteFee = async (jobId, newAmount) => {
        try {
            const { error } = await supabase.from('jobs').update({ onsite_fee_amount: newAmount, updated_at: new Date().toISOString() }).eq('id', jobId);
            if (error) throw error;
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, onsite_fee_amount: newAmount } : j));
            alert(`Onsite fee updated to ₦${Number(newAmount).toLocaleString()}!`);
        } catch (err) {
            console.error('Error updating onsite fee:', err);
            alert('Failed to update onsite fee');
        }
    };

    // ── Derived data ──
    const tabJobs = useMemo(() => {
        const grouped = { active: [], completed: [], declined: [] };
        jobs.forEach(j => { grouped[getJobMainTab(j.status)]?.push(j); });
        return grouped;
    }, [jobs]);

    // Sub-filter options: statuses present in this tab (excluding 'all')
    const subFilterOptions = useMemo(() => {
        const statusCounts = {};
        (tabJobs[mainTab] || []).forEach(j => {
            statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
        });
        return statusCounts; // { status: count }
    }, [tabJobs, mainTab]);

    const filteredJobs = useMemo(() => {
        let result = tabJobs[mainTab] || [];
        if (subFilter !== 'all') result = result.filter(j => j.status === subFilter);
        if (search.trim()) {
            const s = search.toLowerCase();
            result = result.filter(j =>
                j.id?.toLowerCase().includes(s) ||
                j.category?.toLowerCase().includes(s) ||
                j.sub_service?.toLowerCase().includes(s) ||
                j.description?.toLowerCase().includes(s) ||
                j.customer?.customer_name?.toLowerCase().includes(s) ||
                j.company?.company_name?.toLowerCase().includes(s) ||
                j.declined_by_company?.company_name?.toLowerCase().includes(s) ||
                j.decline_reason?.toLowerCase().includes(s)
            );
        }
        return result;
    }, [tabJobs, mainTab, subFilter, search]);

    const totalValue = useMemo(() => jobs.reduce((s, j) => s + (j.quoted_price || 0), 0), [jobs]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#16a34a', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 1200, margin: '0 auto', padding: '0 0 40px' }}>

            {/* ── Page Header ── */}
            <div style={{ background: 'linear-gradient(135deg, #052e16 0%, #14532d 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Job Management</h1>
                        <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: 13 }}>View and manage all platform jobs</p>
                    </div>
                    {/* Summary chips */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Total Jobs', value: jobs.length, bg: 'rgba(255,255,255,0.12)' },
                            { label: 'Active', value: tabJobs.active.length, bg: 'rgba(34,197,94,0.25)' },
                            { label: 'Completed', value: tabJobs.completed.length, bg: 'rgba(59,130,246,0.25)' },
                            { label: 'Declined', value: tabJobs.declined.length, bg: 'rgba(239,68,68,0.2)' },
                        ].map(chip => (
                            <div key={chip.label} style={{ background: chip.bg, borderRadius: 10, padding: '8px 14px', textAlign: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{chip.value}</div>
                                <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{chip.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total value */}
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Platform Value</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#4ade80' }}>{formatCurrency(totalValue)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Job Value</div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{formatCurrency(jobs.length > 0 ? Math.round(totalValue / jobs.length) : 0)}</div>
                    </div>
                </div>
            </div>

            {/* ── Main Tabs ── */}
            <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 12, padding: 4, marginBottom: 16 }}>
                {MAIN_TABS.map(tab => {
                    const count = tabJobs[tab.key]?.length || 0;
                    const active = mainTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setMainTab(tab.key)}
                            style={{
                                flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                background: active ? '#fff' : 'transparent',
                                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                color: active ? '#111827' : '#6b7280',
                                fontWeight: active ? 700 : 500,
                                fontSize: 13, transition: 'all 0.15s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                        >
                            <span style={{ fontSize: 14 }}>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span style={{
                                background: active ? (tab.key === 'active' ? '#dcfce7' : tab.key === 'completed' ? '#dbeafe' : '#fee2e2') : '#e5e7eb',
                                color: active ? (tab.key === 'active' ? '#15803d' : tab.key === 'completed' ? '#1d4ed8' : '#b91c1c') : '#9ca3af',
                                padding: '1px 7px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                            }}>{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Search ── */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
                <input
                    type="text"
                    placeholder="Search by name, category, job ID, description…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px 11px 42px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                />
                {search && (
                    <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: '#e5e7eb', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                )}
            </div>

            {/* ── Sub-filter pills (only statuses with jobs) ── */}
            {Object.keys(subFilterOptions).length > 1 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    <button
                        onClick={() => setSubFilter('all')}
                        style={{
                            padding: '5px 12px', borderRadius: 100, border: '1px solid',
                            borderColor: subFilter === 'all' ? '#16a34a' : '#e5e7eb',
                            background: subFilter === 'all' ? '#dcfce7' : '#fff',
                            color: subFilter === 'all' ? '#15803d' : '#6b7280',
                            fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        All <span style={{ opacity: 0.7 }}>({tabJobs[mainTab]?.length || 0})</span>
                    </button>
                    {Object.entries(subFilterOptions).map(([status, count]) => {
                        const cfg = STATUS_CONFIG[status] || { label: status, color: 'gray' };
                        const col = COLOR_MAP[cfg.color] || COLOR_MAP.gray;
                        const active = subFilter === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setSubFilter(status)}
                                style={{
                                    padding: '5px 12px', borderRadius: 100, border: '1px solid',
                                    borderColor: active ? col.dot : '#e5e7eb',
                                    background: active ? col.bg : '#fff',
                                    color: active ? col.text : '#6b7280',
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}
                            >
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? col.dot : '#d1d5db', flexShrink: 0 }} />
                                {cfg.label}
                                <span style={{ opacity: 0.7 }}>({count})</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Results count ── */}
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                Showing <strong style={{ color: '#374151' }}>{filteredJobs.length}</strong> job{filteredJobs.length !== 1 ? 's' : ''}
                {search && <> for "<strong style={{ color: '#374151' }}>{search}</strong>"</>}
            </div>

            {/* ── Jobs List ── */}
            {filteredJobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filteredJobs.map(job => (
                        <JobCard
                            key={job.id}
                            job={job}
                            formatCurrency={formatCurrency}
                            formatDate={formatDate}
                            updateJobStatus={updateJobStatus}
                            updateOnsiteFee={updateOnsiteFee}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>
                        {mainTab === 'completed' ? '✅' : mainTab === 'declined' ? '✕' : '📋'}
                    </div>
                    <h3 style={{ margin: '0 0 6px', color: '#374151', fontSize: 16, fontWeight: 700 }}>No Jobs Found</h3>
                    <p style={{ margin: '0 0 16px', color: '#9ca3af', fontSize: 13 }}>
                        {search
                            ? `No ${mainTab} jobs match "${search}"`
                            : `No ${mainTab} jobs${subFilter !== 'all' ? ` with status "${STATUS_CONFIG[subFilter]?.label || subFilter}"` : ''} yet.`}
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {search && <button onClick={() => setSearch('')} style={{ padding: '8px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Clear Search</button>}
                        {subFilter !== 'all' && <button onClick={() => setSubFilter('all')} style={{ padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Show All {mainTab}</button>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobManagement;