// src/components/admin/AdminStats.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';
import { Link } from 'react-router-dom';

const AdminStats = () => {
    const { supabase } = useSupabase();
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalRevenue: 0,
        activeCompanies: 0,
        activeCustomers: 0,
        pendingDisbursements: 0,
        pendingApprovals: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Get total jobs
            const { count: totalJobs } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true });

            // Get platform revenue (sum of platform_fee from completed jobs)
            const { data: revenueData } = await supabase
                .from('jobs')
                .select('platform_fee')
                .eq('status', 'completed');

            const totalRevenue = revenueData?.reduce((sum, job) => sum + (job.platform_fee || 0), 0) || 0;

            // Get active companies (approved)
            const { count: activeCompanies } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('approved', true);

            // Get active customers
            const { count: activeCustomers } = await supabase
                .from('customers')
                .select('*', { count: 'exact', head: true });

            // Get pending disbursements
            const { count: pendingDisbursements } = await supabase
                .from('disbursement_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // Get pending company approvals
            const { count: pendingApprovals } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true })
                .eq('approved', false);

            setStats({
                totalJobs: totalJobs || 0,
                totalRevenue,
                activeCompanies: activeCompanies || 0,
                activeCustomers: activeCustomers || 0,
                pendingDisbursements: pendingDisbursements || 0,
                pendingApprovals: pendingApprovals || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color, subtitle, link }) => {
        const colors = {
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            green: 'bg-green-50 text-green-700 border-green-200',
            purple: 'bg-purple-50 text-purple-700 border-purple-200',
            orange: 'bg-orange-50 text-orange-700 border-orange-200',
            red: 'bg-red-50 text-red-700 border-red-200',
        };

        const content = (
            <div className={`p-6 rounded-xl border ${colors[color]} transition-transform hover:scale-[1.02]`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium opacity-80">{title}</p>
                        <p className="text-3xl font-bold mt-2">
                            {title.includes('Revenue') ? `₦${value.toLocaleString()}` : value}
                        </p>
                        {subtitle && <p className="text-xs mt-1 opacity-75">{subtitle}</p>}
                    </div>
                    <span className="text-3xl">{icon}</span>
                </div>
            </div>
        );

        if (link) {
            return <Link to={link}>{content}</Link>;
        }

        return content;
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
            <h1 className="text-2xl font-bold text-gray-800">Platform Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Jobs"
                    value={stats.totalJobs}
                    icon="🔧"
                    color="blue"
                    subtitle="All platform jobs"
                />
                <StatCard
                    title="Platform Revenue"
                    value={stats.totalRevenue}
                    icon="💰"
                    color="green"
                    subtitle="From completed jobs"
                />
                <StatCard
                    title="Active Companies"
                    value={stats.activeCompanies}
                    icon="🏢"
                    color="purple"
                    subtitle="Verified & approved"
                    link="/admin/approvals"
                />
                <StatCard
                    title="Active Customers"
                    value={stats.activeCustomers}
                    icon="👤"
                    color="orange"
                    subtitle="Registered users"
                />
                <StatCard
                    title="Pending Disbursements"
                    value={stats.pendingDisbursements}
                    icon="💸"
                    color="red"
                    subtitle="Awaiting approval"
                    link="/admin/disbursements"
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon="✅"
                    color="blue"
                    subtitle="Companies awaiting verification"
                    link="/admin/approvals"
                />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        to="/admin/approvals"
                        className="p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-center"
                    >
                        <span className="block text-xl mb-2">✅</span>
                        Review Approvals
                    </Link>
                    <Link
                        to="/admin/disbursements"
                        className="p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center"
                    >
                        <span className="block text-xl mb-2">💰</span>
                        Process Disbursements
                    </Link>
                    <Link
                        to="/admin/jobs"
                        className="p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-center"
                    >
                        <span className="block text-xl mb-2">🔧</span>
                        Manage Jobs
                    </Link>
                    <Link
                        to="/admin/users"
                        className="p-4 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-center"
                    >
                        <span className="block text-xl mb-2">👥</span>
                        Manage Users
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AdminStats;