// src/components/admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../context/SupabaseContext';

const AdminSettings = () => {
    const { supabase } = useSupabase();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        // Platform Settings
        platformName: 'Mount',
        platformDescription: 'Home Services Marketplace',
        supportEmail: 'support@Mount.com',
        supportPhone: '+234 800 123 4567',

        // Financial Settings
        platformFeePercentage: 5,
        depositPercentage: 50,
        minimumJobAmount: 5000,
        maximumJobAmount: 5000000,

        // Payment Settings
        paymentGateway: 'paystack',
        currency: 'NGN',
        currencySymbol: '₦',
        allowPartialPayouts: true,
        maxAdvancePercentage: 30,

        // Company Settings
        autoApproveCompanies: false,
        requireCompanyVerification: true,
        companyVerificationFee: 0,
        minimumCompanyRating: 3.0,

        // Job Settings
        defaultJobExpiryDays: 7,
        maxPhotosPerJob: 5,
        allowCustomerCancellation: true,
        cancellationFeePercentage: 10,

        // Notification Settings
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        sendWelcomeEmail: true,

        // Security Settings
        requireTwoFactorAuth: false,
        sessionTimeoutMinutes: 60,
        maxLoginAttempts: 5,

        // Platform Status
        platformActive: true,
        maintenanceMode: false,
        newRegistrations: true,

        // Theme Settings
        primaryColor: '#065f46', // naijaGreen
        secondaryColor: '#047857', // darkGreen
        accentColor: '#10b981',

        // SEO Settings
        metaTitle: 'Mount - Home Services in Nigeria',
        metaDescription: 'Connect with verified service providers for home repairs and maintenance',
        metaKeywords: 'home services, repairs, maintenance, Nigeria, electrician, plumber'
    });

    const [platformStats, setPlatformStats] = useState({
        totalUsers: 0,
        totalCompanies: 0,
        totalJobs: 0,
        totalRevenue: 0,
        activeJobs: 0
    });

    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        fetchPlatformStats();
        fetchRecentLogs();
    }, []);

    const fetchPlatformStats = async () => {
        try {
            // Fetch total users
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // Fetch total companies
            const { count: companyCount } = await supabase
                .from('companies')
                .select('*', { count: 'exact', head: true });

            // Fetch total jobs
            const { count: jobCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true });

            // Fetch total revenue (sum of platform fees from completed jobs)
            const { data: completedJobs } = await supabase
                .from('jobs')
                .select('platform_fee')
                .eq('status', 'completed');

            const totalRevenue = completedJobs?.reduce((sum, job) =>
                sum + (parseFloat(job.platform_fee) || 0), 0) || 0;

            // Fetch active jobs
            const { count: activeJobCount } = await supabase
                .from('jobs')
                .select('*', { count: 'exact', head: true })
                .in('status', ['work_in_progress', 'deposit_paid', 'price_set']);

            setPlatformStats({
                totalUsers: userCount || 0,
                totalCompanies: companyCount || 0,
                totalJobs: jobCount || 0,
                totalRevenue,
                activeJobs: activeJobCount || 0
            });

        } catch (error) {
            console.error('Error fetching platform stats:', error);
        }
    };

    const fetchRecentLogs = async () => {
        try {
            const { data } = await supabase
                .from('admin_actions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const handleInputChange = (category, field, value) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            // In a real app, you'd save to a settings table
            // For now, we'll simulate saving
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Log the settings change
            await supabase.from('admin_actions').insert({
                action_type: 'settings_update',
                description: 'Platform settings updated',
                metadata: { settings: settings }
            });

            alert('Settings saved successfully!');
            fetchRecentLogs();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefaults = () => {
        if (confirm('Reset all settings to default values?')) {
            setSettings({
                ...settings,
                platformFeePercentage: 5,
                depositPercentage: 50,
                autoApproveCompanies: false,
                defaultJobExpiryDays: 7
            });
            alert('Settings reset to defaults');
        }
    };

    const handleMaintenanceToggle = async () => {
        const newMode = !settings.maintenanceMode;
        const confirmed = confirm(
            newMode
                ? 'Enable maintenance mode? This will show a maintenance page to all users.'
                : 'Disable maintenance mode? Platform will be accessible to all users.'
        );

        if (confirmed) {
            setSettings(prev => ({ ...prev, maintenanceMode: newMode }));
            await handleSaveSettings();
        }
    };

    const handlePlatformToggle = async () => {
        const newStatus = !settings.platformActive;
        const confirmed = confirm(
            newStatus
                ? 'Activate platform?'
                : 'Deactivate platform? This will prevent all user activities.'
        );

        if (confirmed) {
            setSettings(prev => ({ ...prev, platformActive: newStatus }));
            await handleSaveSettings();
        }
    };

    const formatCurrency = (amount) => {
        return `${settings.currencySymbol}${parseFloat(amount || 0).toLocaleString()}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                        <h1 className="text-2xl font-bold text-gray-800">Platform Settings</h1>
                        <p className="text-gray-600 mt-1">Configure and manage platform settings</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${settings.platformActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {settings.platformActive ? 'Active' : 'Inactive'}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${settings.maintenanceMode ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                {settings.maintenanceMode ? 'Maintenance' : 'Normal'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold">{platformStats.totalUsers}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500">Verified Companies</p>
                    <p className="text-2xl font-bold">{platformStats.totalCompanies}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500">Total Jobs</p>
                    <p className="text-2xl font-bold">{platformStats.totalJobs}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500">Active Jobs</p>
                    <p className="text-2xl font-bold">{platformStats.activeJobs}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500">Platform Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(platformStats.totalRevenue)}</p>
                </div>
            </div>

            {/* Settings Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="flex overflow-x-auto">
                        {['general', 'financial', 'companies', 'jobs', 'notifications', 'security', 'reviews', 'theme', 'logs'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 font-medium text-sm capitalize whitespace-nowrap ${activeTab === tab
                                    ? 'border-b-2 border-green-600 text-green-600'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                            >
                                {tab.replace('_', ' ')}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Platform Name
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.platformName}
                                        onChange={(e) => handleInputChange('general', 'platformName', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Platform Description
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.platformDescription}
                                        onChange={(e) => handleInputChange('general', 'platformDescription', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Support Email
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Support Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={settings.supportPhone}
                                        onChange={(e) => handleInputChange('general', 'supportPhone', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">Platform Status</h3>
                                        <p className="text-sm text-gray-500">Control platform availability</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={handlePlatformToggle}
                                            className={`px-4 py-2 rounded-lg ${settings.platformActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                                        >
                                            {settings.platformActive ? 'Deactivate Platform' : 'Activate Platform'}
                                        </button>
                                        <button
                                            onClick={handleMaintenanceToggle}
                                            className={`px-4 py-2 rounded-lg ${settings.maintenanceMode ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
                                        >
                                            {settings.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="newRegistrations"
                                        checked={settings.newRegistrations}
                                        onChange={(e) => handleInputChange('general', 'newRegistrations', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="newRegistrations" className="ml-2 block text-sm text-gray-900">
                                        Allow new user registrations
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Settings */}
                    {activeTab === 'financial' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Platform Fee Percentage
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            value={settings.platformFeePercentage}
                                            onChange={(e) => handleInputChange('financial', 'platformFeePercentage', parseInt(e.target.value))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">Percentage taken from each transaction</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Deposit Percentage
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="10"
                                            max="100"
                                            value={settings.depositPercentage}
                                            onChange={(e) => handleInputChange('financial', 'depositPercentage', parseInt(e.target.value))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">Percentage paid upfront by customers</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Job Amount
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500">{settings.currencySymbol}</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            value={settings.minimumJobAmount}
                                            onChange={(e) => handleInputChange('financial', 'minimumJobAmount', parseInt(e.target.value))}
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Job Amount
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500">{settings.currencySymbol}</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            value={settings.maximumJobAmount}
                                            onChange={(e) => handleInputChange('financial', 'maximumJobAmount', parseInt(e.target.value))}
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Advance Percentage
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={settings.maxAdvancePercentage}
                                            onChange={(e) => handleInputChange('financial', 'maxAdvancePercentage', parseInt(e.target.value))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">Maximum percentage companies can request as advance</p>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="allowPartialPayouts"
                                        checked={settings.allowPartialPayouts}
                                        onChange={(e) => handleInputChange('financial', 'allowPartialPayouts', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="allowPartialPayouts" className="ml-2 block text-sm text-gray-900">
                                        Allow partial payouts for materials
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Gateway
                                    </label>
                                    <select
                                        value={settings.paymentGateway}
                                        onChange={(e) => handleInputChange('financial', 'paymentGateway', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="paystack">Paystack</option>
                                        <option value="flutterwave">Flutterwave</option>
                                        <option value="stripe">Stripe</option>
                                        <option value="manual">Manual</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Currency
                                    </label>
                                    <select
                                        value={settings.currency}
                                        onChange={(e) => handleInputChange('financial', 'currency', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="NGN">Nigerian Naira (₦)</option>
                                        <option value="USD">US Dollar ($)</option>
                                        <option value="GBP">British Pound (£)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Service Fee Tiers Configuration */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Service Fee Tiers</h4>
                                <p className="text-sm text-gray-500 mb-4">Configure tiered service fees based on job amount</p>

                                <div className="space-y-4">
                                    {settings.serviceFeeTiers?.map((tier, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-700">From</span>
                                                    <input
                                                        type="number"
                                                        value={tier.min}
                                                        onChange={(e) => {
                                                            const newTiers = [...settings.serviceFeeTiers];
                                                            newTiers[index].min = parseInt(e.target.value) || 0;
                                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                        }}
                                                        className="w-32 px-3 py-1 border border-gray-300 rounded"
                                                        min="0"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">to</span>
                                                    <input
                                                        type="number"
                                                        value={tier.max}
                                                        onChange={(e) => {
                                                            const newTiers = [...settings.serviceFeeTiers];
                                                            newTiers[index].max = parseInt(e.target.value) || 0;
                                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                        }}
                                                        className="w-32 px-3 py-1 border border-gray-300 rounded"
                                                        min="0"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">:</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">Fee:</span>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">{settings.currencySymbol}</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={tier.fee}
                                                        onChange={(e) => {
                                                            const newTiers = [...settings.serviceFeeTiers];
                                                            newTiers[index].fee = parseInt(e.target.value) || 0;
                                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                        }}
                                                        className="w-32 pl-8 pr-3 py-1 border border-gray-300 rounded"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newTiers = settings.serviceFeeTiers.filter((_, i) => i !== index);
                                                    handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                }}
                                                className="text-red-600 hover:text-red-800 p-1"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => {
                                            const newTiers = [...(settings.serviceFeeTiers || [])];
                                            const lastTier = newTiers[newTiers.length - 1];
                                            newTiers.push({
                                                min: lastTier ? lastTier.max + 1 : 0,
                                                max: lastTier ? lastTier.max + 100000 : 100000,
                                                fee: lastTier ? lastTier.fee + 1000 : 1000
                                            });
                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                        }}
                                        className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add New Tier
                                    </button>
                                </div>
                            </div>

                            {/* Promotion Settings */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Promotion Settings</h4>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isPromotionActive"
                                            checked={settings.isPromotionActive}
                                            onChange={(e) => handleInputChange('promotion', 'isPromotionActive', e.target.checked)}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="isPromotionActive" className="ml-2 block text-sm text-gray-900">
                                            Enable customer promotion period
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Promotion Period (Months)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={settings.promotionPeriodMonths}
                                                onChange={(e) => handleInputChange('promotion', 'promotionPeriodMonths', parseInt(e.target.value))}
                                                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-gray-500">months</span>
                                            </div>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            How many months new customers get free service fees
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>)}

                    {/* Company Settings */}
                    {activeTab === 'companies' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="autoApproveCompanies"
                                        checked={settings.autoApproveCompanies}
                                        onChange={(e) => handleInputChange('companies', 'autoApproveCompanies', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="autoApproveCompanies" className="ml-2 block text-sm text-gray-900">
                                        Auto-approve new companies
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="requireCompanyVerification"
                                        checked={settings.requireCompanyVerification}
                                        onChange={(e) => handleInputChange('companies', 'requireCompanyVerification', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="requireCompanyVerification" className="ml-2 block text-sm text-gray-900">
                                        Require company verification
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Verification Fee
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500">{settings.currencySymbol}</span>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            value={settings.companyVerificationFee}
                                            onChange={(e) => handleInputChange('companies', 'companyVerificationFee', parseInt(e.target.value))}
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Company Rating
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={settings.minimumCompanyRating}
                                            onChange={(e) => handleInputChange('companies', 'minimumCompanyRating', parseFloat(e.target.value))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-gray-500">stars</span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">Minimum rating to appear in search results</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Reviews tab content */}
                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Require Review Approval
                                    </label>
                                    <select
                                        value={settings.requireReviewApproval ? 'true' : 'false'}
                                        onChange={(e) => handleInputChange('reviews', 'requireReviewApproval', e.target.value === 'true')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="false">Auto-approve reviews</option>
                                        <option value="true">Require admin approval</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">
                                        When enabled, reviews require admin approval before going public
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Allow Company Responses
                                    </label>
                                    <select
                                        value={settings.allowCompanyResponses ? 'true' : 'false'}
                                        onChange={(e) => handleInputChange('reviews', 'allowCompanyResponses', e.target.value === 'true')}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="true">Allow responses</option>
                                        <option value="false">Disable responses</option>
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Allow companies to respond to customer reviews
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Review Length
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        value={settings.minimumReviewLength}
                                        onChange={(e) => handleInputChange('reviews', 'minimumReviewLength', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Minimum characters required for review text (0 for no minimum)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Review Photos
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={settings.maximumReviewPhotos}
                                        onChange={(e) => handleInputChange('reviews', 'maximumReviewPhotos', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        Maximum photos a customer can upload with a review
                                    </p>
                                </div>
                            </div>

                            {/* Service Fee Tiers Configuration - Add this NEW section */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Service Fee Tiers</h4>
                                <p className="text-sm text-gray-500 mb-4">Configure tiered service fees based on job amount</p>

                                <div className="space-y-4">
                                    {settings.serviceFeeTiers?.map((tier, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-700">From</span>
                                                    <input
                                                        type="number"
                                                        value={tier.min}
                                                        onChange={(e) => {
                                                            const newTiers = [...settings.serviceFeeTiers];
                                                            newTiers[index].min = parseInt(e.target.value) || 0;
                                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                        }}
                                                        className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded text-sm"
                                                        min="0"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">to</span>
                                                    <input
                                                        type="number"
                                                        value={tier.max}
                                                        onChange={(e) => {
                                                            const newTiers = [...settings.serviceFeeTiers];
                                                            newTiers[index].max = parseInt(e.target.value) || 0;
                                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                        }}
                                                        className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded text-sm"
                                                        min="0"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">:</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">Fee:</span>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500">{settings.currencySymbol}</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={tier.fee}
                                                        onChange={(e) => {
                                                            const newTiers = [...settings.serviceFeeTiers];
                                                            newTiers[index].fee = parseInt(e.target.value) || 0;
                                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                        }}
                                                        className="w-full sm:w-32 pl-8 pr-3 py-2 border border-gray-300 rounded text-sm"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newTiers = settings.serviceFeeTiers.filter((_, i) => i !== index);
                                                    handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                                }}
                                                className="text-red-600 hover:text-red-800 p-2 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => {
                                            const newTiers = [...(settings.serviceFeeTiers || [])];
                                            const lastTier = newTiers[newTiers.length - 1];
                                            newTiers.push({
                                                min: lastTier ? lastTier.max + 1 : 0,
                                                max: lastTier ? lastTier.max + 100000 : 100000,
                                                fee: lastTier ? lastTier.fee + 1000 : 1000
                                            });
                                            handleInputChange('financial', 'serviceFeeTiers', newTiers);
                                        }}
                                        className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add New Tier
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Job Settings */}
                    {activeTab === 'jobs' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Default Job Expiry (Days)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={settings.defaultJobExpiryDays}
                                        onChange={(e) => handleInputChange('jobs', 'defaultJobExpiryDays', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Days before unassigned jobs expire</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Photos per Job
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={settings.maxPhotosPerJob}
                                        onChange={(e) => handleInputChange('jobs', 'maxPhotosPerJob', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cancellation Fee Percentage
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={settings.cancellationFeePercentage}
                                            onChange={(e) => handleInputChange('jobs', 'cancellationFeePercentage', parseInt(e.target.value))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span className="text-gray-500">%</span>
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">Fee charged for job cancellation after acceptance</p>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="allowCustomerCancellation"
                                        checked={settings.allowCustomerCancellation}
                                        onChange={(e) => handleInputChange('jobs', 'allowCustomerCancellation', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="allowCustomerCancellation" className="ml-2 block text-sm text-gray-900">
                                        Allow customers to cancel jobs
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="emailNotifications"
                                        checked={settings.emailNotifications}
                                        onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                                        Enable email notifications
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="smsNotifications"
                                        checked={settings.smsNotifications}
                                        onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="smsNotifications" className="ml-2 block text-sm text-gray-900">
                                        Enable SMS notifications
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="pushNotifications"
                                        checked={settings.pushNotifications}
                                        onChange={(e) => handleInputChange('notifications', 'pushNotifications', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">
                                        Enable push notifications
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="sendWelcomeEmail"
                                        checked={settings.sendWelcomeEmail}
                                        onChange={(e) => handleInputChange('notifications', 'sendWelcomeEmail', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="sendWelcomeEmail" className="ml-2 block text-sm text-gray-900">
                                        Send welcome emails to new users
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="requireTwoFactorAuth"
                                        checked={settings.requireTwoFactorAuth}
                                        onChange={(e) => handleInputChange('security', 'requireTwoFactorAuth', e.target.checked)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="requireTwoFactorAuth" className="ml-2 block text-sm text-gray-900">
                                        Require two-factor authentication for admins
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Session Timeout (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="1440"
                                        value={settings.sessionTimeoutMinutes}
                                        onChange={(e) => handleInputChange('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Maximum Login Attempts
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={settings.maxLoginAttempts}
                                        onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">Before account is temporarily locked</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Theme Settings */}
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Primary Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => handleInputChange('theme', 'primaryColor', e.target.value)}
                                            className="w-12 h-12 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.primaryColor}
                                            onChange={(e) => handleInputChange('theme', 'primaryColor', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Secondary Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={settings.secondaryColor}
                                            onChange={(e) => handleInputChange('theme', 'secondaryColor', e.target.value)}
                                            className="w-12 h-12 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.secondaryColor}
                                            onChange={(e) => handleInputChange('theme', 'secondaryColor', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Accent Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={settings.accentColor}
                                            onChange={(e) => handleInputChange('theme', 'accentColor', e.target.value)}
                                            className="w-12 h-12 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.accentColor}
                                            onChange={(e) => handleInputChange('theme', 'accentColor', e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.metaTitle}
                                        onChange={(e) => handleInputChange('theme', 'metaTitle', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meta Description
                                    </label>
                                    <textarea
                                        value={settings.metaDescription}
                                        onChange={(e) => handleInputChange('theme', 'metaDescription', e.target.value)}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meta Keywords
                                    </label>
                                    <textarea
                                        value={settings.metaKeywords}
                                        onChange={(e) => handleInputChange('theme', 'metaKeywords', e.target.value)}
                                        rows="2"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Comma-separated keywords"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logs Tab */}
                    {activeTab === 'logs' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900">Recent Admin Actions</h3>
                                <button
                                    onClick={fetchRecentLogs}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Refresh Logs
                                </button>
                            </div>

                            {logs.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Action
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Admin
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Time
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {logs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {log.action_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900">{log.description}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {log.user_id?.substring(0, 8)}...
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDate(log.created_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No logs available
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Buttons */}
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                        <button
                            onClick={handleResetToDefaults}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Reset to Defaults
                        </button>
                        <button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                'Save Settings'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;