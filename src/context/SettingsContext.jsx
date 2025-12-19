// Update src/context/SettingsContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useSupabase } from './SupabaseContext';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    const { supabase } = useSupabase();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    // Default settings (fallback)
    const defaultSettings = {
        // Platform Info
        platformName: 'Mount',
        platformDescription: 'Home Services Marketplace',
        supportEmail: 'support@Mount.com',
        supportPhone: '+234 800 123 4567',

        // Financial Settings
        platformFeePercentage: 5,
        depositPercentage: 50,
        currency: 'NGN',
        currencySymbol: '₦',

        // Service Fee Tiers (array of objects)
        serviceFeeTiers: [
            { min: 0, max: 30000, fee: 1000 },
            { min: 30001, max: 70000, fee: 2000 },
            { min: 70001, max: 150000, fee: 3500 },
            { min: 150001, max: 300000, fee: 5000 },
            { min: 300001, max: 600000, fee: 7500 },
            { min: 600001, max: 999999999, fee: 10000 }
        ],

        // Promotion Settings
        promotionPeriodMonths: 3,
        isPromotionActive: true,

        // Review Settings
        requireReviewApproval: false,
        allowCompanyResponses: true,
        minimumReviewLength: 10,
        maximumReviewPhotos: 3,

        // Theme Settings
        primaryColor: '#065f46',
        secondaryColor: '#047857',
        accentColor: '#10b981',

        // SEO Settings
        metaTitle: 'Mount - Home Services in Nigeria',
        metaDescription: 'Connect with verified service providers for home repairs and maintenance',
        metaKeywords: 'home services, repairs, maintenance, Nigeria, electrician, plumber'
    };

    // Fetch settings from database
    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                // Convert database rows to settings object
                const settingsObj = {};
                data.forEach(setting => {
                    // Convert value based on type
                    let value = setting.setting_value;

                    switch (setting.setting_type) {
                        case 'boolean':
                            value = value === 'true' || value === true;
                            break;
                        case 'number':
                            value = parseFloat(value);
                            break;
                        case 'json':
                            try {
                                value = JSON.parse(value);
                            } catch {
                                value = value;
                            }
                            break;
                        default:
                            value = value;
                    }

                    settingsObj[setting.setting_key] = value;
                });
                setSettings(settingsObj);
            } else {
                // If no settings in DB, use defaults
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Use defaults if fetch fails
            setSettings(defaultSettings);
        } finally {
            setLoading(false);
        }
    };

    // Calculate service fee based on job amount
    const calculateServiceFee = (jobAmount) => {
        const feeTiers = getSetting('serviceFeeTiers');
        const isPromoActive = getSetting('isPromotionActive');

        if (!feeTiers || !Array.isArray(feeTiers)) {
            return 0;
        }

        // Find the appropriate tier
        const tier = feeTiers.find(t =>
            jobAmount >= t.min && jobAmount <= t.max
        );

        return tier ? tier.fee : 0;
    };

    // Check if customer is in promotion period
    const isCustomerInPromotion = async (customerId) => {
        try {
            const { data: customer, error } = await supabase
                .from('customers')
                .select('first_job_date, promotion_end_date, jobs_count')
                .eq('id', customerId)
                .single();

            if (error || !customer) return false;

            const promotionMonths = getSetting('promotionPeriodMonths');
            const isPromoActive = getSetting('isPromotionActive');

            // If promotion is not active globally
            if (!isPromoActive) return false;

            // If customer hasn't done any job yet
            if (!customer.first_job_date) return true;

            // If promotion end date is set
            if (customer.promotion_end_date) {
                return new Date() <= new Date(customer.promotion_end_date);
            }

            // Calculate promotion end date
            const firstJobDate = new Date(customer.first_job_date);
            const promotionEndDate = new Date(firstJobDate);
            promotionEndDate.setMonth(promotionEndDate.getMonth() + promotionMonths);

            return new Date() <= promotionEndDate;
        } catch (error) {
            console.error('Error checking promotion status:', error);
            return false;
        }
    };

    // Get a setting with fallback to defaults
    const getSetting = (key) => {
        return settings[key] !== undefined ? settings[key] : defaultSettings[key];
    };

    // Update a setting
    const updateSetting = async (key, value, type = 'string') => {
        try {
            let stringValue;

            if (type === 'json') {
                stringValue = JSON.stringify(value);
            } else if (type === 'boolean') {
                stringValue = value.toString();
            } else {
                stringValue = value.toString();
            }

            const { error } = await supabase
                .from('platform_settings')
                .upsert({
                    setting_key: key,
                    setting_value: stringValue,
                    setting_type: type,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'setting_key'
                });

            if (error) throw error;

            // Update local state
            setSettings(prev => ({
                ...prev,
                [key]: value
            }));

            return true;
        } catch (error) {
            console.error('Error updating setting:', error);
            return false;
        }
    };

    // Update multiple settings at once
    const updateMultipleSettings = async (updates) => {
        try {
            const settingsArray = Object.entries(updates).map(([key, value]) => {
                let type = 'string';
                if (typeof value === 'boolean') {
                    type = 'boolean';
                } else if (typeof value === 'number') {
                    type = 'number';
                } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    type = 'json';
                }

                return {
                    setting_key: key,
                    setting_value: type === 'json' ? JSON.stringify(value) : value.toString(),
                    setting_type: type,
                    updated_at: new Date().toISOString()
                };
            });

            const { error } = await supabase
                .from('platform_settings')
                .upsert(settingsArray, {
                    onConflict: 'setting_key'
                });

            if (error) throw error;

            // Update local state
            setSettings(prev => ({
                ...prev,
                ...updates
            }));

            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{
            settings,
            defaultSettings,
            loading,
            getSetting,
            updateSetting,
            updateMultipleSettings,
            refreshSettings: fetchSettings,
            calculateServiceFee,
            isCustomerInPromotion
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};